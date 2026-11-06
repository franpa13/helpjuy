import type { ProfileDto } from '@helpjuy/contracts';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Step = { key: 'email' | 'complete' | 'print' | 'family'; title: string; text: string; href: string; done: boolean };

type Input = { emailVerified: boolean; profiles: ProfileDto[]; familyMembers: number };

/** Lo que conviene hacer para que la ficha sirva de verdad, en orden. */
export function nextSteps({ emailVerified, profiles, familyMembers }: Input): Step[] {
  const first = profiles[0];
  return [
    {
      key: 'email',
      title: 'Confirmá tu email',
      text: 'Para recibir los avisos de emergencia de tu familia.',
      href: '/panel',
      done: emailVerified,
    },
    {
      key: 'complete',
      title: 'Completá tu ficha',
      text: 'Alergias, remedios, grupo sanguíneo y contactos.',
      href: first ? `/panel/perfiles/${first.id}` : '/panel/perfiles/nuevo',
      done: profiles.length > 0 && profiles.every((p) => p.completion === 100),
    },
    {
      key: 'print',
      title: 'Imprimí tu QR',
      text: 'Tarjeta para la billetera y sticker para el casco.',
      href: first ? `/panel/perfiles/${first.id}/imprimir` : '/panel',
      done: profiles.length > 0 && profiles.every((p) => p.printStatus === 'ok'),
    },
    {
      key: 'family',
      title: 'Armá tu grupo familiar',
      text: 'Para que se enteren si te pasa algo.',
      href: '/panel/familia',
      done: familyMembers > 0,
    },
  ];
}

export function NextSteps(props: Input) {
  const steps = nextSteps(props);
  const done = steps.filter((s) => s.done).length;
  return (
    <Card className="p-[18px]">
      <div className="mb-3 flex items-baseline justify-between gap-2.5">
        <h2 className="text-[22px]">Tus próximos pasos</h2>
        <span className="whitespace-nowrap text-sm font-bold text-muted-foreground">
          {done} de {steps.length} listos
        </span>
      </div>
      <ol className="grid list-none p-0" aria-label="Tus próximos pasos">
        {steps.map((s) => (
          <li key={s.key} data-done={s.done} className="flex gap-3 border-t border-line py-2.5">
            <span
              className={cn(
                'mt-px grid size-6 shrink-0 place-items-center rounded-full border-2 border-line',
                s.done && 'border-green bg-green text-white',
              )}
              aria-hidden="true"
            >
              {s.done ? <Check size={16} strokeWidth={3} /> : null}
            </span>
            <span>
              {s.done || s.key === 'email' ? (
                <strong className={cn(s.done && 'text-muted-foreground line-through')}>{s.title}</strong>
              ) : (
                <Link href={s.href} className="font-bold">
                  {s.title}
                </Link>
              )}
              <span className="mt-0.5 block text-sm text-muted-foreground">{s.done ? 'Listo' : s.text}</span>
            </span>
          </li>
        ))}
      </ol>
    </Card>
  );
}
