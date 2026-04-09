/**
 * Dados dos pilotos de teste reais.
 * Cada piloto tem OAB válida na Paraíba — Escavador retornará dados reais.
 */
export const PILOTS = [
  {
    name: 'Renato Lacerda',
    email: 'alemosmartins@gmail.com',
    oab_estado: 'PB',
    oab_numero: '24398',
    label: 'piloto-1-renato',
  },
  {
    name: 'Victor Assis',
    email: 'techerconsultoria@gmail.com',
    oab_estado: 'PB',
    oab_numero: '13477',
    label: 'piloto-2-victor',
  },
  {
    name: 'Rodrigo Mendes',
    email: 'alessandro.lemos.martins@gmail.com',
    oab_estado: 'PB',
    oab_numero: '26665',
    label: 'piloto-3-rodrigo',
  },
] as const

export type Pilot = typeof PILOTS[number]

export const OPERATOR = {
  email: 'alessandro.lemos@teckerconsulting.com.br',
  password: 'a8r5d9p7',
}

export const CRON_SECRET = '7a84ef9c04f6eddff355db18a01506e876ab11d1b1f857d236baee82b5184163'

/** IDs das SKUs (buscados do Supabase em runtime pelo helper) */
export const SKU_NAMES = {
  simples: 'Report Saúde',         // sync
  smart: 'Report Priorização',     // async
  pro: 'Report Governança',        // async
} as const
