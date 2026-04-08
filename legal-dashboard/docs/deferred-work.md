# Deferred Work

## Deferred from: code review of 001-fulfillment-foundation (2026-04-08)

- W-01: `requestUpdate` sem idempotência na Escavador API — em foreach de até 30 CNJs, retry do job redispara POSTs já executados. Resolver no fulfillment-engine verificando `getStatusAtualizacao` antes de `requestUpdate`.
- W-02: `FulfillmentResult` sem campo de erro/`ErrorCode` — chamador recebe `completionStatus: 'failed'` sem saber qual `ErrorCode` causou. Adicionar `errors?: ApiError[]` quando fulfillment-engine for implementado.
- W-03: `orders.status` sem CHECK constraint no banco — pré-existente desde migration 001; corrigir numa migration de hardening futura.
- W-04: `access_token` armazenado em texto plano sem hash nem revogação por uso — MVP aceitável; considerar hash HMAC se dados se tornarem mais sensíveis.
- W-05: Gap na sequência de migrations (003 ausente) — by design (migration 003 não foi necessária); documentar num README de migrations se causar confusão.
- W-06: `fulfillment_queue UNIQUE(order_id)` bloqueia reenqueue após `dead` — intencional; operador deve `DELETE FROM fulfillment_queue WHERE order_id = X` antes de reenfileirar. Documentar no ops runbook.
- W-07: RLS default-deny do Supabase — comportamento correto da plataforma quando RLS está habilitado; não requer policy adicional.
