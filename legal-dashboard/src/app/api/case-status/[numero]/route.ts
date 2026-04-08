import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  const { numero: _numero } = await params
  
  await new Promise(r => setTimeout(r, 400))

  const days = Math.floor(Math.random() * 60) + 1
  const statusOptions = ['PENDENTE', 'SUCESSO', 'NAO_ENCONTRADO', 'ERRO']
  const jobStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)]
  
  const date = new Date()
  date.setDate(date.getDate() - days)

  return NextResponse.json({
    data_ultima_verificacao: date.toISOString(),
    tempo_desde_ultima_verificacao: `há ${days} dias`,
    ultima_verificacao: jobStatus !== 'PENDENTE' ? {
      status: jobStatus,
      solicitado_em: date.toISOString(),
      concluido_em: date.toISOString()
    } : null
  })
}