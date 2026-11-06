'use client';

import { BellRing, IdCard, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const ITEMS = [
  {
    href: '/panel',
    label: 'Mis fichas',
    hint: 'Tus datos y tu QR',
    icon: IdCard,
    // Todo lo que no es familia ni avisos es parte de "Mis fichas" (editar, nueva ficha…)
    active: (p: string) => !p.startsWith('/panel/familia') && !p.startsWith('/panel/avisos'),
  },
  {
    href: '/panel/familia',
    label: 'Mi familia',
    hint: 'Quién recibe tus avisos',
    icon: Users,
    active: (p: string) => p.startsWith('/panel/familia'),
  },
  {
    href: '/panel/avisos',
    label: 'Avisos',
    hint: 'Emergencias y dónde fue',
    icon: BellRing,
    active: (p: string) => p.startsWith('/panel/avisos'),
  },
];

const STYLES = {
  side: {
    nav: 'grid gap-1.5',
    item: "group relative flex items-center gap-3.5 rounded-md p-3 text-white/82 no-underline transition-colors hover:bg-white/6 hover:text-white aria-[current=page]:bg-white/10 aria-[current=page]:text-white aria-[current=page]:before:absolute aria-[current=page]:before:inset-y-2 aria-[current=page]:before:-left-4 aria-[current=page]:before:w-[5px] aria-[current=page]:before:bg-red-bright aria-[current=page]:before:content-['']",
    icon: 'size-[42px] bg-white/8',
    label: 'text-[21px]/none',
  },
  tabs: {
    nav: 'grid grid-cols-3',
    item: 'group grid justify-items-center gap-1 border-t-3 border-transparent px-2 pt-2 pb-2.5 text-white/70 no-underline aria-[current=page]:border-red-bright aria-[current=page]:text-white',
    icon: 'size-[34px]',
    label: 'text-[15px]/none',
  },
};

/** Las secciones del panel. En escritorio va en la barra lateral; en celular, como pestañas abajo. */
export function PanelNav({ variant = 'side' }: { variant?: 'side' | 'tabs' }) {
  const pathname = usePathname() ?? '/panel';
  const s = STYLES[variant];
  return (
    <nav aria-label="Secciones del panel" className={s.nav}>
      {ITEMS.map(({ href, label, hint, icon: Icon, active }) => {
        const current = active(pathname);
        return (
          <Link key={href} href={href} className={s.item} aria-current={current ? 'page' : undefined}>
            <span
              className={cn('grid shrink-0 place-items-center rounded-md group-aria-[current=page]:bg-red-bright', s.icon)}
              aria-hidden="true"
            >
              <Icon size={22} strokeWidth={2.2} />
            </span>
            <span className="grid gap-0.5">
              <span className={cn('font-head font-extrabold uppercase tracking-[0.02em]', s.label)}>{label}</span>
              {variant === 'side' && <span className="text-sm text-white/65">{hint}</span>}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
