import { createServiceClient } from '@/utils/supabase/server'
import { createEscavadorClient } from '@/lib/escavador'
import { maskCPF, maskName } from '@/lib/lgpd'
import { sendOrderDelivered } from '@/lib/mailer'
import {
  FulfillmentSchemaZod,
  StepDefinition,
  FulfillmentResult,
  CompletionStatus,
  type Condition,
} from '@/types/fulfillment'
import { ErrorCode } from '@/types/errors'
import type { SupabaseClient } from '@supabase/supabase-js'

// ─── processBatch ──────────────────────────────────────────────────────────

export async function processBatch<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  batchSize = 5
): Promise<PromiseSettledResult<void>[]> {
  const results: PromiseSettledResult<void>[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    results.push(...(await Promise.allSettled(batch.map(fn))))
  }
  return results
}

// ─── enqueueOrder ──────────────────────────────────────────────────────────

export async function enqueueOrder(orderId: string): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase.from('fulfillment_queue').insert({
    order_id: orderId,
    status: 'pending',
    scheduled_at: new Date().toISOString(),
  })
  // UNIQUE constraint — conflict = already queued, which is correct
  if (error && error.code !== '23505') {
    throw new Error(`enqueueOrder failed: ${error.message}`)
  }
}

// ─── LGPD masking ──────────────────────────────────────────────────────────

function maskResult(result: unknown): unknown {
  if (!result || typeof result !== 'object') return result
  const obj = result as Record<string, unknown>

  // Mask envolvidos
  if (Array.isArray(obj.items)) {
    obj.items = obj.items.map((item: unknown) => {
      if (!item || typeof item !== 'object') return item
      const i = { ...(item as Record<string, unknown>) }
      if (typeof i.nome === 'string') i.nome = maskName(i.nome)
      if (typeof i.cpf_cnpj === 'string') {
        i.cpf_cnpj = i.cpf_cnpj.replace(/\D/g, '').length === 11
          ? maskCPF(i.cpf_cnpj)
          : '**.**.**/****-**'
      }
      return i
    })
  }

  return obj
}

// ─── condition evaluator ────────────────────────────────────────────────────

const ops: Record<string, (a: number, b: number) => boolean> = {
  '>': (a, b) => a > b,
  '<': (a, b) => a < b,
  '>=': (a, b) => a >= b,
  '<=': (a, b) => a <= b,
  '==': (a, b) => a === b,
}

function evalCondition(cond: Condition, stepResult: Record<string, unknown>): boolean {
  const fieldValue = stepResult[cond.field]
  if (typeof fieldValue !== 'number') return false
  return ops[cond.op]?.(fieldValue, cond.value) ?? false
}

// ─── foreach resolver ───────────────────────────────────────────────────────
// Extrai lista de CNJs do resultado do step pai.
// foreach = "processes.items[*].numero" → lê step "processes", pega items[*].numero

function resolveForeach(
  foreach: string,
  foreach_limit: number | undefined,
  completedStepResults: Map<string, unknown>
): string[] {
  // Parse "processes.items[*].numero" → stepId="processes", field="items", key="numero"
  const match = foreach.match(/^(\w+)\.items\[\*\]\.(\w+)$/)
  if (!match) return []

  const [, stepId, key] = match
  const stepResult = completedStepResults.get(stepId)
  if (!stepResult || typeof stepResult !== 'object') return []

  const items = (stepResult as Record<string, unknown>).items
  if (!Array.isArray(items)) return []

  const values = items
    .map((item: unknown) => {
      if (!item || typeof item !== 'object') return null
      return String((item as Record<string, unknown>)[key] ?? '')
    })
    .filter(Boolean) as string[]

  return foreach_limit ? values.slice(0, foreach_limit) : values
}

// ─── dispatchStepFn ─────────────────────────────────────────────────────────
// Switch fixo de StepFn → método EscavadorClient. Sem eval.

