import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { chunkText } from "@/lib/rag/chunker";

// Evita erro de default export na build da Vercel/Render
const pdfParse = require("pdf-parse");

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Apenas arquivos PDF são aceitos." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `O arquivo excede o limite máximo de 10MB. Tamanho enviado: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 413 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let pdfData;
    try {
      pdfData = await pdfParse(buffer);
    } catch (err) {
      console.error("Erro ao fazer parse do PDF:", err);
      return NextResponse.json({ error: "Falha ao ler o arquivo PDF. O arquivo pode estar corrompido." }, { status: 400 });
    }

    const text = pdfData.text || "";

    if (text.trim().length < 100) {
      // Salva flag de vazio para que a interface saiba
      await redis.set(`bot:${id}:knowledge`, JSON.stringify({ empty: true }));
      return NextResponse.json(
        { error: "Este PDF parece ser uma imagem escaneada e não pôde ser lido. Tente um PDF com texto selecionável." },
        { status: 400 }
      );
    }

    const chunks = chunkText(text);

    const payload = {
      chunks,
      metadata: {
        filename: file.name,
        uploadedAt: new Date().toISOString(),
        totalChunks: chunks.length,
        fileSizeBytes: file.size,
      },
    };

    await redis.set(`bot:${id}:knowledge`, JSON.stringify(payload));

    return NextResponse.json({ success: true, metadata: payload.metadata });
  } catch (error: any) {
    console.error("[Knowledge Upload Error]:", error);
    return NextResponse.json({ error: "Erro interno do servidor ao processar o PDF." }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const dataStr = await redis.get(`bot:${id}:knowledge`);
    
    if (!dataStr) {
      return NextResponse.json({ metadata: null });
    }

    const data = typeof dataStr === 'string' ? JSON.parse(dataStr) : dataStr;
    
    if (data.empty) {
      return NextResponse.json({ metadata: null, empty: true });
    }

    return NextResponse.json({ metadata: data.metadata });
  } catch (error) {
    console.error("[Knowledge GET Error]:", error);
    return NextResponse.json({ error: "Erro ao buscar a base de conhecimento." }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await redis.del(`bot:${id}:knowledge`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Knowledge DELETE Error]:", error);
    return NextResponse.json({ error: "Erro ao remover a base de conhecimento." }, { status: 500 });
  }
}
