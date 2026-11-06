import { BellOff, EyeOff, MailCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { title: 'Creá tu grupo', text: 'Ponele un nombre, por ejemplo "Familia Paredes". Lo administrás vos.' },
  { title: 'Invitá por WhatsApp', text: 'Les mandás un link. Cada persona crea su cuenta gratis y acepta unirse.' },
  {
    title: 'Si pasa algo, les llega un aviso',
    text: 'Quien escanee tu QR toca "Es una emergencia" y el grupo recibe un email con la hora y la ubicación aproximada.',
  },
];

const PROMISES = [
  { icon: EyeOff, text: 'Nadie ve tus datos médicos: el grupo solo recibe avisos.' },
  { icon: BellOff, text: 'Cada persona puede silenciar los avisos o salir cuando quiera.' },
  { icon: MailCheck, text: 'Los avisos llegan solo a emails confirmados.' },
];

export function IntroLead({ className }: { className?: string }) {
  return (
    <p className={cn('text-[19px]/normal', className)}>
      Todavía no tenés un grupo familiar. Armalo en un minuto con las personas que querés que se enteren si te pasa algo.
    </p>
  );
}

/** Cómo funciona (3 pasos) y qué garantías tiene. En la columna lateral va en versión compacta. */
export function FamilyIntro({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn('grid gap-[22px]', className)}>
      <ol className={cn('grid list-none p-0', !compact && 'border-t-3 border-ink')} aria-label="Cómo funciona">
        {STEPS.map((s, i) => (
          <li key={s.title} className={cn('flex gap-4 border-b border-line', compact ? 'py-2.5' : 'py-4')}>
            <span
              className={cn(
                'min-w-[30px] font-head font-extrabold text-red',
                compact ? 'text-[32px]/[0.85]' : 'text-5xl/[0.85]',
              )}
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <span>
              <strong
                className={cn('block font-head font-extrabold uppercase', compact ? 'text-[17px]/[1.05]' : 'text-[22px]/[1.05]')}
              >
                {s.title}
              </strong>
              <span className={cn('mt-1 block text-muted-foreground', compact && 'text-sm')}>{s.text}</span>
            </span>
          </li>
        ))}
      </ol>
      <ul className="grid list-none gap-2.5 p-0">
        {PROMISES.map(({ icon: Icon, text }) => (
          <li key={text} className={cn('flex items-center gap-2.5 font-bold', compact && 'text-sm')}>
            <Icon size={20} aria-hidden="true" className="shrink-0 text-green" />
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Ejemplo del email que recibe la familia. Va con un nombre inventado y la etiqueta EJEMPLO
 * para que nadie piense que ya escanearon su QR.
 */
export function AlertPreview({ compact = false, className }: { compact?: boolean; className?: string }) {
  const name = 'Lucía Mamani';
  return (
    <figure className={cn('m-0 grid gap-2', className)} aria-label="Ejemplo del email que recibe tu familia">
      {!compact && <figcaption className="label">Así le llega a tu familia</figcaption>}
      <div className="relative grid gap-2.5 rounded-lg border border-dashed border-line bg-white p-4 text-[15px] shadow-[0_12px_24px_-18px_rgb(0_0_0/0.35)]">
        <span className="justify-self-start rounded-md border-2 border-ink px-2 py-0.5 font-head text-[13px] font-extrabold tracking-[0.14em]">
          EJEMPLO
        </span>
        <p className="text-[13px] text-muted-foreground">
          Así se vería si alguien escanea un QR y marca una emergencia (nombre inventado).
        </p>
        <div className="flex justify-between text-[13px] font-bold text-muted-foreground">
          <span>HelpJuy</span>
          <span>14:32</span>
        </div>
        <p className="-mx-4 bg-red px-4 py-2 font-bold text-white">Posible emergencia: {name}</p>
        <p>
          Alguien escaneó la ficha de <strong>{name}</strong> a las 14:32 y marcó que es una emergencia.
        </p>
        <p className="font-bold text-blue underline">Ver ubicación aproximada en el mapa</p>
        <p>
          <strong>Puede no ser real.</strong> Intentá comunicarte con Lucía. Si no responde, llamá al 107.
        </p>
      </div>
    </figure>
  );
}
