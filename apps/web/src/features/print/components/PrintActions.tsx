'use client';

import { Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiError, postJson } from '@/shared/api/client';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import styles from './print.module.css';

type Step = 'idle' | 'confirm' | 'saving' | 'done' | 'outdated' | 'error';

/**
 * Imprime y recién cuando la persona confirma que salió bien lo marca como impreso.
 * Manda la huella de lo que la página mostró: si los datos cambiaron mientras tanto, el servidor lo rechaza.
 */
export function PrintActions({ profileId, fingerprint }: { profileId: string; fingerprint: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('idle');

  function print() {
    // Directo en el clic: algunos navegadores (iOS) solo permiten imprimir dentro del gesto del usuario.
    window.print();
    setStep('confirm');
  }

  async function confirm() {
    setStep('saving');
    try {
      await postJson(`/profiles/${profileId}/printed`, { fingerprint });
      setStep('done');
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'print_outdated') {
        setStep('outdated');
        router.refresh();
      } else {
        setStep('error');
      }
    }
  }

  return (
    <div className={styles.actions}>
      {(step === 'idle' || step === 'done' || step === 'outdated' || step === 'error') && (
        <Button type="button" onClick={print}>
          <Printer size={20} aria-hidden="true" />
          Imprimir
        </Button>
      )}

      {(step === 'confirm' || step === 'saving') && (
        <div className={styles.confirm} role="group" aria-label="Confirmar impresión">
          <p>
            <strong>¿Se imprimió bien?</strong> Así te avisamos si algún día hay que reimprimirlo.
          </p>
          <div className={styles.confirmRow}>
            <Button type="button" onClick={confirm} disabled={step === 'saving'}>
              Sí, ya lo tengo impreso
            </Button>
            <Button type="button" variant="outline" onClick={print} disabled={step === 'saving'}>
              No, lo intento de nuevo
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && <Alert variant="success">Listo. Si cambiás algo de lo impreso, te avisamos para reimprimirlo.</Alert>}
      {step === 'outdated' && (
        <Alert variant="warning">Tus datos cambiaron mientras imprimías. Actualizamos la hoja: imprimila de nuevo.</Alert>
      )}
      {step === 'error' && <Alert variant="error">No pudimos guardar que lo imprimiste. Tu hoja está bien; probá confirmar de nuevo.</Alert>}
    </div>
  );
}
