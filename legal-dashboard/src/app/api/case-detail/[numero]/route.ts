import { NextRequest, NextResponse } from 'next/server'

const MOCK_MOVIMENTACOES = [
  { data: "08/04/2026", tipo: "Andamento", conteudo: "Julgado procedido. Sentença publicada." },
  { data: "05/04/2026", tipo: "Decisão", conteudo: "Recebimento da inicial. Distribuído para a Vara X." },
  { data: "28/03/2026", tipo: "Intimação", conteudo: "Citação electronica有效. Prazo para defesa iniciado." },
  { data: "20/03/2026", tipo: "Andamento", conteudo: "Audiência redesignada para nova data." },
  { data: "15/03/2026", tipo: "Decisão", conteudo: "Diligência cumplida. Certifico." },
  { data: "10/03/2026", tipo: "Andamento", conteudo: "Autos físicos encaminhados ao contador." },
  { data: "02/03/2026", tipo: "Petição", conteudo: "Petição de cumprimento protocolada." },
  { data: "25/02/2026", tipo: "Andamento", conteudo: "Recebimento dos autos físicos." },
  { data: "18/02/2026", tipo: "Decisão", conteudo: "Determinação de diligência." },
  { data: "10/02/2026", tipo: "Andamento", conteudo: "Distribuição realizada." }
]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  const { numero } = await params
  
  await new Promise(r => setTimeout(r, 600))

  const days = Math.floor(Math.random() * 60) + 1
  const status = days <= 30 ? "ATIVO" : "INATIVO"
  const date = new Date()
  date.setDate(date.getDate() - days)

  const statusData = {
    data_ultima_verificacao: date.toISOString(),
    ultima_verificacao: {
      status,
      solicitado_em: date.toISOString(),
      concluido_em: date.toISOString()
    }
  }

  const movimentacoes = {
    items: MOCK_MOVIMENTACOES
  }

  const capa = {
    numero,
    subject: "Ação de Cobrança",
    classe: "Procedimento Comum",
    vara: "1ª Vara Cível",
    natureza: "Cível",
    valor_causa: "R$ 50.000,00",
    polo_ativo: "Empresa XYZ Ltda",
    polo_passivo: "João Silva Santos"
  }

  return NextResponse.json({ capa, movimentacoes, status: statusData })
}