'use client';

import type { EmergencyAlertResultDto } from '@helpjuy/contracts';
import { BellRing, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { postJson } from '@/shared/api/client';
import { cn } from '@/lib/utils';
const alertBtn =
  'inline-flex min-h-14 cursor-pointer items-center justify-center gap-2.5 rounded-md bg-red px-[18px] py-3 font-head text-xl font-extrabold text-white uppercase disabled:opacity-60';
const cancelBtn = 'min-h-14 cursor-pointer rounded-md border-2 border-ink bg-white px-[18px] font-bold';

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

type Props = { token: string; firstName: string; lastName: string; contact?: { name: string; phone: string } };

export function EmergencyActions({ token, firstName, lastName, contact }: Props) {
  const [step, setStep] = useState<'idle' | 'confirm' | 'sending' | 'done' | 'error'>('idle');
  const [shareLocation, setShareLocation] = useState(true);
  const [result, setResult] = useState<EmergencyAlertResultDto>({ notified: 0, family: 0 });

  async function send() {
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
        <button type="button" className={alertBtn} onClick={() => setStep('confirm')}>
          <BellRing size={22} aria-hidden="true" />
          Es una emergencia: avisar a la familia
        </button>
      )}

      {(step === 'confirm' || step === 'sending') && (
        <div className="grid gap-2.5 border-2 border-red bg-red-tint p-3.5">
          <p>
            <strong>¿Confirmás que {firstName} necesita ayuda?</strong> Le mandamos un aviso a su familia ahora.
          </p>
          <label className="flex items-center gap-2.5 font-bold [&_input]:size-[22px] [&_input]:accent-red">
            <input type="checkbox" checked={shareLocation} onChange={(e) => setShareLocation(e.target.checked)} />
            Compartir mi ubicación aproximada (ayuda a que lleguen)
          </label>
          <div className="grid gap-2 min-[560px]:grid-cols-[1fr_auto]">
            <button type="button" className={alertBtn} onClick={send} disabled={step === 'sending'}>
              {step === 'sending' ? 'Avisando…' : `Sí, avisar a la familia de ${firstName}`}
            </button>
            <button type="button" className={cancelBtn} onClick={() => setStep('idle')} disabled={step === 'sending'}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <p className="border-l-8 border-green bg-green-tint p-3.5 font-bold" role="status">
          <strong>
            {result.family > 0
              ? `Avisamos a ${result.family} ${result.family === 1 ? 'persona' : 'personas'} de la familia de ${firstName}.`
              : result.notified > 0
                ? `${firstName} no tiene familia registrada en HelpJuy. Le avisamos solo a ${firstName} por email.`
                : `No hay a quién avisar por HelpJuy.`}
          </strong>{' '}
          {result.family > 0 ? 'Si es grave, llamá al 107 ahora.' : 'Llamá al 107 y, si podés, al contacto de emergencia.'}
        </p>
      )}

      {step === 'error' && (
        <div className="border-l-8 border-red bg-red-tint p-3.5 font-bold" role="alert">
          <p>No pudimos avisar (puede ser la señal). Llamá al 107 y, si podés, al contacto de emergencia.</p>
          <button type="button" className={cn(cancelBtn, 'mt-2.5')} onClick={send}>
            Reintentar
          </button>
        </div>
      )}

      {contact && (
        <a className="inline-flex min-h-13 items-center justify-center gap-2 rounded-md bg-[#1d8a4a] font-bold text-white no-underline" href={whatsappHref(contact.phone, waText)} target="_blank" rel="noreferrer">
          <MessageCircle size={20} aria-hidden="true" />
          Avisar por WhatsApp a {contact.name}
        </a>
      )}
    </section>
  );
}
