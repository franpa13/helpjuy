'use client';

import type { EmergencyAlertResultDto } from '@helpjuy/contracts';
import { BellRing, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { postJson } from '@/shared/api/client';
import styles from './emergency-card.module.css';

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
  const [notified, setNotified] = useState(0);

  async function send() {
    setStep('sending');
    try {
      const pos = shareLocation ? await getPosition() : null;
      const r = await postJson<EmergencyAlertResultDto>(`/public/cards/${token}/emergency`, pos ?? {});
      setNotified(r.notified);
      setStep('done');
    } catch {
      setStep('error');
    }
  }

  const waText = `Hola, estoy con ${firstName} ${lastName}. Escaneé su ficha de emergencia de HelpJuy porque necesita ayuda.`;

  return (
    <section className={styles.actions} aria-label="Avisar a la familia">
      {step === 'idle' && (
        <button type="button" className={styles.alertBtn} onClick={() => setStep('confirm')}>
          <BellRing size={22} aria-hidden="true" />
          Es una emergencia: avisar a la familia
        </button>
      )}

      {(step === 'confirm' || step === 'sending') && (
        <div className={styles.confirm}>
          <p>
            <strong>¿Confirmás que {firstName} necesita ayuda?</strong> Le mandamos un aviso a su familia ahora.
          </p>
          <label className={styles.locCheck}>
            <input type="checkbox" checked={shareLocation} onChange={(e) => setShareLocation(e.target.checked)} />
            Compartir mi ubicación aproximada (ayuda a que lleguen)
          </label>
          <div className={styles.confirmRow}>
            <button type="button" className={styles.alertBtn} onClick={send} disabled={step === 'sending'}>
              {step === 'sending' ? 'Avisando…' : `Sí, avisar a la familia de ${firstName}`}
            </button>
            <button type="button" className={styles.cancelBtn} onClick={() => setStep('idle')} disabled={step === 'sending'}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <p className={styles.doneMsg} role="status">
          <strong>
            {notified > 0
              ? `Avisamos a ${notified} ${notified === 1 ? 'persona' : 'personas'} de la familia de ${firstName}.`
              : `Avisamos a la familia de ${firstName}.`}
          </strong>{' '}
          Si es grave, llamá al 107 ahora.
        </p>
      )}

      {step === 'error' && (
        <p className={styles.errorMsg} role="alert">
          No pudimos avisar (puede ser la señal). Llamá al 107 y, si podés, al contacto de emergencia.
        </p>
      )}

      {contact && (
        <a className={styles.waBtn} href={whatsappHref(contact.phone, waText)} target="_blank" rel="noreferrer">
          <MessageCircle size={20} aria-hidden="true" />
          Avisar por WhatsApp a {contact.name}
        </a>
      )}
    </section>
  );
}
