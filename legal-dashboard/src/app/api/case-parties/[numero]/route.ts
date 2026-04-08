import { NextRequest, NextResponse } from 'next/server'

interface Envolvido {
  id: string
  nome: string
  tipo: 'POLO_ATIVO' | 'POLO_PASSIVO' | 'ADVOGADO' | 'TESTEMUNHA'
  documento?: string
  email?: string
}

const MOCK_ENVOLVIDOS: Envolvido[] = [
  { id: 'env-1', nome: 'Empresa XYZ Ltda', tipo: 'POLO_ATIVO', documento: '12.345.678/0001-90' },
  { id: 'env-2', nome: 'João Silva Santos', tipo: 'POLO_PASSIVO', documento: '***.123.456-**' },
  { id: 'env-3', nome: 'Dr. Carlos Oliveira', tipo: 'ADVOGADO', documento: ' OAB 123456' },
  { id: 'env-4', nome: 'Maria Souza', tipo: 'TESTEMUNHA', documento: '***.789.012-**' },
]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  const { numero: _numero } = await params
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '10')

  return NextResponse.json({
    items: MOCK_ENVOLVIDOS.slice(0, limit),
    total: MOCK_ENVOLVIDOS.length
  })
}