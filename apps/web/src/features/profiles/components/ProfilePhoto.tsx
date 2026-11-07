'use client';

import type { ProfileDto, Relationship } from '@helpjuy/contracts';
import { Camera, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ApiError, apiFetch, postJson } from '@/shared/api/client';
import { shrinkForUpload } from '../photo-resize';

type Props = {
  profileId: string;
  name: string;
  relationship: Relationship;
  isMinor: boolean;
  photoVersion: string | null;
  /** La cuenta entró con Google y tiene foto. */
  googlePhoto: boolean;
  /** Está marcada para verse en el QR. */
  visible: boolean;
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

const ERRORS: Record<string, string> = {
  photo_invalid: 'No pudimos leer esa imagen. Probá con otra foto (JPG o PNG).',
  google_photo_unavailable: 'No pudimos traer tu foto de Google. Subí una desde el celular.',
};

/**
 * Foto de la ficha: ayuda a confirmar que la ficha es de la persona que están atendiendo.
 * Se guarda al subirla (achicada y sin datos ocultos); si se ve en el QR lo decide el selector del bloque.
 */
export function ProfilePhoto({ profileId, name, relationship, isMinor, photoVersion, googlePhoto, visible }: Props) {
  const [version, setVersion] = useState(photoVersion);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function run(action: () => Promise<ProfileDto | void>) {
    setBusy(true);
    setError(null);
    try {
      const r = await action();
      setVersion(r ? r.photoVersion : null);
    } catch (err) {
      setError(ERRORS[err instanceof ApiError ? err.code : ''] ?? 'Algo salió mal. Probá de nuevo.');
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    await run(async () =>
      apiFetch<ProfileDto>(`/profiles/${profileId}/photo`, {
        method: 'PUT',
        body: JSON.stringify({ image: await shrinkForUpload(file) }),
      }),
    );
    if (input.current) input.current.value = '';
  }

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar className="size-24 rounded-md after:rounded-md" aria-hidden="true">
          {version && (
            <AvatarImage src={`/api/profiles/${profileId}/photo?v=${version}`} alt="" className="rounded-md" />
          )}
          <AvatarFallback className="rounded-md text-3xl">{initials(name)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-wrap gap-2">
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <Button type="button" variant="outline" size="compact" className="min-h-11 bg-white" disabled={busy} onClick={() => input.current?.click()}>
            {busy ? <Spinner className="size-4" /> : <Camera size={18} aria-hidden="true" />}
            {version ? 'Cambiar foto' : 'Subir foto'}
          </Button>
          {googlePhoto && relationship === 'SELF' && !version && (
            <Button
              type="button"
              variant="soft"
              size="compact"
              disabled={busy}
              onClick={() => run(() => postJson<ProfileDto>(`/profiles/${profileId}/photo/google`))}
            >
              Usar mi foto de Google
            </Button>
          )}
          {version && (
            <Button
              type="button"
              variant="soft"
              size="compact"
              className="text-red hover:border-red"
              disabled={busy}
              onClick={() => run(() => apiFetch<void>(`/profiles/${profileId}/photo`, { method: 'DELETE' }))}
            >
              <Trash2 size={18} aria-hidden="true" />
              Quitar foto
            </Button>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Una foto de frente, con la cara bien visible. La achicamos y le borramos los datos ocultos (como la ubicación de
        donde la sacaste).
      </p>
      {isMinor && visible && (
        <Alert variant="warning">
          Es la foto de un menor y se va a ver al escanear el QR, sin contraseña. Pensalo bien: si preferís, dejala en
          &quot;Solo yo&quot;.
        </Alert>
      )}
      {error && <Alert variant="error">{error}</Alert>}
    </div>
  );
}
