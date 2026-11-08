import type { PrintableData } from '@helpjuy/contracts';
import type { CSSProperties } from 'react';

/*
 * Fondo de pantalla de bloqueo con el QR. Se dibuja como imagen (next/og), así que solo estilos en línea
 * y todo con flex. Arriba queda libre para el reloj del celular y abajo para los íconos de linterna y cámara.
 * Muestra exactamente lo mismo que la tarjeta impresa (lo que la persona eligió que se vea).
 */

export const WALLPAPER_SIZE = { width: 1080, height: 2340 };

const RED = '#c8102e';
const INK = '#141414';
const NIGHT = '#0f2236';

const row: CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 24, fontSize: 40, lineHeight: 1.2 };
const rowLabel: CSSProperties = { width: 190, flexShrink: 0, fontSize: 30, letterSpacing: 2, textTransform: 'uppercase', color: '#555' };

function Row({ label, value, color = INK }: { label: string; value: string; color?: string }) {
  return (
    <div style={row}>
      <span style={rowLabel}>{label}</span>
      <span style={{ fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

export function Wallpaper({ data, qrDataUrl }: { data: PrintableData; qrDataUrl: string }) {
  const allergies = data.noAllergies
    ? 'Sin alergias conocidas'
    : data.allergies.length > 0
      ? `${data.allergies.join(', ')}${data.moreAllergies > 0 ? ` +${data.moreAllergies}` : ''}`
      : null;

  return (
    <div
      style={{
        ...WALLPAPER_SIZE,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: NIGHT,
        paddingTop: 720,
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', width: 920, background: '#fff', borderRadius: 40, overflow: 'hidden' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            background: RED,
            color: '#fff',
            fontSize: 52,
            fontWeight: 700,
            letterSpacing: 6,
            padding: '26px 0',
          }}
        >
          EMERGENCIA MÉDICA
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '36px 56px 48px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- next/og dibuja con <img>, no con next/image */}
          <img src={qrDataUrl} width={560} height={560} alt="Código QR de la ficha de emergencia" />
          <div style={{ display: 'flex', fontSize: 34, color: '#555', marginTop: 12 }}>Escaneá con la cámara del celular</div>
          <div style={{ display: 'flex', fontSize: 68, fontWeight: 700, color: INK, marginTop: 28, textAlign: 'center' }}>{data.name}</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignSelf: 'stretch', gap: 14, marginTop: 28 }}>
            {data.anticoagulant && (
              <div style={{ display: 'flex' }}>
                <span style={{ background: INK, color: '#fff', fontSize: 30, fontWeight: 700, letterSpacing: 3, padding: '6px 16px' }}>
                  ANTICOAGULADO
                </span>
              </div>
            )}
            {allergies && <Row label="Alergias" value={allergies} color={RED} />}
            {data.bloodType && <Row label="Sangre" value={data.bloodType} color={RED} />}
            {data.contact && <Row label="Llamar" value={`${data.contact.name.split(' ')[0]} · ${data.contact.phone}`} />}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', marginTop: 44, color: '#fff', fontSize: 48, fontWeight: 700, letterSpacing: 2 }}>
        EN UNA EMERGENCIA, LLAMÁ AL 107
      </div>
    </div>
  );
}
