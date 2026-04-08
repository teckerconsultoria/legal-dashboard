import { test, expect } from 'vitest'
import { maskCPF, maskCNPJ, maskName, maskPhone } from '../src/lib/lgpd'

test('maskCPF valid', () => expect(maskCPF('12345678901')).toBe('***.***.***-01'))
test('maskCPF empty', () => expect(maskCPF('')).toBe(''))
test('maskCPF invalid returns input', () => expect(maskCPF('123')).toBe('123'))
test('maskCNPJ returns masked', () => expect(maskCNPJ('12345678000190')).toMatch(/\*\*/))
test('maskName full', () => expect(maskName('João Silva Santos')).toBe('João . .'))
test('maskName single', () => expect(maskName('Maria')).toBe('M.'))
test('maskPhone shows area code', () => expect(maskPhone('1133334444')).toMatch(/\(\d{2}\)/))
test('maskPhone returns masked', () => expect(maskPhone('11964443333')).toMatch(/\(\d{2}\)/))
test('maskPhone returns unchanged for invalid', () => expect(maskPhone('123')).toBe('123'))