'use client';

import 'leaflet/dist/leaflet.css';
import type { Circle, Map as LeafletMap } from 'leaflet';
import { useEffect, useRef } from 'react';

export type MapPoint = { id: string; lat: number; lng: number; label: string };

/** La ubicación se guarda redondeada a 3 decimales: dibujamos una zona, no un punto exacto. */
const RADIUS_M = 110;

/**
 * Mapa de OpenStreetMap con Leaflet (sin API key ni cuenta).
 * Leaflet toca `window`, así que se carga recién en el navegador.
 */
export function AlertsMap({ points, selectedId }: { points: MapPoint[]; selectedId: string | null }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const circles = useRef(new Map<string, Circle>());

  useEffect(() => {
    let cancelled = false;
    void import('leaflet').then((L) => {
      if (cancelled || !el.current) return;
      const m = L.map(el.current, { scrollWheelZoom: false });
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(m);
      for (const p of points) {
        const c = L.circle([p.lat, p.lng], {
          radius: RADIUS_M,
          color: '#c8102e',
          weight: 2,
          fillColor: '#e0253f',
          fillOpacity: 0.25,
        })
          .bindPopup(p.label)
          .addTo(m);
        circles.current.set(p.id, c);
      }
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number]));
      m.fitBounds(bounds.pad(0.3), { maxZoom: 16 });
      map.current = m;
    });
    const owned = circles.current;
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      owned.clear();
    };
  }, [points]);

  useEffect(() => {
    if (!selectedId || !map.current) return;
    const c = circles.current.get(selectedId);
    if (!c) return;
    map.current.flyTo(c.getLatLng(), 16, { duration: 0.6 });
    c.openPopup();
    el.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedId]);

  return <div ref={el} className="relative z-0 h-[clamp(260px,42vh,420px)] w-full" role="region" aria-label="Mapa con la zona aproximada de cada aviso" />;
}
