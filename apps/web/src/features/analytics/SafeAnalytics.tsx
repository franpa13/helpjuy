'use client';

import { Analytics } from '@vercel/analytics/next';
import { redactUrl } from './redact';

/**
 * Vercel Web Analytics: sin cookies ni identificar personas. Antes de mandar cada visita
 * reemplazamos los links secretos (fichas, invitaciones, tokens) por un nombre genérico.
 */
export function SafeAnalytics() {
  return <Analytics beforeSend={(event) => ({ ...event, url: redactUrl(event.url) })} />;
}
