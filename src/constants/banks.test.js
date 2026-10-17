import { describe, expect, it } from 'vitest'
import { BANKS_RD, bankDisplayName, canonicalBankName, selectedBankName } from './banks'

describe('Dominican transfer bank selector', () => {
  it('includes requested institutions without duplicating BHD', () => {
    expect(BANKS_RD.map(bank => bank.value)).toEqual(expect.arrayContaining([
      'BANCO BHD', 'BANCO POPULAR DOMINICANO', 'SCOTIABANK RD', 'ASOCIACION DUARTE', 'OTRO',
    ]))
    expect(BANKS_RD.filter(bank => bank.value.includes('BHD'))).toHaveLength(1)
  })
  it('recognizes saved BHD Leon names without changing stored identifiers', () => {
    const legacy = 'BANCO BHD LE\u00d3N'
    expect(canonicalBankName(legacy)).toBe('BANCO BHD')
    expect(bankDisplayName(legacy)).toBe(bankDisplayName('BANCO BHD'))
    expect(legacy).toBe('BANCO BHD LE\u00d3N')
  })
  it('requires a name for another bank and rejects unknown choices', () => {
    expect(selectedBankName('OTRO')).toBe('')
    expect(selectedBankName('unlisted')).toBe('')
    expect(selectedBankName('OTRO', ' PRUEBA ')).toBe('PRUEBA')
    expect(selectedBankName('ASOCIACION DUARTE')).toBe('ASOCIACION DUARTE')
  })
})
