import { NextRequest, NextResponse } from 'next/server'

interface Documento {
  id: string
  tipo: string
  descricao: string
  data: string
  pagina: number
}

const MOCK_DOCUMENTOS: Documento[] = [
  { id: 'doc-1', tipo: 'Petição', descricao: 'Petição inicial', data: '2026-01-15', pagina: 1 },
  { id: 'doc-2', tipo: 'Decisão', descricao: 'Decisão de recebimento', data: '2026-02-10', pagina: 1 },
  { id: 'doc-3', tipo: 'Manifestação', descricao: 'Manifestação da parte contrária', data: '2026-03-05', pagina: 2 },
  { id: 'doc-4', tipo: 'Audiência', descricao: ' ata de audiência', data: '2026-03-20', pagina: 1 },
  { id: 'doc-5', tipo: 'Sentença', descricao: 'Sentença de mérito', data: '2026-04-01', pagina: 15 },
]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  const { numero: _numero } = await params
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get('limit') || '10')

  return NextResponse.json({
    items: MOCK_DOCUMENTOS.slice(0, limit),
    total: MOCK_DOCUMENTOS.length
  })
}