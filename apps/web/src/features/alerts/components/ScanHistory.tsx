import type { ScanDto } from '@helpjuy/contracts';
import { ScanQrCode } from 'lucide-react';
import { Card } from '@/components/ui/card';

const when = (iso: string) =>
  new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Jujuy',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));

/** Cuándo se abrieron tus fichas (sin datos de quién). */
export function ScanHistory({ scans }: { scans: ScanDto[] }) {
  return (
    <Card className="p-[18px]" aria-labelledby="escaneos">
      <h2 id="escaneos" className="mb-1 text-[26px]">
        Escaneos de tus fichas
      </h2>
      <p className="mb-3 text-[15px] text-muted-foreground">
        Cada vez que alguien abre una ficha tuya. No guardamos quién fue ni dónde estaba. Se borran a los 90 días.
      </p>
      {scans.length === 0 ? (
        <p className="font-bold">Nadie abrió tus fichas todavía.</p>
      ) : (
        <ul className="grid list-none border-t border-line p-0" aria-label="Escaneos">
          {scans.map((s) => (
            <li key={s.id} className="flex items-center gap-3 border-b border-line py-2.5">
              <ScanQrCode size={20} aria-hidden="true" className="shrink-0 text-night" />
              <span className="font-bold">{s.profileName}</span>
              <span className="ml-auto text-[15px] text-muted-foreground capitalize">{when(s.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
