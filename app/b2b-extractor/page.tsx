"use client";

import { useState, useEffect } from 'react';
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Loader2, Factory, ArrowRight, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LeadB2B {
  id: string;
  nicho_busca: string;
  nome_empresa: string;
  nome_socio: string;
  whatsapp: string;
  localidade: string;
  status_disparo: string;
}

export default function B2BExtractorPage() {
  const [nicho, setNicho] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [leads, setLeads] = useState<LeadB2B[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);

  // Campos para o Disparo
  const [templateMsg, setTemplateMsg] = useState('Olá {nome_socio}! Vi que você é responsável pela {nome_empresa} em {cidade}. Gostaríamos de apresentar uma solução...');
  const [sessionId, setSessionId] = useState('7gs9v3z'); // Simulado para demonstração, idealmente vem de um dropdown
  const [isQueueing, setIsQueueing] = useState(false);
  const [useAI, setUseAI] = useState(false);

  const fetchLeads = async () => {
    setIsLoadingLeads(true);
    try {
      const res = await fetch('/api/leads');
      const data = await res.json();
      if (data.success && data.data) {
        setLeads(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    // Um polling básico para atualizar a tabela caso um job background esteja rodando
    const interval = setInterval(fetchLeads, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicho || !localizacao) return;

    setIsExtracting(true);
    try {
      const res = await fetch('/api/leads/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nicho, localizacao })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setTimeout(fetchLeads, 3000); // Tenta buscar depois de 3s
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      alert('Erro de conexão');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleQueue = async () => {
    if (selectedLeads.size === 0) {
      alert('Selecione pelo menos um lead na tabela.');
      return;
    }
    
    setIsQueueing(true);
    try {
      const res = await fetch('/api/leads/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadIds: Array.from(selectedLeads),
          templateMsg,
          sessionId,
          useAI // Envia a flag para o backend
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`${data.queued} leads adicionados à Fila de Disparo com sucesso!`);
        setSelectedLeads(new Set());
        fetchLeads();
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      alert('Erro de conexão ao enviar para a fila');
    } finally {
      setIsQueueing(false);
    }
  };

  const toggleLeadSelection = (id: string) => {
    const newSet = new Set(selectedLeads);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedLeads(newSet);
  };

  const toggleAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map(l => l.id)));
    }
  };

  return (
    <DashboardLayout
      title="Caçador de Leads B2B"
      description="Máquina Extratora de Clientes do Google Maps com Enriquecimento de Dados da Receita Federal."
    >
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Painel de Controle */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="bg-card border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center gap-2">
                <Search className="w-5 h-5" />
                Nova Caçada (Scraping)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleExtract} className="space-y-4">
                <div>
                  <Label htmlFor="nicho">Nicho (O que buscar?)</Label>
                  <Input
                    id="nicho"
                    value={nicho}
                    onChange={(e) => setNicho(e.target.value)}
                    placeholder="Ex: Clínicas Estéticas, Contabilidades..."
                    className="mt-1 bg-background"
                  />
                </div>
                <div>
                  <Label htmlFor="localizacao">Localização</Label>
                  <Input
                    id="localizacao"
                    value={localizacao}
                    onChange={(e) => setLocalizacao(e.target.value)}
                    placeholder="Ex: Curitiba PR, São Paulo..."
                    className="mt-1 bg-background"
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isExtracting || !nicho || !localizacao}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isExtracting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Escaneando o Mapa...</>
                  ) : 'Ativar Robô Extrator'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-card border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
            <CardHeader>
              <CardTitle className="text-green-400 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Motor de Disparo Automático
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                  <Label>Mensagem (Variavéis: {'{nome_socio}'}, {'{nome_empresa}'}, {'{cidade}'})</Label>
                  <textarea
                    value={templateMsg}
                    onChange={(e) => setTemplateMsg(e.target.value)}
                    className="w-full mt-1 bg-background border-border rounded-md p-2 text-sm text-foreground focus:ring-green-500 min-h-[120px]"
                  />
                </div>
                <div className="flex items-center space-x-2 mt-2 bg-purple-500/10 p-3 rounded-md border border-purple-500/20">
                  <input
                    type="checkbox"
                    id="useAI"
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                  />
                  <Label htmlFor="useAI" className="text-purple-300 cursor-pointer flex-1">
                    🤖 Gerar Abordagem com Inteligência Artificial (O texto acima servirá apenas como base para a IA criar uma mensagem única por cliente)
                  </Label>
                </div>
                <Button 
                  onClick={handleQueue}
                  disabled={isQueueing || selectedLeads.size === 0}
                  className="w-full bg-green-600 hover:bg-green-700 text-white mt-4"
                >
                  {isQueueing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Injetando na Fila...</>
                  ) : (
                    <>Disparar para {selectedLeads.size} Leads <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Leads */}
        <div className="xl:col-span-2">
          <Card className="bg-card border-border h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Factory className="w-5 h-5 text-purple-400" />
                Câmara de Leads Validados ({leads.length})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={fetchLeads}>
                <Loader2 className={`w-4 h-4 ${isLoadingLeads ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm text-left text-muted-foreground">
                  <thead className="text-xs text-foreground uppercase bg-muted/50">
                    <tr>
                      <th scope="col" className="p-4">
                        <input type="checkbox" checked={selectedLeads.size === leads.length && leads.length > 0} onChange={toggleAll} className="w-4 h-4 rounded border-gray-300" />
                      </th>
                      <th scope="col" className="px-6 py-3">Empresa</th>
                      <th scope="col" className="px-6 py-3">Sócio-Admin</th>
                      <th scope="col" className="px-6 py-3">WhatsApp</th>
                      <th scope="col" className="px-6 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          Nenhum lead caçado ainda. Ative o robô para preencher seu funil.
                        </td>
                      </tr>
                    ) : (
                      leads.map((lead) => (
                        <tr key={lead.id} className="bg-card border-b border-border hover:bg-muted/30">
                          <td className="p-4">
                            <input 
                              type="checkbox" 
                              checked={selectedLeads.has(lead.id)}
                              onChange={() => toggleLeadSelection(lead.id)}
                              className="w-4 h-4 rounded border-gray-300" 
                            />
                          </td>
                          <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                            {lead.nome_empresa}
                            <div className="text-xs text-muted-foreground font-normal">{lead.localidade}</div>
                          </td>
                          <td className="px-6 py-4 text-purple-400 font-medium">
                            {lead.nome_socio || 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            +{lead.whatsapp}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={lead.status_disparo === 'PENDENTE' ? 'secondary' : lead.status_disparo === 'EM_FILA' ? 'default' : 'outline'}>
                              {lead.status_disparo}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
        
      </div>
    </DashboardLayout>
  );
}
