'use client';

import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Alert } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { postJson } from '@/shared/api/client';

/** ¿Perdiste el sticker o la tarjeta? Un QR nuevo hace que el viejo deje de funcionar. */
export function RotateQr({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'done' | 'error'>('idle');

  async function rotate() {
    try {
      await postJson(`/profiles/${profileId}/rotate-token`);
      setState('done');
      router.refresh();
    } catch {
      setState('error');
    }
  }

  return (
    <div className="grid gap-2.5">
      <p className="text-[15px] text-muted-foreground">
        Si perdiste el sticker o la tarjeta, o no te gusta que alguien la tenga, generá un QR nuevo: el viejo deja de
        funcionar y te toca reimprimir.
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="soft" size="compact" className="min-h-11 justify-self-start">
            <RefreshCw size={18} aria-hidden="true" />
            Generar QR nuevo
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Generar un QR nuevo?</AlertDialogTitle>
            <AlertDialogDescription>
              Todo lo que tenés impreso deja de funcionar al instante: la tarjeta, los stickers y la hoja de la heladera.
              Vas a tener que imprimir y reemplazar todo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="inline">Cancelar</AlertDialogCancel>
            <AlertDialogAction size="inline" onClick={rotate}>
              Sí, generar uno nuevo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {state === 'done' && <Alert variant="success">Listo, tu QR es nuevo. Imprimilo y reemplazá el viejo.</Alert>}
      {state === 'error' && <Alert variant="error">No pudimos generar el QR nuevo. Probá de nuevo.</Alert>}
    </div>
  );
}
