import { printFingerprintInput, printableData, type MedicalRecordResponse, type ProfileDto } from '@helpjuy/contracts';
import Link from 'next/link';
import { createHash } from 'node:crypto';
import { notFound, redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { PrintActions } from '@/features/print/components/PrintActions';
import { PrintSheet } from '@/features/print/components/PrintSheet';
import { resolveSiteUrl } from '@/features/print/site-url';
import { apiServer } from '@/shared/api/server';
import { Alert } from '@/shared/ui/Alert';
import styles from './imprimir.module.css';

export const metadata = { title: 'Imprimir mi QR — HelpJuy' };

export default async function ImprimirPage({ params }: PageProps<'/panel/perfiles/[id]/imprimir'>) {
  const { id } = await params;
  const me = await apiServer('/auth/me');
  if (!me) redirect(`/ingresar?next=/panel/perfiles/${id}/imprimir`);
  const [profile, record] = await Promise.all([
    apiServer<ProfileDto>(`/profiles/${id}`),
    apiServer<MedicalRecordResponse>(`/profiles/${id}/record`),
  ]);
  if (!profile || !record) notFound();

  const url = `${resolveSiteUrl()}/e/${profile.publicToken}`;
  const qrSvg = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1, // borde blanco: los lectores lo toman aunque el sticker vaya sobre algo oscuro
    color: { dark: '#141414', light: '#ffffff' },
  });
  const data = printableData(profile, record.data, record.visibility);
  // Huella de exactamente lo que muestra esta hoja (misma fórmula que la API).
  const fingerprint = createHash('sha256').update(printFingerprintInput(profile.publicToken, data)).digest('hex');

  return (
    <main className="page page-wide stack">
      <p>
        <Link href={`/panel/perfiles/${id}`}>← Volver a la ficha</Link>
      </p>
      <div className="page-title">
        <h1>Imprimí tu QR</h1>
        <p>Una hoja A4 con la tarjeta para la billetera, dos stickers y una versión grande. Recortá por las líneas punteadas.</p>
      </div>

      {profile.printStatus === 'outdated' && (
        <Alert tone="warning">Cambiaron datos de lo que tenés impreso (o generaste un QR nuevo). Volvé a imprimirlo y reemplazá el viejo.</Alert>
      )}
      {!profile.active && (
        <Alert tone="warning">
          Todavía no cargaste un contacto de emergencia. Podés imprimir igual, pero conviene <Link href={`/panel/perfiles/${id}`}>agregarlo</Link> antes.
        </Alert>
      )}

      <div className={styles.toolbar}>
        <PrintActions profileId={id} fingerprint={fingerprint} />
        {/* La misma dirección que va dentro del QR: si está mal configurada, se nota acá antes de imprimir. */}
        <a className={styles.preview} href={url} target="_blank" rel="noreferrer">
          Probar el QR: ver como el paramédico
        </a>
      </div>

      <ul className={styles.tips}>
        <li>Para el casco o la moto, usá <strong>papel autoadhesivo</strong> y cubrilo con <strong>cinta transparente</strong> para que aguante el sol y la lluvia.</li>
        <li>La tarjeta de billetera dura más si la <strong>plastificás</strong>.</li>
        <li>Lo impreso muestra solo lo que elegiste que se vea. Si cambiás algo, te avisamos para reimprimir.</li>
      </ul>

      <div className={styles.sheetWrap}>
        <PrintSheet data={data} qrSvg={qrSvg} url={url} />
      </div>
    </main>
  );
}
