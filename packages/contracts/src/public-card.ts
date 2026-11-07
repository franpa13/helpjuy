import type { BloodType } from './medical';

/**
 * Lo que ve quien escanea el QR. Solo incluye las secciones marcadas como públicas:
 * una sección privada directamente no aparece como clave.
 * Nunca incluye fecha de nacimiento (solo la edad), DNI, domicilio, email ni ids internos.
 */
export type PublicCardDto = {
  firstName: string;
  lastName: string;
  /** Tiene al menos un contacto de emergencia. */
  active: boolean;
  updatedAt: string | null;
  /** Solo si el titular eligió mostrar la foto. Se pide a /public/cards/:token/photo?v=… */
  photoVersion?: string;
  identity?: { age?: number; sex?: 'F' | 'M' | 'X'; language?: string };
  vitals?: { bloodType?: BloodType; weightKg?: number; heightCm?: number };
  allergies?: { items: { substance: string; reaction?: string }[]; none: boolean };
  conditions?: { items: { name: string; note?: string }[]; none: boolean };
  medications?: { items: { name: string; dose?: string; anticoagulant: boolean }[]; none: boolean };
  contacts?: { name: string; relation?: string; phone: string }[];
  care?: {
    communication?: string;
    transfusion: 'ACCEPTS' | 'REFUSES' | 'UNKNOWN';
    organDonor: 'YES' | 'NO' | 'UNKNOWN';
    directives?: string;
  };
  history?: { surgeries?: string; implants?: string };
  insurance?: { name: string; number?: string };
  doctor?: { name: string; phone?: string };
  notes?: string;
};

/** Formato del token público del QR: 16 bytes en base64url. */
export const PUBLIC_TOKEN_RE = /^[A-Za-z0-9_-]{22}$/;
