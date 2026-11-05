import { AuthShell } from '@/features/auth/components/AuthShell';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata = { title: 'Ingresá — HelpJuy' };

export default async function IngresarPage({ searchParams }: PageProps<'/ingresar'>) {
  const { next, error } = await searchParams;
  const googleEnabled = process.env.GOOGLE_AUTH_ENABLED === 'true';
  return (
    <AuthShell variant="login" title="Ingresá" subtitle={googleEnabled ? 'Con Google o con tu email.' : 'Con tu email y tu contraseña.'}>
      <LoginForm
        next={typeof next === 'string' ? next : undefined}
        error={typeof error === 'string' ? error : undefined}
        googleEnabled={googleEnabled}
      />
    </AuthShell>
  );
}
