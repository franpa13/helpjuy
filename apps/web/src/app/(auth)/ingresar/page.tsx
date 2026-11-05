import { AuthShell } from '@/features/auth/components/AuthShell';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata = { title: 'Ingresá — HelpJuy' };

export default async function IngresarPage({ searchParams }: PageProps<'/ingresar'>) {
  const { next } = await searchParams;
  return (
    <AuthShell title="Ingresá">
      <LoginForm next={typeof next === 'string' ? next : undefined} />
    </AuthShell>
  );
}
