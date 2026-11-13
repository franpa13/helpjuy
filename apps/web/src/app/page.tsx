import QRCode from 'qrcode';
import { Landing } from '@/features/landing/components/Landing';
import { resolveSiteUrl } from '@/features/print/site-url';

/** QR de la ficha de ejemplo. Se genera una vez por proceso: la URL no cambia. */
let demoQr: Promise<string | undefined> | undefined;

function demoQrSvg(): Promise<string | undefined> {
  demoQr ??= QRCode.toString(`${resolveSiteUrl()}/demo`, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: { dark: '#141414', light: '#ffffff' },
  }).catch(() => {
    // Si no se puede generar (p. ej. falta SITE_URL), la portada igual se muestra con el botón; se reintenta después.
    demoQr = undefined;
    return undefined;
  });
  return demoQr;
}

export default async function Home({ searchParams }: PageProps<'/'>) {
  const { cuenta } = await searchParams;
  return <Landing accountDeleted={cuenta === 'borrada'} demoQrSvg={await demoQrSvg()} />;
}
