import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ numero: string }> }
) {
  const { numero } = await params
  
  try {
    const body = await request.json()
    const { enviar_callback, documentos_publicos, autos } = body

    await new Promise(r => setTimeout(r, 800))

    const jobId = `JOB-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    return NextResponse.json({
      id: jobId,
      status: 'PENDENTE',
      numero_processo: numero,
      documentos_publicos: documentos_publicos || false,
      autos: autos || false,
      enviar_callback: enviar_callback || false,
      solicitado_em: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}