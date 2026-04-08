import { maskCPF, maskCNPJ, maskName, maskPhone } from './lgpd'

describe('LGPD Masking', () => {
  describe('maskCPF', () => {
    it('should mask valid CPF', () => {
      const result = maskCPF('12345678901')
      expect(result).toBe('***.***.***-01')
    })

    it('should handle empty input', () => {
      expect(maskCPF('')).toBe('')
    })

    it('should handle invalid CPF', () => {
      expect(maskCPF('123')).toBe('123')
    })
  })

  describe('maskCNPJ', () => {
    it('should mask valid CNPJ', () => {
      const result = maskCNPJ('12345678000190')
      expect(result).toBe('**.***.***/****-90')
    })

    it('should handle empty input', () => {
      expect(maskCNPJ('')).toBe('')
    })
  })

  describe('maskName', () => {
    it('should mask full name', () => {
      const result = maskName('João Silva Santos')
      expect(result).toBe('João . .')
    })

    it('should handle single name', () => {
      expect(maskName('Maria')).toBe('M.')
    })

    it('should handle empty input', () => {
      expect(maskName('')).toBe('')
    })
  })

  describe('maskPhone', () => {
    it('should mask 10-digit phone', () => {
      const result = maskPhone('11999999999')
      expect(result).toBe('(**) ****-9999')
    })

    it('should mask 11-digit phone', () => {
      const result = maskPhone('119999999999')
      expect(result).toBe('(**) *****-9999')
    })
  })
})