export const AUTH_FIELD_MESSAGES = {
  email: 'Revisá el email, parece que está mal escrito',
  password: 'Escribí tu contraseña',
  'password.too_small': 'La contraseña tiene que tener al menos 8 caracteres',
  'password.too_big': 'La contraseña es demasiado larga (máximo 128 caracteres)',
};

export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  email_taken: 'Ya hay una cuenta con ese email',
  invalid_credentials: 'Email o contraseña incorrectos',
  invalid_token: 'El link venció o ya se usó',
  rate_limited: 'Hiciste muchos intentos seguidos. Esperá un minuto y probá de nuevo.',
  unknown: 'Algo salió mal. Probá de nuevo en un rato.',
  google: 'No pudimos ingresar con Google. Probá de nuevo.',
  google_email: 'Tu cuenta de Google no tiene el email verificado. Verificalo en Google o ingresá con tu email.',
  google_disabled: 'El ingreso con Google todavía no está disponible. Ingresá con tu email.',
};

export const authErrorMessage = (code: string) => AUTH_ERROR_MESSAGES[code] ?? AUTH_ERROR_MESSAGES.unknown;
