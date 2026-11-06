import { printFingerprintInput, printableData, type MedicalRecordResponse, type ProfileDto } from '@helpjuy/contracts';
import Link from 'next/link';
import { createHash } from 'node:crypto';
import { notFound, redirect } from 'next/navigation';
import QRCode from 'qrcode';
import { PrintActions } from '@/features/print/components/PrintActions';
import { PrintSheet } from '@/features/print/components/PrintSheet';
import { resolveSiteUrl } from '@/features/print/site-url';
import { apiServer } from '@/shared/api/server';
import { Alert } from '@/components/ui/alert';
import { PanelBox, PanelPage } from '@/features/panel/components/PanelPage';

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
    <PanelPage
      title="Imprimí tu QR"
      subtitle="Una hoja A4 con la tarjeta para la billetera, dos stickers y una versión grande. Recortá por las líneas punteadas."
      back={{ href: `/panel/perfiles/${id}`, label: `Ficha de ${profile.firstName}` }}
      asideLabel="Imprimir"
      aside={
        <>
          {profile.printStatus === 'outdated' && (
            <Alert variant="warning">Cambiaron datos de lo que tenés impreso (o generaste un QR nuevo). Volvé a imprimirlo y reemplazá el viejo.</Alert>
          )}
          {!profile.active && (
            <Alert variant="warning">
              Todavía no cargaste un contacto de emergencia. Podés imprimir igual, pero conviene{' '}
              <Link href={`/panel/perfiles/${id}`}>agregarlo</Link> antes.
            </Alert>
          )}
          <PanelBox title="Imprimir">
            <PrintActions profileId={id} fingerprint={fingerprint} />
            {/* La misma dirección que va dentro del QR: si está mal configurada, se nota acá antes de imprimir. */}
            <a className="mt-3 inline-block font-bold" href={url} target="_blank" rel="noreferrer">
              Probar el QR: ver como el paramédico
            </a>
          </PanelBox>
          <PanelBox title="Consejos">
            <ul className="grid gap-1.5 pl-5 text-muted-foreground">
              <li>
                Para el casco o la moto, usá <strong>papel autoadhesivo</strong> y cubrilo con <strong>cinta transparente</strong> para que
                aguante el sol y la lluvia.
              </li>
              <li>
                La tarjeta de billetera dura más si la <strong>plastificás</strong>.
              </li>
              <li>Lo impreso muestra solo lo que elegiste que se vea. Si cambiás algo, te avisamos para reimprimir.</li>
            </ul>
          </PanelBox>
        </>
      }
    >
      <div className="overflow-x-auto pb-2 print:overflow-visible">
        <PrintSheet data={data} qrSvg={qrSvg} url={url} />
      </div>
    </PanelPage>
  );
}
