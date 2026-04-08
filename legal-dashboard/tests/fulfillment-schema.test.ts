import { describe, it, expect } from 'vitest'
import { FulfillmentSchemaZod, StepFnValues, ConditionSchema } from '@/types/fulfillment'

// Schema mínimo válido
const baseSchema = {
  version: '1.0',
  sync: true,
  required_inputs: ['oab_estado', 'oab_numero'],
  steps: [
    {
      id: 'lawyer_summary',
      fn: 'getLawyerSummary',
      section: 'resumo_advogado',
      layer: 1,
    },
  ],
  output_schema: { sections: ['resumo_advogado'] },
}

describe('FulfillmentSchemaZod', () => {
  describe('valid schemas', () => {
    it('parses a minimal valid schema', () => {
      const result = FulfillmentSchemaZod.safeParse(baseSchema)
      expect(result.success).toBe(true)
    })

    it('parses a schema with layer 2 foreach step', () => {
      const schema = {
        ...baseSchema,
        sync: false,
        steps: [
          ...baseSchema.steps,
          {
            id: 'movimentacoes',
            fn: 'getMovimentacoes',
            section: 'movimentacoes',
            layer: 2,
            foreach: 'carteira.items[*].numero_cnj',
            foreach_limit: 20,
            params: { limit: 100 },
          },
        ],
        output_schema: { sections: ['resumo_advogado', 'movimentacoes'] },
      }
      const result = FulfillmentSchemaZod.safeParse(schema)
      expect(result.success).toBe(true)
    })

    it('parses a schema with numero_cnj required_input', () => {
      const schema = {
        version: '1.0',
        sync: true,
        required_inputs: ['numero_cnj'],
        steps: [
          { id: 'case_cnj', fn: 'getCaseCNJ', section: 'capa', layer: 1 },
        ],
        output_schema: { sections: ['capa'] },
      }
      const result = FulfillmentSchemaZod.safeParse(schema)
      expect(result.success).toBe(true)
    })

    it('parses a step with null section (requestUpdate) and structured condition', () => {
      const schema = {
        ...baseSchema,
        steps: [
          ...baseSchema.steps,
          {
            id: 'request_update',
            fn: 'requestUpdate',
            section: null,
            layer: 2,
            foreach: 'processes.items[*].numero',
            condition: { field: 'staleness_days', op: '>', value: 60 },
          },
        ],
      }
      const result = FulfillmentSchemaZod.safeParse(schema)
      expect(result.success).toBe(true)
    })

    it('defaults sync to false when omitted', () => {
      const { sync: _omitted, ...schemaWithoutSync } = baseSchema
      const result = FulfillmentSchemaZod.safeParse(schemaWithoutSync)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.sync).toBe(false)
      }
    })

    it('accepts all valid StepFn values', () => {
      for (const fn of StepFnValues) {
        const schema = {
          ...baseSchema,
          steps: [{ id: `step_${fn}`, fn, section: 'test', layer: 1 as const }],
        }
        const result = FulfillmentSchemaZod.safeParse(schema)
        expect(result.success, `fn "${fn}" should be valid`).toBe(true)
      }
    })
  })

  describe('invalid schemas', () => {
    it('rejects missing version', () => {
      const { version: _omitted, ...schema } = baseSchema
      const result = FulfillmentSchemaZod.safeParse(schema)
      expect(result.success).toBe(false)
    })

    it('rejects empty steps array', () => {
      const result = FulfillmentSchemaZod.safeParse({ ...baseSchema, steps: [] })
      expect(result.success).toBe(false)
    })

    it('rejects unknown fn value', () => {
      const schema = {
        ...baseSchema,
        steps: [{ id: 'bad_step', fn: 'unknownFn', section: 'x', layer: 1 }],
      }
      const result = FulfillmentSchemaZod.safeParse(schema)
      expect(result.success).toBe(false)
    })

    it('rejects invalid required_input value', () => {
      const result = FulfillmentSchemaZod.safeParse({
        ...baseSchema,
        required_inputs: ['cpf'],
      })
      expect(result.success).toBe(false)
    })

    it('rejects invalid layer value (3)', () => {
      const schema = {
        ...baseSchema,
        steps: [{ id: 's', fn: 'getLawyerSummary', section: 'x', layer: 3 }],
      }
      const result = FulfillmentSchemaZod.safeParse(schema)
      expect(result.success).toBe(false)
    })

    it('rejects step with empty id', () => {
      const schema = {
        ...baseSchema,
        steps: [{ id: '', fn: 'getLawyerSummary', section: 'x', layer: 1 }],
      }
      const result = FulfillmentSchemaZod.safeParse(schema)
      expect(result.success).toBe(false)
    })

    it('rejects empty required_inputs array', () => {
      const result = FulfillmentSchemaZod.safeParse({
        ...baseSchema,
        required_inputs: [],
      })
      expect(result.success).toBe(false)
    })

    it('rejects condition with unknown field', () => {
      const schema = {
        ...baseSchema,
        steps: [
          {
            ...baseSchema.steps[0],
            condition: { field: 'unknown_field', op: '>', value: 30 },
          },
        ],
      }
      const result = FulfillmentSchemaZod.safeParse(schema)
      expect(result.success).toBe(false)
    })

    it('rejects condition with unknown op', () => {
      const schema = {
        ...baseSchema,
        steps: [
          {
            ...baseSchema.steps[0],
            condition: { field: 'staleness_days', op: '!=', value: 30 },
          },
        ],
      }
      const result = FulfillmentSchemaZod.safeParse(schema)
      expect(result.success).toBe(false)
    })
  })

  describe('ConditionSchema', () => {
    it('parses a valid condition', () => {
      const result = ConditionSchema.safeParse({ field: 'staleness_days', op: '>', value: 60 })
      expect(result.success).toBe(true)
    })

    it('parses all valid ops', () => {
      const ops = ['>', '<', '>=', '<=', '=='] as const
      for (const op of ops) {
        const result = ConditionSchema.safeParse({ field: 'staleness_days', op, value: 30 })
        expect(result.success, `op "${op}" should be valid`).toBe(true)
      }
    })

    it('parses all valid fields', () => {
      const fields = ['staleness_days', 'process_count', 'last_movement_days'] as const
      for (const field of fields) {
        const result = ConditionSchema.safeParse({ field, op: '>', value: 10 })
        expect(result.success, `field "${field}" should be valid`).toBe(true)
      }
    })
  })
})
