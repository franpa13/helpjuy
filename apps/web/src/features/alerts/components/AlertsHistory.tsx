'use client';

import type { ReceivedAlertDto } from '@helpjuy/contracts';
import { BellOff, ExternalLink, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AlertsMap, type MapPoint } from './AlertsMap';
import styles from './alerts.module.css';

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
      <div className={styles.empty}>
        <BellOff size={28} aria-hidden="true" />
        <div>
          <h2>No hubo avisos</h2>
          <p>
            Ojalá siga así. Si alguien escanea tu QR o el de tu familia y marca una emergencia, lo vas a ver acá con la
            zona en el mapa, además del email.
          </p>
          <Link href="/panel/familia">Ver quién recibe tus avisos</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {points.length > 0 && (
        <section className={styles.mapBox} aria-label="Mapa de avisos">
          <AlertsMap points={points} selectedId={selectedId} />
          <p className={styles.mapNote}>
            Cada círculo es una zona aproximada (unos 100 metros), no el lugar exacto.
          </p>
        </section>
      )}
      <ul className={styles.list} aria-label="Avisos">
        {alerts.map((a) => (
          <li key={a.id} className={styles.item} data-selected={a.id === selectedId || undefined}>
            <span className={styles.dot} aria-hidden="true" />
            <div className={styles.itemBody}>
              <p className={styles.itemTitle}>
                <strong>{a.profileName}</strong>
                <span className={a.mine ? styles.tagMine : styles.tagFamily}>{a.mine ? 'Tu ficha' : 'De tu familia'}</span>
              </p>
              <p className={styles.itemWhen}>{when(a.at)}</p>
              {a.location ? (
                <div className={styles.itemActions}>
                  <button type="button" className={styles.linkBtn} onClick={() => setSelectedId(a.id)}>
                    <MapPin size={16} aria-hidden="true" />
                    Ver en el mapa
                  </button>
                  <a href={googleMaps(a.location)} target="_blank" rel="noreferrer" className={styles.linkBtn}>
                    <ExternalLink size={16} aria-hidden="true" />
                    Abrir en Google Maps
                  </a>
                </div>
              ) : (
                <p className={styles.noLocation}>Sin ubicación: quien escaneó no la compartió.</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
