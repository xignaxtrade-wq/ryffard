import { describe, expect, it } from 'vitest'
import { paymentMethodError } from './paymentValidation'

describe('manual transfer configuration', () => {
  const method = { name: 'PRUEBA', type: 'bank', details: { account_number: '', holder: '' } }
  it('requires both account and holder without saving partial details', () => {
    expect(paymentMethodError(method)).not.toBe('')
    expect(paymentMethodError({ ...method, details: { account_number: 'PRUEBA', holder: ' ' } })).not.toBe('')
  })
  it('rejects ambiguous duplicate names regardless of spacing or case', () => {
    expect(paymentMethodError({ name: ' PRUEBA ', type: 'custom' }, [{ name: 'prueba' }])).not.toBe('')
  })
  it('does not rewrite account identifiers or strip leading zeroes', () => {
    const fixture = { ...method, details: { account_number: '0000', holder: 'PRUEBA' } }
    expect(paymentMethodError(fixture)).toBe('')
    expect(fixture.details.account_number).toBe('0000')
  })
})
