import { AuthShell } from '@/features/auth/components/AuthShell';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const metadata = { title: 'Creá tu ficha — HelpJuy' };

export default function RegistroPage() {
  return (
    <AuthShell title="Creá tu ficha de emergencia" subtitle="Tarda menos de 3 minutos. Es gratis.">
      <RegisterForm />
    </AuthShell>
  );
}
