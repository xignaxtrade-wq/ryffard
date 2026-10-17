export const BANKS_RD = [
  { value: 'BANRESERVAS', label: 'Banreservas' },
  { value: 'BANCO POPULAR DOMINICANO', label: 'Banco Popular Dominicano' },
  { value: 'BANCO BHD', label: 'Banco BHD (BHD Le\u00f3n)' },
  { value: 'SCOTIABANK RD', label: 'Scotiabank Rep\u00fablica Dominicana' },
  { value: 'ASOCIACION DUARTE', label: 'Asociaci\u00f3n Duarte de Ahorros y Pr\u00e9stamos' },
  { value: 'BANCO SANTA CRUZ', label: 'Banco Santa Cruz' },
  { value: 'BANCO CARIBE', label: 'Banco Caribe' },
  { value: 'BANCO VIMENCA', label: 'Banco Vimenca' },
  { value: 'BANCO LAFISE', label: 'Banco LAFISE' },
  { value: 'APAP', label: 'APAP' },
  { value: 'ADEMI', label: 'ADEMI' },
  { value: 'BANCO ADOPEM', label: 'Banco ADOPEM' },
  { value: 'OTRO', label: 'Otro banco' },
]

export function canonicalBankName(name) {
  const normalized = name.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
  if (['BHD', 'BHD LEON', 'BANCO BHD', 'BANCO BHD LEON'].includes(normalized)) return 'BANCO BHD'
  return normalized
}

export function bankDisplayName(name) {
  return BANKS_RD.find(bank => bank.value === canonicalBankName(name))?.label || name
}

export function selectedBankName(value, otherName = '') {
  if (!BANKS_RD.some(bank => bank.value === value)) return ''
  return value === 'OTRO' ? otherName.trim().toUpperCase() : value
}
