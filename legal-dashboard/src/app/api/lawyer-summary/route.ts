import { NextRequest, NextResponse } from 'next/server'

const MOCK_LAWYER_SUMMARY = {
  nome: "Dr. João Silva Santos",
  tipo: "ADVOGADO",
  quantidade_processos: 156,
  oab_estado: "SP"
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const oab_estado = searchParams.get('oab_estado')
  const oab_numero = searchParams.get('oab_numero')

  if (!oab_estado || !oab_numero) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  await new Promise(r => setTimeout(r, 500))

  return NextResponse.json({
    ...MOCK_LAWYER_SUMMARY,
    oab_estado
  })
}