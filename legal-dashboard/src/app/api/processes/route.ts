import { NextRequest, NextResponse } from 'next/server'

const MOCK_PROCESSES = Array.from({ length: 50 }, (_, i) => ({
  numero: `${String(i + 1).padStart(7, '0')}-18.2023.8.26.00${(i % 9) + 1}`,
  subject: [
    "Ação de Cobrança",
    "Procedimento Comum",
    "Ação de Alimentos",
    "Embargos",
    "Execução Fiscal",
    "Mandado de Segurança",
    "Reclamação Trabalhista",
    "Ação Civil Pública",
    "Divórcio"
  ][i % 9],
  fonte_sigla: ["TJSP", "TJMG", "TJRJ", "TJRS", "TJBA", "TJPE", "TJCE", "TJPR", "TJGO"][i % 9],
  grau: ["1º", "2º"][i % 2]
}))

const DAYS_ARRAY = [2, 5, 8, 12, 15, 22, 28, 35, 42, 55, 78, 95, 120]

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const oab_estado = searchParams.get('oab_estado')
  const oab_numero = searchParams.get('oab_numero')
  const limit = parseInt(searchParams.get('limit') || '100')

  if (!oab_estado || !oab_numero) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
  }

  await new Promise(r => setTimeout(r, 600))

  const items = MOCK_PROCESSES.slice(0, limit)

  const processes = items.map((p, i) => {
    const days = DAYS_ARRAY[i % DAYS_ARRAY.length]
    const status = days <= 30 ? "ATIVO" : "INATIVO"
    return {
      ...p,
      daysSinceLastCheck: days,
      status
    }
  })

  let staleCount = 0
  let activeCount = 0
  let inactiveCount = 0

  processes.forEach(p => {
    if (p.daysSinceLastCheck > 30) staleCount++
    if (p.status === 'ATIVO') activeCount++
    if (p.status === 'INATIVO') inactiveCount++
  })

  const metrics = {
    total: 156,
    stalePercent: Math.round((staleCount / processes.length) * 100),
    activeCount,
    inactiveCount,
    sampleProcessed: processes.length
  }

  return NextResponse.json({ metrics, processes })
}