async function dispatchStepFn(
  step: StepDefinition,
  inputs: { oab_estado?: string; oab_numero?: string; numero_cnj?: string },
  cnj: string | null,
  client: ReturnType<typeof createEscavadorClient>
): Promise<unknown> {
  const limit = typeof step.params?.limit === 'number' ? step.params.limit : undefined

  switch (step.fn) {
    case 'getLawyerSummary':
      return client.getLawyerSummary(inputs.oab_estado!, inputs.oab_numero!)

    case 'getProcesses':
      return client.getProcesses(inputs.oab_estado!, inputs.oab_numero!, {
        limit: limit ?? 100,
      })

    case 'getMovimentacoes':
      return client.getMovimentacoes(cnj!, limit ?? 100)

    case 'getCaseCNJ':
      return client.getCaseCNJ(cnj!)

    case 'getEnvolvidos':
      return client.getEnvolvidos(cnj!, limit ?? 50)

    case 'getDocumentosPublicos':
      return client.getDocumentosPublicos(cnj!, limit ?? 50)

    case 'getStatusAtualizacao':
      return client.getStatusAtualizacao(cnj!)

    case 'requestUpdate':
      return client.requestUpdate(cnj!)

    default: {
      const _never: never = step.fn
      throw new Error(`Unknown StepFn: ${_never}`)
    }
  }
}

// ─── executeStep ────────────────────────────────────────────────────────────

export async function executeStep(
  orderId: string,
  step: StepDefinition,
  inputs: { oab_estado?: string; oab_numero?: string; numero_cnj?: string },
  cnj: string | null,
  completedStepResults: Map<string, unknown>,
  supabase: SupabaseClient
): Promise<void> {
  const token = process.env.ESCAVADOR_API_TOKEN
  if (!token) throw new Error('ESCAVADOR_API_TOKEN not set')

  // Idempotência: só executa se step ainda está pending
  const { data: claimed } = await supabase
    .from('fulfillment_steps')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .eq('order_id', orderId)
    .eq('step_id', cnj ? `${step.id}:${cnj}` : step.id)
    .eq('status', 'pending')
    .select('id')

  if (!claimed?.length) return // outro worker já clamou — skip seguro

  const stepId = cnj ? `${step.id}:${cnj}` : step.id

  // Avaliar condition (se presente)
  if (step.condition) {
    const parentResult = completedStepResults.get(step.id.split(':')[0])
    if (parentResult && typeof parentResult === 'object') {
      const shouldRun = evalCondition(step.condition, parentResult as Record<string, unknown>)
      if (!shouldRun) {
        // Condição não satisfeita — marcar como done com result null
        await supabase
          .from('fulfillment_steps')
          .update({ status: 'done', completed_at: new Date().toISOString(), result: null })
          .eq('order_id', orderId)
          .eq('step_id', stepId)
        return
      }
    }
  }

  try {
    const client = createEscavadorClient(token)
    const raw = await dispatchStepFn(step, inputs, cnj, client)
    const masked = maskResult(raw)

    await supabase
      .from('fulfillment_steps')
      .update({
        status: 'done',
        result: masked as Record<string, unknown>,
        completed_at: new Date().toISOString(),
      })
      .eq('order_id', orderId)
      .eq('step_id', stepId)

    // Salvar resultado para resolução de foreach de steps filhos
    completedStepResults.set(step.id, masked)
  } catch (err) {
    await supabase
      .from('fulfillment_steps')
      .update({
        status: 'failed',
        error: {
          error: err instanceof Error ? err.message : 'Unknown error',
          code: ErrorCode.STEP_FAILED,
        },
        completed_at: new Date().toISOString(),
      })
      .eq('order_id', orderId)
      .eq('step_id', stepId)
    // Não re-throw — processBatch + allSettled cuida do resultado agregado
  }
}

// ─── initFulfillmentSteps ───────────────────────────────────────────────────
// Cria rows pending para todos os steps antes de executar.
// Idempotente: ON CONFLICT DO NOTHING.

