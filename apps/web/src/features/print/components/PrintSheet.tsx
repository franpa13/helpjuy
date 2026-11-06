import type { PrintableData } from '@helpjuy/contracts';
import { cn } from '@/lib/utils';
import { LogoSymbol } from '@/shared/brand/Logo';

/*
 * Hoja imprimible: medidas reales en milímetros (valores arbitrarios de Tailwind).
 * En pantalla se ve igual que en el papel. Colores fijos en hex: la impresión no depende del tema.
 */

type Props = { data: PrintableData; qrSvg: string; url: string };
type Size = 'card' | 'sticker' | 'fridge';

/** Línea de corte punteada alrededor de cada pieza. */
const cut = 'overflow-hidden break-inside-avoid bg-white outline-[0.4mm] outline-offset-[1.2mm] outline-[#9a9a9a] outline-dashed';
const head = 'flex items-center gap-[1.5mm] bg-[#c8102e] font-head font-extrabold uppercase tracking-[0.08em] text-white';
const nameCls = 'font-head font-extrabold uppercase wrap-anywhere';

/** El SVG lo genera la librería `qrcode` en el servidor a partir de nuestra URL: es contenido confiable. */
function Qr({ svg, className }: { svg: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label="Código QR de la ficha de emergencia"
      className={cn('[&_svg]:block [&_svg]:h-auto [&_svg]:w-full', className)}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function Head({ small = false, className }: { small?: boolean; className?: string }) {
  return (
    <div className={cn(head, small ? 'mb-[1mm] px-[1.6mm] py-[0.8mm] text-[2.6mm]' : 'px-[3mm] py-[1.6mm] text-[3.6mm]', className)}>
      <LogoSymbol size={small ? 10 : 13} color="currentColor" crossColor="currentColor" />
      Emergencia médica
    </div>
  );
}

const CRITICAL: Record<Size, { list: string; row: string }> = {
  card: { list: 'gap-[0.8mm] text-[2.6mm]/[1.2]', row: 'grid-cols-[11mm_1fr]' },
  sticker: { list: 'gap-[0.5mm] text-[2.35mm]/[1.2]', row: 'grid-cols-[9.5mm_1fr]' },
  fridge: { list: 'w-full gap-[0.8mm] px-[6mm] text-left text-[3.6mm]/[1.2]', row: 'grid-cols-[17mm_1fr]' },
};

function Critical({ data, size }: { data: PrintableData; size: Size }) {
  const s = CRITICAL[size];
  const row = cn(
    'grid gap-[1mm] [&_dd]:m-0 [&_dd]:font-bold [&_dd]:wrap-anywhere [&_dt]:font-head [&_dt]:font-bold [&_dt]:uppercase [&_dt]:tracking-[0.04em] [&_dt]:text-[#444]',
    s.row,
  );
  return (
    <dl className={cn('grid', s.list)}>
      {data.anticoagulant && (
        <p className="mb-[0.4mm] justify-self-start bg-[#141414] px-[1.4mm] py-[0.5mm] font-head text-[2.6mm] font-extrabold tracking-[0.08em] text-white">
          ANTICOAGULADO
        </p>
      )}
      {(data.allergies.length > 0 || data.noAllergies) && (
        <div className={row}>
          <dt>Alergias</dt>
          <dd className="text-[#c8102e] uppercase">
            {data.noAllergies ? 'Sin alergias conocidas' : data.allergies.join(', ')}
            {data.moreAllergies > 0 && <span className="text-[#141414]"> +{data.moreAllergies}</span>}
          </dd>
        </div>
      )}
      {data.bloodType && (
        <div className={row}>
          <dt>Sangre</dt>
          <dd className="text-[3.4mm] text-[#c8102e]">{data.bloodType}</dd>
        </div>
      )}
      {data.contact && (
        <div className={row}>
          <dt>Llamar</dt>
          <dd>
            {data.contact.name.split(' ')[0]} · {data.contact.phone}
          </dd>
        </div>
      )}
    </dl>
  );
}

/** Tarjeta 85,6 × 54 mm (tamaño de una tarjeta de crédito). */
const card = 'flex h-[54mm] w-[85.6mm] flex-col rounded-[3mm] border-[0.5mm] border-[#141414]';

export function WalletCardFront({ data, qrSvg }: Omit<Props, 'url'>) {
  return (
    <section className={cn(cut, card)} aria-label="Tarjeta de billetera (frente)">
      <Head />
      <div className="grid flex-1 grid-cols-[27mm_1fr] gap-[2.5mm] px-[2.5mm] py-[2.2mm]">
        <div className="grid content-start justify-items-center gap-[0.8mm]">
          <Qr svg={qrSvg} />
          <span className="font-head text-[2.6mm] font-extrabold uppercase">Escaneame</span>
        </div>
        <div className="min-w-0">
          <p className={cn(nameCls, 'mb-[1.4mm] line-clamp-2 text-[4.6mm]/none')}>{data.name}</p>
          <Critical data={data} size="card" />
        </div>
      </div>
    </section>
  );
}

export function WalletCardBack({ data, url }: Pick<Props, 'data' | 'url'>) {
  return (
    <section
      className={cn(cut, card, 'gap-[1.4mm] px-[3.4mm] py-[3mm] text-[2.7mm]/[1.3]')}
      aria-label="Tarjeta de billetera (dorso)"
    >
      <p className="font-head text-[3.8mm] leading-none font-extrabold text-[#c8102e] uppercase">Si me encontrás herido o inconsciente</p>
      <ol className="m-0 grid gap-[0.8mm] pl-[4mm]">
        <li>
          Llamá al <strong>107</strong> (SAME Jujuy).
        </li>
        <li>Escaneá el QR del frente con la cámara del celular: ahí está mi ficha médica.</li>
        {data.contact && (
          <li>
            Avisale a <strong>{data.contact.name}</strong>: {data.contact.phone}.
          </li>
        )}
      </ol>
      <p className="mt-auto text-[2.6mm] text-[#444] wrap-anywhere">{url.replace(/^https?:\/\//, '')}</p>
      <p className="text-[2.6mm] font-bold">HelpJuy · ficha de emergencia gratuita</p>
    </section>
  );
}

/** Sticker 80 × 50 mm: más chico que la tarjeta, todo un poco más compacto para que no se corte nada. */
export function HelmetSticker({ data, qrSvg }: Omit<Props, 'url'>) {
  return (
    <section
      className={cn(cut, 'grid h-[50mm] w-[80mm] grid-cols-[30mm_1fr] gap-[2.4mm] rounded-[2mm] border-[0.8mm] border-[#c8102e] p-[2.4mm]')}
      aria-label="Sticker para casco o moto"
    >
      <Qr svg={qrSvg} className="self-center" />
      <div className="min-w-0">
        <Head small />
        <p className={cn(nameCls, 'mb-[1.2mm] line-clamp-1 text-[3.6mm]/none')}>{data.name}</p>
        <Critical data={data} size="sticker" />
      </div>
    </section>
  );
}

/** Heladera: A6, 105 × 148 mm. */
export function FridgeCard({ data, qrSvg }: Omit<Props, 'url'>) {
  return (
    <section
      className={cn(cut, 'flex h-[148mm] w-[105mm] flex-col items-center gap-[2.5mm] border-[0.8mm] border-[#141414] pb-[4mm] text-center')}
      aria-label="Versión grande para la heladera"
    >
      <Head className="self-stretch justify-center p-[2.5mm] text-[5mm]" />
      <p className={cn(nameCls, 'px-[4mm] text-[7mm]/none')}>{data.name}</p>
      <Qr svg={qrSvg} className="w-[60mm]" />
      <p className="px-[8mm] text-[3.2mm]">En una emergencia, escaneá este código con la cámara del celular</p>
      <Critical data={data} size="fridge" />
      <p className="mt-auto font-head text-[6mm] font-extrabold text-[#c8102e] uppercase">Llamá al 107</p>
    </section>
  );
}

const group = 'grid break-inside-avoid gap-[2.5mm]';
const groupTitle = 'text-[3mm] text-[#6b6b6b] print:text-[#444]';

/** Hoja A4 con todo lo imprimible. Se recorta por las líneas punteadas. */
export function PrintSheet({ data, qrSvg, url }: Props) {
  return (
    <div
      id="hoja-imprimible"
      className="grid w-[190mm] max-w-full gap-[8mm] border border-line bg-white p-[8mm] font-sans text-[#141414] print:absolute print:top-0 print:left-0 print:w-[190mm] print:border-0 print:p-0 print:[print-color-adjust:exact]"
    >
      <div className={group}>
        <p className={groupTitle}>Tarjeta de billetera · doblá por la línea del medio o pegá frente y dorso</p>
        <div className="flex flex-wrap gap-[6mm]">
          <WalletCardFront data={data} qrSvg={qrSvg} />
          <WalletCardBack data={data} url={url} />
        </div>
      </div>
      <div className={group}>
        <p className={groupTitle}>Stickers para casco, moto o celular</p>
        <div className="flex flex-wrap gap-[6mm]">
          <HelmetSticker data={data} qrSvg={qrSvg} />
          <HelmetSticker data={data} qrSvg={qrSvg} />
        </div>
      </div>
      {/* Página 1: tarjeta y stickers. Página 2: la versión grande. */}
      <div className={cn(group, 'print:break-before-page')}>
        <p className={groupTitle}>Versión grande para la heladera</p>
        <FridgeCard data={data} qrSvg={qrSvg} />
      </div>
    </div>
  );
}
