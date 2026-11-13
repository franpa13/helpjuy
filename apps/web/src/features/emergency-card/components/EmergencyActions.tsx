'use client';

import type { EmergencyAlertResultDto } from '@helpjuy/contracts';
import { BellRing, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { postJson } from '@/shared/api/client';
import { Alert } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

/** Botón grande para avisar (más alto que el normal: se toca con apuro). */
const alertBtn = 'min-h-14 gap-2.5 tracking-normal disabled:opacity-60';
const cancelBtn = 'min-h-14 bg-white font-sans text-[17px] font-bold normal-case tracking-normal';

/** Número argentino a formato internacional de WhatsApp (549 + área + número, sin 0 ni 15). */
export function whatsappHref(phone: string, text: string): string {
  let d = phone.replace(/\D/g, '');
  if (d.startsWith('54')) d = d.slice(2);
  if (d.startsWith('9')) d = d.slice(1);
  if (d.startsWith('0')) d = d.slice(1);
  if (d.length === 12) {
    const i = [3, 2, 4].find((k) => d.slice(k, k + 2) === '15');
    if (i !== undefined) d = d.slice(0, i) + d.slice(i + 2);
  }
  return `https://wa.me/549${d}?text=${encodeURIComponent(text)}`;
}

const getPosition = () =>
  new Promise<{ lat: number; lng: number } | null>((resolve) => {
    if (!('geolocation' in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 60_000 },
    );
  });

type Props = {
  token: string;
  firstName: string;
  lastName: string;
  contact?: { name: string; phone: string };
  /** Ficha de ejemplo: no manda nada ni pide la ubicación, solo muestra cómo funciona. */
  demo?: boolean;
};

export function EmergencyActions({ token, firstName, lastName, contact, demo = false }: Props) {
  const [step, setStep] = useState<'idle' | 'confirm' | 'sending' | 'done' | 'error' | 'demo'>('idle');
  const [shareLocation, setShareLocation] = useState(true);
  const [result, setResult] = useState<EmergencyAlertResultDto>({ notified: 0, family: 0 });

  async function send() {
    if (demo) {
      setStep('demo');
      return;
    }
    setStep('sending');
    try {
      const pos = shareLocation ? await getPosition() : null;
      const r = await postJson<EmergencyAlertResultDto>(`/public/cards/${token}/emergency`, pos ?? {});
      setResult(r);
      setStep('done');
    } catch {
      setStep('error');
    }
  }

  const waText = `Hola, estoy con ${firstName} ${lastName}. Escaneé su ficha de emergencia de HelpJuy porque necesita ayuda.`;

  return (
    <section className="grid gap-2.5 border-b border-line bg-white p-4 card:px-8" aria-label="Avisar a la familia">
      {step === 'idle' && (
        <Button type="button" className={alertBtn} onClick={() => setStep('confirm')}>
          <BellRing size={22} aria-hidden="true" />
          Es una emergencia: avisar a la familia
        </Button>
      )}

      {(step === 'confirm' || step === 'sending') && (
        <div className="grid gap-2.5 border-2 border-red bg-red-tint p-3.5">
          <p>
            <strong>¿Confirmás que {firstName} necesita ayuda?</strong> Le mandamos un aviso a su familia ahora.
          </p>
          <label className="flex cursor-pointer items-center gap-2.5 font-bold">
            <Checkbox
              checked={shareLocation}
              onCheckedChange={(v) => setShareLocation(v === true)}
              className="data-checked:border-red data-checked:bg-red"
            />
            Compartir mi ubicación aproximada (ayuda a que lleguen)
          </label>
          <div className="grid gap-2 min-[560px]:grid-cols-[1fr_auto]">
            <Button type="button" className={alertBtn} onClick={send} disabled={step === 'sending'}>
              {step === 'sending' && <Spinner className="size-5" />}
              {step === 'sending' ? 'Avisando…' : `Sí, avisar a la familia de ${firstName}`}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="inline"
              className={cancelBtn}
              onClick={() => setStep('idle')}
              disabled={step === 'sending'}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <Alert variant="success" className="p-3.5 font-bold">
          <strong>
            {result.family > 0
              ? `Avisamos a ${result.family} ${result.family === 1 ? 'persona' : 'personas'} de la familia de ${firstName}.`
              : result.notified > 0
                ? `${firstName} no tiene familia registrada en HelpJuy. Le avisamos solo a ${firstName} por email.`
                : `No hay a quién avisar por HelpJuy.`}
          </strong>{' '}
          {result.family > 0 ? 'Si es grave, llamá al 107 ahora.' : 'Llamá al 107 y, si podés, al contacto de emergencia.'}
        </Alert>
      )}

      {step === 'demo' && (
        <Alert variant="success" className="p-3.5">
          <strong>En una ficha real, acá le llega un email a la familia de {firstName}</strong> con la hora y la ubicación
          aproximada en el mapa, y a vos te recordamos llamar al 107. Esta es de ejemplo: no avisamos a nadie.
        </Alert>
      )}

      {step === 'error' && (
        <Alert variant="error" className="p-3.5 font-bold">
          <p>No pudimos avisar (puede ser la señal). Llamá al 107 y, si podés, al contacto de emergencia.</p>
          <Button type="button" variant="outline" size="inline" className={cn(cancelBtn, 'mt-2.5')} onClick={send}>
            Reintentar
          </Button>
        </Alert>
      )}

      {contact && (
        <a className={cn(buttonVariants({ size: 'compact' }), 'min-h-13 border-[#1d8a4a] bg-[#1d8a4a] text-[17px]')} href={demo ? '#demo' : whatsappHref(contact.phone, waText)} {...(demo ? {} : { target: '_blank', rel: 'noreferrer' })}>
          <MessageCircle size={20} aria-hidden="true" />
          Avisar por WhatsApp a {contact.name}
        </a>
      )}
    </section>
  );
}
