import { z } from 'zod'
import type { ErrorCode } from './errors'

// ─── StepFn ────────────────────────────────────────────────────────────────
// Enum fixo — banco não inventa funções. Alinhado com EscavadorClient.

export const StepFnValues = [
  'getLawyerSummary',
  'getProcesses',
  'getMovimentacoes',
  'getCaseCNJ',
  'getEnvolvidos',
  'getDocumentosPublicos',
  'getStatusAtualizacao',
  'requestUpdate',
] as const

export type StepFn = typeof StepFnValues[number]

// ─── FulfillmentSchema Zod ─────────────────────────────────────────────────
// Validado no início de processOrder*. Se inválido, pedido vai para dead imediatamente.

// ─── Condition (D-02) ─────────────────────────────────────────────────────
// Objeto estruturado — sem eval, parse seguro, extensível.

export const ConditionFieldValues = ['staleness_days', 'process_count', 'last_movement_days'] as const
export type ConditionField = typeof ConditionFieldValues[number]

export const ConditionOpValues = ['>', '<', '>=', '<=', '=='] as const
export type ConditionOp = typeof ConditionOpValues[number]

export const ConditionSchema = z.object({
  field: z.enum(ConditionFieldValues),
  op: z.enum(ConditionOpValues),
  value: z.number(),
})
export type Condition = z.infer<typeof ConditionSchema>

// ─── StepDefinition ────────────────────────────────────────────────────────

export const StepDefinitionZod = z.object({
  id: z.string().min(1),
  fn: z.enum(StepFnValues),
  section: z.string().nullable(),
  layer: z.union([z.literal(1), z.literal(2)]),
  params: z.record(z.string(), z.unknown()).optional(),
  // JSONPath parcial: ex "processes.items[*].numero"
  foreach: z.string().optional(),
  // Limite de iterações no foreach (evita processar N ilimitado de processos)
  foreach_limit: z.number().int().positive().optional(),
  // Condição estruturada — ex: { field: 'staleness_days', op: '>', value: 60 }
  condition: ConditionSchema.optional(),
})

export const FulfillmentSchemaZod = z.object({
  version: z.string(),
  // true = executa sync no webhook; false = enfileira para cron
  sync: z.boolean().default(false),
  required_inputs: z.array(
    z.enum(['oab_estado', 'oab_numero', 'numero_cnj'])
  ).min(1),
  steps: z.array(StepDefinitionZod).min(1),
  output_schema: z.object({
    sections: z.array(z.string()),
  }),
})

// ─── Tipos derivados ───────────────────────────────────────────────────────

export type StepDefinition = z.infer<typeof StepDefinitionZod>
export type FulfillmentSchema = z.infer<typeof FulfillmentSchemaZod>

export type RequiredInput = FulfillmentSchema['required_inputs'][number]

// ─── Status de execução ────────────────────────────────────────────────────

export type StepStatus = 'pending' | 'running' | 'done' | 'failed'
export type QueueStatus = 'pending' | 'processing' | 'done' | 'dead'
export type CompletionStatus = 'pending' | 'complete' | 'partial' | 'failed'

// ─── Resultado do fulfillment ──────────────────────────────────────────────

export interface FulfillmentResult {
  orderId: string
  completionStatus: CompletionStatus
  stepsTotal: number
  stepsDone: number
  stepsFailed: number
}

// ─── DB row types ──────────────────────────────────────────────────────────

export interface FulfillmentQueueRow {
  id: string
  order_id: string
  status: QueueStatus
  attempt_count: number
  next_retry_at: string
  last_error: { error: string; code: ErrorCode } | null
  scheduled_at: string
  created_at: string
}

export interface FulfillmentStepRow {
  id: string
  order_id: string
  step_id: string
  layer: 1 | 2
  status: StepStatus
  result: Record<string, unknown> | null
  error: { error: string; code: ErrorCode } | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface OrderReportRow {
  id: string
  order_id: string
  sections: Record<string, unknown>
  metadata: {
    escavador_version?: string
    timestamp_fetched?: string
    credits_used_by_step?: Record<string, number>
  }
  completion_status: CompletionStatus
  access_token: string
  access_token_expires_at: string
  created_at: string
  updated_at: string
}
