/**
 * cron-worker.ts — One-shot script para VPS Hostinger
 *
 * Chamado pelo crontab a cada minuto:
 *   * * * * * /usr/bin/node /app/scripts/cron-worker.js >> /var/log/legal-cron.log 2>&1
 *
 * AbortSignal.timeout(55_000) garante que o processo morre antes do próximo tick,
 * evitando sobreposição de workers simultâneos.
 *
 * Variáveis de ambiente necessárias:
 *   CRON_SECRET       — segredo compartilhado com /api/internal/cron-tick
 *   NEXT_PUBLIC_BASE_URL — URL base da aplicação (ex: https://app.domain.com)
 */

async function main() {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron-worker] CRON_SECRET not set')
    process.exit(1)
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const url = `${baseUrl}/api/internal/cron-tick`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-cron-secret': secret,
    },
    signal: AbortSignal.timeout(55_000),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`[cron-worker] cron-tick failed: HTTP ${res.status} ${body}`)
    process.exit(1)
  }

  const data = await res.json()
  console.log(`[cron-worker] ok — processed=${data.processed} failed=${data.failed ?? 0} stuck_dead=${data.stuck_marked_dead ?? 0}`)
  process.exit(0)
}

main().catch(err => {
  console.error('[cron-worker] fatal:', err instanceof Error ? err.message : err)
  process.exit(1)
})
