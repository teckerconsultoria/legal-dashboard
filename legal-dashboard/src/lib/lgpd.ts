export function maskCPF(value: string): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 11) return value
  return `***.***.***-${digits.slice(-2)}`
}

export function maskCNPJ(value: string): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 14) return value
  return `**.***.***/****-**`
}

export function maskName(name: string): string {
  if (!name) return ''
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0] + '.'
  return parts[0] + ' ' + parts.slice(1).map(() => '.').join(' ')
}

export function maskPhone(value: string): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  if (digits.length === 10) {
    const prefix = digits.slice(0, 2)
    const last4 = digits.slice(-4)
    return `(${prefix}) ****-${last4}`
  }
  if (digits.length === 11) {
    const prefix = digits.slice(0, 2)
    const last4 = digits.slice(-4)
    return `(${prefix}) *****-${last4}`
  }
  return value
}