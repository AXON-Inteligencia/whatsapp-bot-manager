import { NextResponse } from "next/server"
import { getAdminStats } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stats = await getAdminStats()
    return NextResponse.json(stats)
  } catch (error) {
    console.error("Erro ao buscar estatísticas na API:", error)
    return NextResponse.json(
      { error: "Erro interno ao buscar estatísticas" },
      { status: 500 }
    )
  }
}
