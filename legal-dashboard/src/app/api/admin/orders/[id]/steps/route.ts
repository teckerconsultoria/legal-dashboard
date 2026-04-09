import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/utils/supabase/server'
import { ErrorCode } from '@/types/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Auth check via cookie (SSR) ou Authorization: Bearer (testes de API)
  const authClient = await createClient()
  const { data: { user: cookieUser } } = await authClient.auth.getUser()

  let user = cookieUser

  if (!user) {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (token) {
      const serviceClient = createServiceClient()
      const { data: { user: tokenUser } } = await serviceClient.auth.getUser(token)
      user = tokenUser
    }
  }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized', code: ErrorCode.UNAUTHORIZED }, { status: 401 })
  }

  const { id: orderId } = await params
  const supabase = createServiceClient()

  const { data: steps, error } = await supabase
    .from('fulfillment_steps')
    .select('id, step_id, layer, status, started_at, completed_at, error, created_at')
    .eq('order_id', orderId)
    .order('layer', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ steps: steps ?? [] })
}
