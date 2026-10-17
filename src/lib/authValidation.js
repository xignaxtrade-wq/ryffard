export const MIN_PASSWORD_LENGTH = 8

export function passwordError(password, confirmation) {
  if (password.length < MIN_PASSWORD_LENGTH) return 'La contrase\u00f1a debe tener al menos 8 caracteres.'
  if (confirmation !== undefined && password !== confirmation) return 'Las contrase\u00f1as no coinciden.'
  return ''
}
