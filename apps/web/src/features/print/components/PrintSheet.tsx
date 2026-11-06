import type { PrintableData } from '@helpjuy/contracts';
import { LogoSymbol } from '@/shared/brand/Logo';
import styles from './print.module.css';

type Props = { data: PrintableData; qrSvg: string; url: string };

/** El SVG lo genera la librería `qrcode` en el servidor a partir de nuestra URL: es contenido confiable. */
function Qr({ svg, className }: { svg: string; className?: string }) {
  return (
    <div
      role="img"
      aria-label="Código QR de la ficha de emergencia"
      className={`${styles.qr} ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

function Head({ small = false }: { small?: boolean }) {
  return (
    <div className={small ? styles.headSmall : styles.head}>
      <LogoSymbol size={small ? 10 : 13} color="currentColor" crossColor="currentColor" />
      Emergencia médica
    </div>
  );
}

function Critical({ data }: { data: PrintableData }) {
  return (
    <dl className={styles.critical}>
      {data.anticoagulant && <p className={styles.flag}>ANTICOAGULADO</p>}
      {(data.allergies.length > 0 || data.noAllergies) && (
        <div className={styles.row}>
          <dt>Alergias</dt>
          <dd className={styles.allergy}>
            {data.noAllergies ? 'Sin alergias conocidas' : data.allergies.join(', ')}
            {data.moreAllergies > 0 && <span className={styles.more}> +{data.moreAllergies}</span>}
          </dd>
        </div>
      )}
      {data.bloodType && (
        <div className={styles.row}>
          <dt>Sangre</dt>
          <dd className={styles.blood}>{data.bloodType}</dd>
        </div>
      )}
      {data.contact && (
        <div className={styles.row}>
          <dt>Llamar</dt>
          <dd>
            {data.contact.name.split(' ')[0]} · {data.contact.phone}
          </dd>
        </div>
      )}
    </dl>
  );
}

export function WalletCardFront({ data, qrSvg }: Omit<Props, 'url'>) {
  return (
    <section className={`${styles.cut} ${styles.card}`} aria-label="Tarjeta de billetera (frente)">
      <Head />
      <div className={styles.cardBody}>
        <div className={styles.qrCol}>
          <Qr svg={qrSvg} />
          <span className={styles.scan}>Escaneame</span>
        </div>
        <div className={styles.info}>
          <p className={styles.name}>{data.name}</p>
          <Critical data={data} />
        </div>
      </div>
    </section>
  );
}

export function WalletCardBack({ data, url }: Pick<Props, 'data' | 'url'>) {
  return (
    <section className={`${styles.cut} ${styles.card} ${styles.back}`} aria-label="Tarjeta de billetera (dorso)">
      <p className={styles.backTitle}>Si me encontrás herido o inconsciente</p>
      <ol className={styles.backSteps}>
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
      <p className={styles.url}>{url.replace(/^https?:\/\//, '')}</p>
      <p className={styles.brand}>HelpJuy · ficha de emergencia gratuita</p>
    </section>
  );
}

export function HelmetSticker({ data, qrSvg }: Omit<Props, 'url'>) {
  return (
    <section className={`${styles.cut} ${styles.sticker}`} aria-label="Sticker para casco o moto">
      <Qr svg={qrSvg} className={styles.stickerQr} />
      <div className={styles.info}>
        <Head small />
        <p className={styles.nameSmall}>{data.name}</p>
        <Critical data={data} />
      </div>
    </section>
  );
}

export function FridgeCard({ data, qrSvg }: Omit<Props, 'url'>) {
  return (
    <section className={`${styles.cut} ${styles.fridge}`} aria-label="Versión grande para la heladera">
      <Head />
      <p className={styles.fridgeName}>{data.name}</p>
      <Qr svg={qrSvg} className={styles.fridgeQr} />
      <p className={styles.fridgeScan}>En una emergencia, escaneá este código con la cámara del celular</p>
      <Critical data={data} />
      <p className={styles.fridgeSos}>Llamá al 107</p>
    </section>
  );
}

/** Hoja A4 con todo lo imprimible. Se recorta por las líneas punteadas. */
export function PrintSheet({ data, qrSvg, url }: Props) {
  return (
    <div className={styles.sheet} id="hoja-imprimible">
      <div className={styles.group}>
        <p className={styles.groupTitle}>Tarjeta de billetera · doblá por la línea del medio o pegá frente y dorso</p>
        <div className={styles.cardPair}>
          <WalletCardFront data={data} qrSvg={qrSvg} />
          <WalletCardBack data={data} url={url} />
        </div>
      </div>
      <div className={styles.group}>
        <p className={styles.groupTitle}>Stickers para casco, moto o celular</p>
        <div className={styles.stickers}>
          <HelmetSticker data={data} qrSvg={qrSvg} />
          <HelmetSticker data={data} qrSvg={qrSvg} />
        </div>
      </div>
      <div className={`${styles.group} ${styles.fridgeGroup}`}>
        <p className={styles.groupTitle}>Versión grande para la heladera</p>
        <FridgeCard data={data} qrSvg={qrSvg} />
      </div>
    </div>
  );
}
