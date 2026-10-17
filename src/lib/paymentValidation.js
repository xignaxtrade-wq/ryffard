import { canonicalBankName } from '../constants/banks'
import { cryptoPaymentDetails } from './cryptoPayments'

export function paymentMethodError(method, existingMethods = []) {
  if (method.type === 'crypto' && !cryptoPaymentDetails(method)) return 'Wallet o red no v\u00e1lida'
  if (method.type === 'bank' && (!method.details?.account_number?.trim() || !method.details?.holder?.trim())) {
    return 'N\u00famero de cuenta y titular son requeridos'
  }
  if (existingMethods.some(existing => canonicalBankName(existing.name) === canonicalBankName(method.name))) {
    return 'Ya existe un m\u00e9todo de pago con ese nombre'
  }
  return ''
}
