import { supabase } from '../supabase';

// Define as interfaces para os retornos das APIs
interface LocalResult {
  title: string;
  phone?: string;
  address?: string;
}

/**
 * 1. Extração no Google Maps (Usando SerpApi Local)
 */
export async function fetchGoogleMapsLeads(nicho: string, localizacao: string): Promise<LocalResult[]> {
  const API_KEY = process.env.SERPAPI_KEY;
  if (!API_KEY) {
    console.error("SERPAPI_KEY não configurada.");
    return [];
  }

  try {
    const query = encodeURIComponent(`${nicho} em ${localizacao}`);
    // Busca na API do Google Local (Maps) do SerpApi
    const url = `https://serpapi.com/search.json?engine=google_local&q=${query}&api_key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.local_results) {
      return data.local_results.map((result: any) => ({
        title: result.title,
        phone: result.phone,
        address: result.address
      }));
    }
    return [];
  } catch (error) {
    console.error('[LeadHunter] Erro ao buscar leads no Maps:', error);
    return [];
  }
}

/**
 * 2. Enriquecimento via CNPJ (Minha Receita / Brasil API)
 * Busca a empresa por nome e estado para capturar o Quadro Societário
 */
export async function enrichLeadWithSocio(nomeEmpresa: string, uf: string): Promise<string | null> {
  try {
    // Para fins de POC e velocidade, usamos a API pública do BrasilAPI.
    // Como a BrasilAPI exige o CNPJ exato na rota padrão, e a MinhaReceita permite busca por Razão Social,
    // usaremos a MinhaReceita. Em um ambiente produtivo avançado, você precisaria de um token de API paga
    // para buscas "fuzzy" perfeitas.
    
    // Simplificação usando CNPJ Já ou Minha Receita
    const query = encodeURIComponent(nomeEmpresa);
    // Nota: Minha Receita desativou a busca full-text pública gratuita em alguns momentos.
    // Se falhar, o Fallback 'Responsável' será acionado.
    const response = await fetch(`https://minhareceita.org/busca?q=${query}&uf=${uf}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data && data.hits && data.hits.length > 0) {
        const empresa = data.hits[0];
        // Se a API retornar o quadro de sócios (qsa)
        if (empresa.qsa && empresa.qsa.length > 0) {
          // Pega o nome do primeiro Sócio-Administrador
          return empresa.qsa[0].nome_socio;
        }
      }
    }
    return null;
  } catch (error) {
    console.error(`[LeadHunter] Erro ao enriquecer CNPJ para ${nomeEmpresa}:`, error);
    return null;
  }
}

/**
 * 3. Higienização de Dados (Sanitizer)
 */
export function sanitizeWhatsApp(phone?: string): string | null {
  if (!phone) return null;

  // Remove tudo que não for número
  let clean = phone.replace(/\D/g, '');

  // Se o número começa com 0 (ex: 041999999999), remove o 0
  if (clean.startsWith('0')) {
    clean = clean.substring(1);
  }

  // Verifica se é telefone brasileiro válido com DDD (10 ou 11 dígitos)
  if (clean.length === 10 || clean.length === 11) {
    const isCelular = clean.length === 11 && clean[2] === '9';
    // Se for 10 dígitos (fixo) e não for um número que aceita WhatsApp comercial, podemos descartar.
    // Mas para abranger WhatsApp Business, deixamos passar.
    
    // Se não tiver o 55 do Brasil, adiciona
    return `55${clean}`;
  }

  // Se já vier com 55 (ex: 5541999999999)
  if (clean.length === 12 || clean.length === 13) {
    if (clean.startsWith('55')) return clean;
  }

  return null;
}

/**
 * 4. Orquestrador Principal (Background Job)
 */
export async function runLeadExtractionJob(userId: string, nicho: string, localizacao: string) {
  console.log(`[LeadHunter] Iniciando caçada: ${nicho} em ${localizacao}`);
  
  const rawLeads = await fetchGoogleMapsLeads(nicho, localizacao);
  console.log(`[LeadHunter] Encontrados ${rawLeads.length} estabelecimentos.`);
  
  let leadsSalvos = 0;

  // UF simulado extraído da string de localização (ex: "Curitiba, PR" -> "PR")
  const ufMatch = localizacao.match(/\b([A-Z]{2})\b/);
  const uf = ufMatch ? ufMatch[1] : 'SP'; // Fallback genérico

  for (const raw of rawLeads) {
    const zapLimpo = sanitizeWhatsApp(raw.phone);
    if (!zapLimpo) continue; // Pula fixos/inválidos que não passaram no filtro

    const nomeSocio = await enrichLeadWithSocio(raw.title, uf);

    // Insere no banco de dados (Supabase)
    const { error } = await supabase
      .from('leads_b2b')
      .insert([{
        user_id: userId,
        nicho_busca: nicho,
        nome_empresa: raw.title,
        nome_socio: nomeSocio || 'Responsável',
        whatsapp: zapLimpo,
        localidade: localizacao,
        status_disparo: 'PENDENTE'
      }]);

    if (!error) {
      leadsSalvos++;
    } else {
      console.error(`[LeadHunter] Erro ao salvar lead ${raw.title}:`, error);
    }
  }
  
  console.log(`[LeadHunter] Caçada concluída! ${leadsSalvos} leads higienizados e salvos.`);
  return leadsSalvos;
}
