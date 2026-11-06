import { RELATIONSHIP_LABELS, type ProfileDto } from '@helpjuy/contracts';
import { Eye, Pencil, Plus, Printer } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const initials = (p: ProfileDto) => `${p.firstName[0] ?? ''}${p.lastName[0] ?? ''}`.toUpperCase();

const note = 'border-l-5 px-3 py-2 text-[15px] font-bold';
const action =
  'inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-md border-2 border-ink px-3 text-center text-[15px] font-bold no-underline';

function PrintNote({ p }: { p: ProfileDto }) {
  if (p.printStatus === 'outdated')
    return <p className={cn(note, 'border-amber bg-amber-tint')}>Cambiaron datos de tu QR impreso: reimprimilo.</p>;
  if (p.printStatus === 'never' && p.active) return <p className={cn(note, 'border-amber bg-amber-tint')}>Tu QR está listo: imprimilo.</p>;
  if (p.printStatus === 'ok' && p.printedAt)
    return (
      <p className={cn(note, 'border-green bg-green-tint text-green')}>
        QR impreso el {new Date(p.printedAt).toLocaleDateString('es-AR')}
      </p>
    );
  return null;
}

export function ProfileCards({ profiles }: { profiles: ProfileDto[] }) {
  return (
    <div className="grid gap-4">
      {profiles.map((p) => {
        const name = `${p.firstName} ${p.lastName}`;
        return (
          <Card asChild key={p.id} rule="red" className="grid gap-3.5 p-[18px]">
            <article aria-label={name}>
            <header className="grid grid-cols-[auto_1fr] items-center gap-x-3.5 gap-y-3 sm:grid-cols-[auto_1fr_auto]">
              <span
                className="grid size-13 place-items-center rounded-full bg-night font-head text-[22px] font-extrabold text-white"
                aria-hidden="true"
              >
                {initials(p)}
              </span>
              <div className="min-w-0">
                <h2 className="text-[28px] wrap-anywhere">{name}</h2>
                <p className="mt-1 text-muted-foreground">
                  {RELATIONSHIP_LABELS[p.relationship]}
                  {p.isMinor ? ' · menor' : ''}
                </p>
              </div>
              <span
                className={cn(
                  'col-span-full justify-self-start rounded-full px-2.5 py-1 text-sm font-bold sm:col-auto',
                  p.active ? 'bg-green-tint text-green' : 'bg-amber-tint text-amber',
                )}
              >
                {p.active ? 'QR activo' : 'Falta un contacto de emergencia'}
              </span>
            </header>

            <div className="grid gap-1.5">
              <span className="font-head text-base font-extrabold uppercase tracking-[0.04em]">Ficha al {p.completion}%</span>
              <Progress value={p.completion} aria-label="Ficha completa" />
            </div>

            <PrintNote p={p} />

            <div className="grid gap-2 sm:flex sm:flex-wrap">
              <Link className={cn(action, 'bg-ink text-white')} href={`/panel/perfiles/${p.id}`}>
                <Pencil size={18} aria-hidden="true" />
                Editar ficha
              </Link>
              <Link className={cn(action, 'bg-white text-ink')} href={`/panel/perfiles/${p.id}/imprimir`}>
                <Printer size={18} aria-hidden="true" />
                Imprimir QR
              </Link>
              <a className={cn(action, 'bg-white text-ink')} href={`/e/${p.publicToken}`} target="_blank" rel="noreferrer">
                <Eye size={18} aria-hidden="true" />
                Ver como el paramédico
              </a>
            </div>
            </article>
          </Card>
        );
      })}

      <Link
        href="/panel/perfiles/nuevo"
        className="flex items-center gap-3.5 border-2 border-dashed border-line p-[18px] text-ink no-underline transition-colors hover:border-ink"
      >
        <span className="grid size-13 shrink-0 place-items-center rounded-full border-2 border-ink" aria-hidden="true">
          <Plus size={26} />
        </span>
        <span>
          <strong className="block font-head text-xl font-extrabold uppercase">Agregar otra persona</strong>
          <span className="mt-0.5 block text-[15px] text-muted-foreground">
            Un hijo, tu mamá o alguien a tu cargo, cada uno con su propio QR.
          </span>
        </span>
      </Link>
    </div>
  );
}
