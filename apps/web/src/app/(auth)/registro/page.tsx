import { AuthShell } from '@/features/auth/components/AuthShell';
import { RegisterForm } from '@/features/auth/components/RegisterForm';

export const metadata = { title: 'Creá tu ficha — HelpJuy' };

export default function RegistroPage() {
  return (
    <AuthShell
      variant="register"
      step={1}
      title="Creá tu cuenta"
      subtitle="Es gratis. Después cargás tu ficha y te llevás tu QR."
    >
      <RegisterForm googleEnabled={process.env.GOOGLE_AUTH_ENABLED === 'true'} />
    </AuthShell>
  );
}
