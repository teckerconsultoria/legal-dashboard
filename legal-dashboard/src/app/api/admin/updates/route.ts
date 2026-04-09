import { NextResponse } from 'next/server'
import { listUpdateRequests, getPendingUpdates, UpdateRequest } from '@/lib/cache'

export async function GET() {
  try {
    const all = listUpdateRequests()
    
    const stats = {
      total: all.length,
      pending: all.filter(u => u.status === 'pending').length,
      completed: all.filter(u => u.status === 'completed').length,
      failed: all.filter(u => u.status === 'failed').length,
      recent: all.slice(0, 20).map(u => ({
        request_id: u.request_id,
        numero_cnj: u.numero_cnj,
        status: u.status,
        solicitado_em: u.solicitado_em,
        concluido_em: u.concluido_em,
        error: u.error,
      })),
    }

    return NextResponse.json(stats)
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}