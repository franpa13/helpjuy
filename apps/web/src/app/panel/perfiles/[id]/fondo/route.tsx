import { printableData, type MedicalRecordResponse, type ProfileDto } from '@helpjuy/contracts';
import { ImageResponse } from 'next/og';
import QRCode from 'qrcode';
import { WALLPAPER_SIZE, Wallpaper } from '@/features/print/components/Wallpaper';
import { resolveSiteUrl } from '@/features/print/site-url';
import { apiServer } from '@/shared/api/server';

export const runtime = 'nodejs';

/** Fondo de pantalla de bloqueo con el QR, para quien no tiene impresora. Solo para el dueño de la ficha. */
export async function GET(_request: Request, { params }: RouteContext<'/panel/perfiles/[id]/fondo'>) {
  const { id } = await params;
  const [profile, record] = await Promise.all([
    apiServer<ProfileDto>(`/profiles/${id}`),
    apiServer<MedicalRecordResponse>(`/profiles/${id}/record`),
  ]);
  // Sin sesión o ficha ajena: la API responde 401/404 y acá no se dice cuál de los dos.
  if (!profile || !record) return new Response('No encontrada', { status: 404 });

  const url = `${resolveSiteUrl()}/e/${profile.publicToken}`;
  const qrDataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 560,
    color: { dark: '#141414', light: '#ffffff' },
  });
  const data = printableData(profile, record.data, record.visibility);
  const file = `helpjuy-fondo-${profile.firstName}`.normalize('NFD').replace(/[^\w-]/g, '').toLowerCase();

  return new ImageResponse(<Wallpaper data={data} qrDataUrl={qrDataUrl} />, {
    ...WALLPAPER_SIZE,
    headers: {
      'Content-Disposition': `attachment; filename="${file}.png"`,
      // Lleva datos médicos y el QR (que es una llave): que no quede en ningún caché compartido.
      'Cache-Control': 'private, no-store',
    },
  });
}
