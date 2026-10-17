import { describe, expect, it } from 'vitest'
import { passwordError } from './authValidation'

describe('password validation', () => {
  it('uses the same minimum for registration and recovery', () => {
    expect(passwordError('1234567')).toContain('8')
    expect(passwordError('1234567', '1234567')).toContain('8')
    expect(passwordError('12345678')).toBe('')
    expect(passwordError('12345678', '12345678')).toBe('')
  })
  it('rejects mismatched recovery confirmation', () => {
    expect(passwordError('12345678', '87654321')).not.toBe('')
  })
})
