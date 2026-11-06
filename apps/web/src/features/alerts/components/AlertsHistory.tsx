'use client';

import type { ReceivedAlertDto } from '@helpjuy/contracts';
import { BellOff, ExternalLink, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AlertsMap, type MapPoint } from './AlertsMap';
import { Badge } from '@/components/ui/badge';
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

const linkBtn =
  'inline-flex min-h-9 cursor-pointer items-center gap-1.5 bg-transparent p-0 text-[15px] font-bold text-ink underline underline-offset-3';

const googleMaps = (l: { lat: number; lng: number }) => `https://www.google.com/maps?q=${l.lat},${l.lng}`;

/** Historial de avisos de emergencia: lista + mapa con la zona aproximada de cada uno. */
export function AlertsHistory({ alerts }: { alerts: ReceivedAlertDto[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Estable: si cambiara en cada render, el mapa se volvería a armar al elegir un aviso.
  const points: MapPoint[] = useMemo(
    () => alerts.flatMap((a) => (a.location ? [{ id: a.id, ...a.location, label: `${a.profileName} · ${when(a.at)}` }] : [])),
    [alerts],
  );

  if (alerts.length === 0) {
    return (
      <div className="flex items-start gap-3.5 border border-l-8 border-line border-l-night bg-white p-[18px]">
        <BellOff size={28} aria-hidden="true" />
        <div>
          <h2 className="mb-1.5 text-[26px]">No hubo avisos</h2>
          <p className="mb-2.5 text-muted-foreground">
            Ojalá siga así. Si alguien escanea tu QR o el de tu familia y marca una emergencia, lo vas a ver acá con la
            zona en el mapa, además del email.
          </p>
          <Link href="/panel/familia" className="font-bold">Ver quién recibe tus avisos</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {points.length > 0 && (
        <Card rule="red" aria-label="Mapa de avisos">
          <AlertsMap points={points} selectedId={selectedId} />
          <p className="px-3.5 py-2.5 text-sm text-muted-foreground">
            Cada círculo es una zona aproximada (unos 100 metros), no el lugar exacto.
          </p>
        </Card>
      )}
      <ul className="grid list-none gap-2.5 p-0" aria-label="Avisos">
        {alerts.map((a) => (
          <li
            key={a.id}
            data-selected={a.id === selectedId || undefined}
            className="flex gap-3 border border-l-4 border-line bg-white px-4 py-3.5 transition-colors data-selected:border-l-red"
          >
            <span className="mt-[7px] size-3 shrink-0 rounded-full bg-red shadow-[0_0_0_4px_var(--red-tint)]" aria-hidden="true" />
            <div className="grid min-w-0 gap-1">
              <p className="flex flex-wrap items-center gap-2 text-lg">
                <strong>{a.profileName}</strong>
                <Badge variant={a.mine ? 'red' : 'blue'}>{a.mine ? 'Tu ficha' : 'De tu familia'}</Badge>
              </p>
              <p className="text-[15px] text-muted-foreground capitalize">{when(a.at)}</p>
              {a.location ? (
                <div className="mt-1 flex flex-wrap gap-x-[18px] gap-y-1.5">
                  <button type="button" className={linkBtn} onClick={() => setSelectedId(a.id)}>
                    <MapPin size={16} aria-hidden="true" />
                    Ver en el mapa
                  </button>
                  <a href={googleMaps(a.location)} target="_blank" rel="noreferrer" className={linkBtn}>
                    <ExternalLink size={16} aria-hidden="true" />
                    Abrir en Google Maps
                  </a>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sin ubicación: quien escaneó no la compartió.</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
