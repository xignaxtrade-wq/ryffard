export function paymentMethodError(method, existingMethods = []) {
  if (method.type === 'bank' && (!method.details?.account_number?.trim() || !method.details?.holder?.trim())) {
    return 'N\u00famero de cuenta y titular son requeridos'
  }
  if (existingMethods.some(existing => existing.name.trim().toLowerCase() === method.name.trim().toLowerCase())) {
    return 'Ya existe un m\u00e9todo de pago con ese nombre'
  }
  return ''
}
