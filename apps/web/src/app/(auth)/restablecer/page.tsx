import { AuthShell } from '@/features/auth/components/AuthShell';
import { ResetForm } from '@/features/auth/components/ResetForm';

export const metadata = { title: 'Contraseña nueva — HelpJuy' };

export default async function RestablecerPage({ searchParams }: PageProps<'/restablecer'>) {
  const { token } = await searchParams;
  return (
    <AuthShell variant="recover" title="Elegí una contraseña nueva" subtitle="Al guardarla se cierran las sesiones abiertas en otros dispositivos.">
      <ResetForm token={typeof token === 'string' ? token : ''} />
    </AuthShell>
  );
}
