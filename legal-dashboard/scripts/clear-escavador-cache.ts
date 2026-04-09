/**
 * Script de limpeza do cache de fixtures do Escavador.
 *
 * Uso:
 *   npx tsx scripts/clear-escavador-cache.ts           # limpa tudo
 *   npx tsx scripts/clear-escavador-cache.ts --oab=PB/24398
 *   npx tsx scripts/clear-escavador-cache.ts --endpoint=/advogado/resumo
 *
 * O cache fica em .cache/escavador/ (ignorado pelo git).
 * Ativo apenas quando ESCAVADOR_CACHE_MODE=file em .env.local.
 */

import { fileCacheClear, fileCacheDeleteWhere } from '../src/lib/cache'

const args = process.argv.slice(2)

const oabArg = args.find(a => a.startsWith('--oab='))
const endpointArg = args.find(a => a.startsWith('--endpoint='))
const allFlag = args.includes('--all') || args.length === 0

if (oabArg) {
  // --oab=PB/24398 → busca entradas cuja key contém "PB" e "24398"
  const oab = oabArg.replace('--oab=', '').trim()
  const [estado, numero] = oab.split('/')
  const deleted = fileCacheDeleteWhere(estado && numero ? `"${estado}"` : oab)
  // Filtra mais precisamente pelo número quando ambos presentes
  const deleted2 = numero ? fileCacheDeleteWhere(numero) : 0
  console.log(`Removidas ${deleted + deleted2} entradas de cache para OAB ${oab}`)
} else if (endpointArg) {
  const endpoint = endpointArg.replace('--endpoint=', '').trim()
  const deleted = fileCacheDeleteWhere(endpoint)
  console.log(`Removidas ${deleted} entradas de cache para endpoint ${endpoint}`)
} else if (allFlag) {
  const deleted = fileCacheClear()
  console.log(`Cache limpo: ${deleted} arquivo(s) removido(s)`)
}
