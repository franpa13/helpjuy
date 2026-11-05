import type { MedicalRecordResponse, ProfileDto } from '@helpjuy/contracts';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { RecordEditor } from '@/features/medical-record/components/RecordEditor';
import { apiServer } from '@/shared/api/server';

export const metadata = { title: 'Editar ficha — HelpJuy' };

export default async function EditarFichaPage({ params }: PageProps<'/panel/perfiles/[id]'>) {
  const { id } = await params;
  const me = await apiServer('/auth/me');
  if (!me) redirect(`/ingresar?next=/panel/perfiles/${id}`);
  const [profile, record] = await Promise.all([
    apiServer<ProfileDto>(`/profiles/${id}`),
    apiServer<MedicalRecordResponse>(`/profiles/${id}/record`),
  ]);
  if (!profile || !record) notFound();

  return (
    <>
      <main className="page page-wide">
        <p style={{ marginBottom: 12 }}>
          <Link href="/panel">← Mis fichas</Link>
        </p>
        <div className="page-title">
          <h1>
            {profile.firstName} {profile.lastName}
          </h1>
          <p>Todo es opcional. Completá lo que quieras y elegí qué se ve al escanear tu QR.</p>
        </div>
        <RecordEditor profile={profile} initial={{ data: record.data, visibility: record.visibility }} />
      </main>
    </>
  );
}
