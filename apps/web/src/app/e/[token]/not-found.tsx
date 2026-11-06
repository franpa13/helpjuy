import { CallButton, CardPage, CardStrip, callbar, sec } from '@/features/emergency-card/components/card-ui';

export default function CardNotFound() {
  return (
    <CardPage>
      <CardStrip />
      <main className={sec}>
        <h1 className="text-[36px]/[0.92]">Este código no corresponde a ninguna ficha activa</h1>
        <p className="mt-3 text-base text-muted-foreground">
          Puede que la persona haya generado un QR nuevo. Si alguien necesita ayuda, llamá al 107.
        </p>
      </main>
      <nav aria-label="Llamadas">
        <div className={callbar}>
          <CallButton href="tel:107" tone="sos" caption="Emergencias · SAME Jujuy" title="Llamar 107" />
        </div>
      </nav>
    </CardPage>
  );
}
