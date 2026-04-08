import { NextRequest, NextResponse } from 'next/server'

interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  details: Record<string, unknown>
  timestamp: string
  ip: string
}

const MOCK_LOGS: AuditLog[] = Array.from({ length: 50 }, (_, i) => ({
  id: `log-${i + 1}`,
  userId: `user-${(i % 4) + 1}`,
  action: ['LOGIN', 'QUERY', 'VIEW_CASE', 'REQUEST_UPDATE', 'EXPORT'][i % 5],
  resource: `/api/processes`,
  details: { OAB: 'SP123456' },
  timestamp: new Date(Date.now() - i * 3600000).toISOString(),
  ip: `192.168.1.${i + 1}`
}))

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get('userId')
  const action = searchParams.get('action')
  const limit = parseInt(searchParams.get('limit') || '20')

  let logs = [...MOCK_LOGS]

  if (userId) {
    logs = logs.filter(l => l.userId === userId)
  }
  if (action) {
    logs = logs.filter(l => l.action === action)
  }

  return NextResponse.json({
    logs: logs.slice(0, limit),
    total: logs.length
  })
}