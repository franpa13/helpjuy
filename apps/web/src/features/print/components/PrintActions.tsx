'use client';

import { Printer } from 'lucide-react';
import { useState } from 'react';
import { postJson } from '@/shared/api/client';
import { Button } from '@/shared/ui/Button';

/** Marca lo impreso (para avisar después si hay que reimprimir) y abre el diálogo de impresión. */
export function PrintActions({ profileId }: { profileId: string }) {
  const [busy, setBusy] = useState(false);

  async function print() {
    setBusy(true);
    // Si falla el registro igual dejamos imprimir: lo importante es que la persona tenga su QR.
    await postJson(`/profiles/${profileId}/printed`).catch(() => undefined);
    setBusy(false);
    window.print();
  }

  return (
    <Button type="button" onClick={print} disabled={busy}>
      <Printer size={20} aria-hidden="true" />
      Imprimir
    </Button>
  );
}
