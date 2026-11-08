const RULES: Array<[RegExp, string]> = [
  // El token de la ficha pública es la llave de acceso a datos de salud: nunca sale de acá.
  [/^\/e\/[^/]+/, '/e/[ficha]'],
  [/^\/unirme\/[^/]+/, '/unirme/[invitacion]'],
  [/^\/panel\/perfiles\/[0-9a-f-]{36}/, '/panel/perfiles/[id]'],
];

/**
 * Limpia una URL antes de mandarla a la analítica: reemplaza tokens e ids y saca la query
 * (los links de confirmar email o cambiar contraseña llevan el token ahí).
 */
export function redactUrl(raw: string): string {
  const u = new URL(raw);
  let path = u.pathname;
  for (const [re, to] of RULES) path = path.replace(re, to);
  return `${u.origin}${path}`;
}