async function initFulfillmentSteps(
  orderId: string,
  steps: StepDefinition[],
  inputs: { oab_estado?: string; oab_numero?: string; numero_cnj?: string },
  supabase: SupabaseClient
): Promise<void> {
  const rows = steps.map(step => ({
    order_id: orderId,
    step_id: step.id,
    layer: step.layer,
    status: 'pending' as const,
  }))

  if (rows.length) {
    await supabase.from('fulfillment_steps').upsert(rows, {
      onConflict: 'order_id,step_id',
      ignoreDuplicates: true,
    })
  }

  // Para steps com foreach, os step_id concretos são inicializados dinamicamente
  // após a execução do step pai (Layer 1)
  void inputs
}

// ─── processOrder (orquestrador) ────────────────────────────────────────────

async function processOrder(orderId: string, supabase: SupabaseClient): Promise<FulfillmentResult> {
  // 1. Carregar order + sku com fulfillment_schema
  const { data: order } = await supabase
    .from('orders')
    .select(`
      id, status, customer_email, target_oab_estado, target_oab_numero, target_numero_cnj,
      order_items ( sku_id, sku:sku_catalog ( id, name, fulfillment_schema ) )
    `)
    .eq('id', orderId)
    .single()

  if (!order) {
    throw Object.assign(new Error('Order not found'), { code: ErrorCode.ORDER_NOT_FOUND })
  }

  // Guard: order terminal — retorna idempotente sem reprocessar
  if (order.status === 'delivered' || order.status === 'failed') {
    const { data: existingSteps } = await supabase
      .from('fulfillment_steps')
      .select('status')
      .eq('order_id', orderId)
    const existingAll = existingSteps ?? []
    return {
      orderId,
      completionStatus: order.status === 'delivered' ? 'complete' : 'failed',
      stepsTotal: existingAll.length,
      stepsDone: existingAll.filter(s => s.status === 'done').length,
      stepsFailed: existingAll.filter(s => s.status === 'failed').length,
    }
  }

  // 2. Extrair SKU e validar schema
  const item = (order.order_items as unknown[])?.[0] as {
    sku: { id: string; name: string; fulfillment_schema: unknown }
  } | undefined

  if (!item?.sku?.fulfillment_schema) {
    throw Object.assign(new Error('SKU fulfillment_schema not found'), { code: ErrorCode.SCHEMA_INVALID })
  }

  const schemaResult = FulfillmentSchemaZod.safeParse(item.sku.fulfillment_schema)
  if (!schemaResult.success) {
    throw Object.assign(
      new Error(`Invalid fulfillment_schema: ${schemaResult.error.message}`),
      { code: ErrorCode.SCHEMA_INVALID }
    )
  }

  const schema = schemaResult.data
  const inputs = {
    oab_estado: order.target_oab_estado ?? undefined,
    oab_numero: order.target_oab_numero ?? undefined,
    numero_cnj: order.target_numero_cnj ?? undefined,
  }

  // 3. Validar required_inputs
  for (const req of schema.required_inputs) {
    if (!inputs[req as keyof typeof inputs]) {
      throw Object.assign(
        new Error(`Missing required input: ${req}`),
        { code: ErrorCode.MISSING_INPUTS }
      )
    }
  }

  // 4. Criar order_report (upsert idempotente)
  await supabase.from('order_reports').upsert(
    { order_id: orderId, completion_status: 'pending' },
    { onConflict: 'order_id', ignoreDuplicates: true }
  )

  // 5. Transição paid → processing (skip se já está processing — retry seguro)
  if (order.status === 'paid') {
    await supabase
      .from('orders')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('status', 'paid')
  }

  // 6. Inicializar steps de Layer 1
  const layer1 = schema.steps.filter(s => s.layer === 1)
  const layer2 = schema.steps.filter(s => s.layer === 2)
  await initFulfillmentSteps(orderId, layer1, inputs, supabase)

  // 7. Executar Layer 1 em paralelo
  const completedStepResults = new Map<string, unknown>()
  await Promise.all(
    layer1.map(step =>
      executeStep(orderId, step, inputs, null, completedStepResults, supabase)
    )
  )

  // Pré-carregar Layer 1 done do DB para resiliência em retry
  // (executeStep retorna early se já claimed → Map não é populado)
  const { data: doneLayer1 } = await supabase
    .from('fulfillment_steps')
    .select('step_id, result')
    .eq('order_id', orderId)
    .eq('layer', 1)
    .eq('status', 'done')

  for (const row of doneLayer1 ?? []) {
    if (row.result && !completedStepResults.has(row.step_id)) {
      completedStepResults.set(row.step_id, row.result)
    }
  }

  // 8. Expandir e executar Layer 2 (foreach em lotes de 5)
  if (layer2.length) {
    const layer2Tasks: Array<() => Promise<void>> = []

    for (const step of layer2) {
      if (step.foreach) {
        const cnjs = resolveForeach(step.foreach, step.foreach_limit, completedStepResults)

        // Inicializar step rows concretos (um por CNJ)
        const concreteRows = cnjs.map(cnj => ({
          order_id: orderId,
          step_id: `${step.id}:${cnj}`,
          layer: step.layer,
          status: 'pending' as const,
        }))
        if (concreteRows.length) {
          await supabase.from('fulfillment_steps').upsert(concreteRows, {
            onConflict: 'order_id,step_id',
            ignoreDuplicates: true,
          })
        }

        for (const cnj of cnjs) {
          layer2Tasks.push(() =>
            executeStep(orderId, step, inputs, cnj, completedStepResults, supabase)
          )
        }
      } else {
        // Step de Layer 2 sem foreach (raro, mas suportado)
        await initFulfillmentSteps(orderId, [step], inputs, supabase)
        layer2Tasks.push(() =>
          executeStep(orderId, step, inputs, inputs.numero_cnj ?? null, completedStepResults, supabase)
        )
      }
    }

    await processBatch(layer2Tasks, fn => fn(), 5)
  }

  // 9. Calcular completion_status
  const { data: allSteps } = await supabase
    .from('fulfillment_steps')
    .select('status')
    .eq('order_id', orderId)

  const steps = allSteps ?? []
  const total = steps.length
  const done = steps.filter(s => s.status === 'done').length
  const failed = steps.filter(s => s.status === 'failed').length

  const completionStatus: CompletionStatus =
    failed === 0 ? 'complete' : done === 0 ? 'failed' : 'partial'

  // 10. Atualizar order_reports
  const sections: Record<string, unknown> = {}
  for (const [stepId, result] of completedStepResults) {
    const step = schema.steps.find(s => s.id === stepId)
    if (step?.section) sections[step.section] = result
  }

  await supabase
    .from('order_reports')
    .update({
      sections,
      completion_status: completionStatus,
      metadata: { timestamp_fetched: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    })
    .eq('order_id', orderId)

  // 11. Transição processing → delivered | failed
  const finalStatus = completionStatus === 'failed' ? 'failed' : 'delivered'
  await supabase
    .from('orders')
    .update({ status: finalStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  // 12. Email de entrega (se tiver email e report completo/parcial)
  if (order.customer_email && completionStatus !== 'failed') {
    const { data: report } = await supabase
      .from('order_reports')
      .select('access_token')
      .eq('order_id', orderId)
      .single()

    if (report?.access_token) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
      await sendOrderDelivered({
        to: order.customer_email,
        orderNumber: orderId.slice(-8).toUpperCase(),
        skuName: item.sku.name,
        dashboardUrl: `${baseUrl}/meus-reports?token=${report.access_token}`,
      }).catch(err => console.error('[fulfillment-engine] email error:', err))
    }
  }

  return { orderId, completionStatus, stepsTotal: total, stepsDone: done, stepsFailed: failed }
}

// ─── Wrappers públicos ───────────────────────────────────────────────────────

export async function processOrderSync(orderId: string): Promise<FulfillmentResult> {
  const supabase = createServiceClient()
  return processOrder(orderId, supabase)
}

export async function processOrderAsync(orderId: string): Promise<FulfillmentResult> {
  const supabase = createServiceClient()
  return processOrder(orderId, supabase)
}
