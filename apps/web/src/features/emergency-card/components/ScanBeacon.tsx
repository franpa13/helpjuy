'use client';

import { useEffect } from 'react';

/**
 * Avisa que se abrió la ficha. La página pública está cacheada, así que el servidor no se entera solo.
 * Va con la cookie: si quien la abre es el titular, la API no lo cuenta. Si falla, no pasa nada.
 */
export function ScanBeacon({ token }: { token: string }) {
  useEffect(() => {
    void fetch(`/api/public/cards/${token}/scan`, { method: 'POST', credentials: 'include', keepalive: true }).catch(
      () => undefined,
    );
  }, [token]);
  return null;
}
