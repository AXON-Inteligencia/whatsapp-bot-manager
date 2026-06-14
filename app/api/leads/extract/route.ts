import { NextResponse } from 'next/server';
import { runLeadExtractionJob } from '@/lib/services/lead-hunter';

// Simulando a obtenção do usuário autenticado (Em prod, use sua lógica de Auth)
// import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { nicho, localizacao } = await req.json();

    if (!nicho || !localizacao) {
      return NextResponse.json(
        { success: false, error: 'Nicho e localização são obrigatórios' }, 
        { status: 400 }
      );
    }

    // Pega o usuário da sessão. Como é um teste, vou fixar um ID genérico por enquanto.
    // const user = await getCurrentUser();
    const userId = "user-admin"; // Temporário para simular

    // Dispara o Job em background sem travar o Frontend
    // Em produção real, você enviaria para uma fila do BullMQ (que já vi que você tem instalado)
    // Aqui, para testes iniciais, chamamos direto sem o await travar a resposta, ou usamos Promise.resolve
    
    // Disparo assíncrono (Fire and Forget)
    runLeadExtractionJob(userId, nicho, localizacao).catch(err => {
      console.error("[Extrator API] Falha na execução em background:", err);
    });

    return NextResponse.json({
      success: true,
      message: 'Sua máquina caçadora foi ativada. O robô está vasculhando a internet em segundo plano. Os leads começarão a aparecer na sua tabela em breve.'
    });

  } catch (error: any) {
    console.error('[Extrator API] Erro no endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno no servidor' }, 
      { status: 500 }
    );
  }
}
