import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  return NextResponse.json({ 
    hasToken: !!token, 
    prefix: token ? token.substring(0, 15) : 'none' 
  });
}
