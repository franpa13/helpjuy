import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const VERSION = 'v1';

/**
 * Cifra un valor JSON con AES-256-GCM. Formato: `v1.<iv>.<tag>.<datos>` (base64url).
 * Se usa para los datos médicos, además del cifrado en reposo de la base.
 */
export function encryptJson(value: unknown, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString('base64url'), tag.toString('base64url'), data.toString('base64url')].join('.');
}

export function decryptJson<T>(payload: string, key: Buffer): T {
  const [version, iv, tag, data] = payload.split('.');
  if (version !== VERSION || !iv || !tag || !data) throw new Error('Formato de dato cifrado inválido');
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  const plain = Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]);
  return JSON.parse(plain.toString('utf8')) as T;
}

/** Lee MEDICAL_DATA_KEY (base64, 32 bytes). Generar con: `node -e "console.log(crypto.randomBytes(32).toString('base64'))"`. */
export function loadMedicalKey(): Buffer {
  const raw = process.env.MEDICAL_DATA_KEY ?? '';
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('MEDICAL_DATA_KEY tiene que ser una clave de 32 bytes en base64');
  return key;
}
