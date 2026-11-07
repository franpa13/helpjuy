'use client';

import { DELETE_ACCOUNT_WORD } from '@helpjuy/contracts';
import { Download, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { Alert } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/shared/api/client';

/** Tu cuenta: descargar todo lo que guardamos y borrar la cuenta (Ley 25.326: acceso y supresión). */
export function AccountSettings({ email, emailVerified }: { email: string; emailVerified: boolean }) {
  const router = useRouter();
  const [word, setWord] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);
  const inputId = useId();

  async function remove() {
    setDeleting(true);
    setError(false);
    try {
      await apiFetch<void>('/account', { method: 'DELETE', body: JSON.stringify({ confirm: word }) });
      router.push('/?cuenta=borrada');
      router.refresh();
    } catch {
      setError(true);
      setDeleting(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Card className="p-[18px]">
        <CardTitle>Tu email</CardTitle>
        <p className="text-lg font-bold wrap-anywhere">{email}</p>
        <p className={cn('mt-1 text-[15px]', emailVerified ? 'text-green' : 'text-amber')}>
          {emailVerified ? 'Confirmado' : 'Sin confirmar: no te llegan los avisos de tu familia.'}
        </p>
      </Card>

      <Card className="grid gap-3 p-[18px]">
        <CardTitle className="mb-0">Descargar mis datos</CardTitle>
        <p className="text-muted-foreground">
          Un archivo con todo lo que guardamos de vos: tus fichas (con los datos médicos), consentimientos, avisos,
          escaneos y grupos. Tiene datos de salud: guardalo en un lugar seguro.
        </p>
        <a
          href="/api/account/export"
          download
          className={cn(buttonVariants({ variant: 'outline', size: 'compact' }), 'min-h-12 justify-self-start bg-white text-[17px]')}
        >
          <Download size={18} aria-hidden="true" />
          Descargar mis datos
        </a>
      </Card>

      <Card rule="red" className="grid gap-3 p-[18px]">
        <CardTitle className="mb-0">Borrar mi cuenta</CardTitle>
        <p className="text-muted-foreground">
          Se borran tu cuenta y todas tus fichas, con sus datos médicos, fotos, avisos y escaneos. Los QR impresos dejan
          de funcionar. Salís de tus grupos familiares (si administrabas uno, queda a cargo otra persona). No se puede
          deshacer.
        </p>
        <AlertDialog onOpenChange={() => setWord('')}>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="soft" size="compact" className="min-h-12 justify-self-start text-[17px] text-red hover:border-red">
              <Trash2 size={18} aria-hidden="true" />
              Borrar mi cuenta
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Borrar todo?</AlertDialogTitle>
              <AlertDialogDescription>
                Se borran tu cuenta y todas tus fichas. Los QR impresos dejan de funcionar. Si querés, antes descargá tus
                datos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-1.5">
              <Label htmlFor={inputId}>Escribí {DELETE_ACCOUNT_WORD} para confirmar</Label>
              <Input id={inputId} value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" />
            </div>
            {error && <Alert variant="error">No pudimos borrar la cuenta. Probá de nuevo.</Alert>}
            <AlertDialogFooter>
              <AlertDialogCancel size="inline">Cancelar</AlertDialogCancel>
              {/* No usamos AlertDialogAction: el diálogo se cierra solo al terminar (o queda abierto si falla). */}
              <Button type="button" size="inline" disabled={word !== DELETE_ACCOUNT_WORD || deleting} onClick={remove}>
                {deleting && <Spinner className="size-5" />}
                Borrar todo
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    </div>
  );
}
