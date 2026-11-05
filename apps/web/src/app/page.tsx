import Link from 'next/link';
import { AppStrip } from '@/features/auth/components/AuthShell';
import { buttonClass } from '@/shared/ui/Button';

// Página de inicio provisoria: la landing completa llega en el Plan 4.
export default function Home() {
  return (
    <>
      <AppStrip />
      <main className="page stack">
        <div className="page-title">
          <h1>Tu ficha médica de emergencia</h1>
          <p>Si tenés un accidente, el paramédico escanea tu QR y sabe cómo ayudarte.</p>
        </div>
        <Link className={buttonClass()} href="/registro">
          Crear mi ficha gratis
        </Link>
        <Link className={buttonClass('secondary')} href="/ingresar">
          Ya tengo cuenta
        </Link>
      </main>
    </>
  );
}
