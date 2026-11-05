import { AuthShell } from '@/features/auth/components/AuthShell';
import { ResetForm } from '@/features/auth/components/ResetForm';

export const metadata = { title: 'Contraseña nueva — HelpJuy' };

export default async function RestablecerPage({ searchParams }: PageProps<'/restablecer'>) {
  const { token } = await searchParams;
  return (
    <AuthShell title="Elegí una contraseña nueva">
      <ResetForm token={typeof token === 'string' ? token : ''} />
    </AuthShell>
  );
}
