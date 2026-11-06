import type { MedicalRecordResponse, ProfileDto } from '@helpjuy/contracts';
import { notFound, redirect } from 'next/navigation';
import { RecordEditor } from '@/features/medical-record/components/RecordEditor';
import { PanelPage } from '@/features/panel/components/PanelPage';
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
    <PanelPage
      title={`${profile.firstName} ${profile.lastName}`}
      subtitle="Todo es opcional. Completá lo que quieras y elegí qué se ve al escanear tu QR."
      back={{ href: '/panel', label: 'Mis fichas' }}
    >
      <RecordEditor profile={profile} initial={{ data: record.data, visibility: record.visibility }} />
    </PanelPage>
  );
}
