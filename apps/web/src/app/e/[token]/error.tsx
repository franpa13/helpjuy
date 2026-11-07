'use client';

import { Button } from '@/components/ui/button';
import { CallButton, CardPage, CardStrip, callbar, sec } from '@/features/emergency-card/components/card-ui';

/** Si la ficha no se puede cargar, nunca dejamos a nadie sin el botón de 107. */
export default function CardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <CardPage>
      <CardStrip />
      <main className={sec}>
        <h1 className="text-[34px]/[0.92]">No pudimos cargar la ficha</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Puede ser la señal. Si alguien necesita ayuda, llamá al 107 ahora y probá de nuevo después.
        </p>
        <Button type="button" variant="outline" size="compact" onClick={reset} className="mt-4 min-h-12 text-[17px]">
          Reintentar
        </Button>
      </main>
      <nav aria-label="Llamadas">
        <div className={callbar}>
          <CallButton href="tel:107" tone="sos" caption="Emergencias · SAME Jujuy" title="Llamar 107" />
        </div>
      </nav>
    </CardPage>
  );
}
