import { AuthShell } from '@/features/auth/components/AuthShell';
import { ForgotForm } from '@/features/auth/components/ForgotForm';

export const metadata = { title: 'Recuperar contraseña — HelpJuy' };

export default function RecuperarPage() {
  return (
    <AuthShell title="Recuperar contraseña" subtitle="Te mandamos un link a tu email para elegir una nueva.">
      <ForgotForm />
    </AuthShell>
  );
}
