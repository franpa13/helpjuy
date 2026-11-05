import { AuthShell } from '@/features/auth/components/AuthShell';
import { VerifyEmail } from '@/features/auth/components/VerifyEmail';

export const metadata = { title: 'Confirmar email — HelpJuy' };

export default async function VerificarPage({ searchParams }: PageProps<'/verificar'>) {
  const { token } = await searchParams;
  return (
    <AuthShell variant="recover" title="Confirmar email">
      <VerifyEmail token={typeof token === 'string' ? token : ''} />
    </AuthShell>
  );
}
