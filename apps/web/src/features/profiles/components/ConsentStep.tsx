'use client';

import type { ConsentAcceptance, ConsentDto } from '@helpjuy/contracts';
import { useState } from 'react';
import Markdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { checkCard } from '@/components/ui/choice';

type Props = {
  consent: ConsentDto;
  isMinor: boolean;
  sending?: boolean;
  onAccept: (acceptance: ConsentAcceptance) => void;
};

export function ConsentStep({ consent, isMinor, sending = false, onAccept }: Props) {
  // Ley 25.326: el consentimiento tiene que ser expreso, nunca premarcado.
  const [accepted, setAccepted] = useState(false);
  const [guardian, setGuardian] = useState(false);
  const canSubmit = accepted && (!isMinor || guardian) && !sending;

  return (
    <div className="stack">
      <div
        className="max-h-[340px] overflow-y-auto border border-l-8 border-line border-l-blue bg-white p-4 text-base [&_h2]:mb-2.5 [&_h2]:text-xl [&_p+p]:mt-2.5"
        tabIndex={0} aria-label="Texto del consentimiento">
        <Markdown>{consent.text}</Markdown>
      </div>
      <label className={checkCard}>
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
        <span>Leí y acepto que estos datos se guarden y que lo que marque como público se muestre al escanear mi QR.</span>
      </label>
      {isMinor && (
        <label className={checkCard}>
          <input type="checkbox" checked={guardian} onChange={(e) => setGuardian(e.target.checked)} />
          <span>Soy padre, madre o tutor de esta persona.</span>
        </label>
      )}
      <Button
        type="button"
        disabled={!canSubmit}
        onClick={() => onAccept({ version: consent.version, accepted: true, guardianDeclared: isMinor ? guardian : false })}
      >
        {sending ? 'Creando…' : 'Aceptar y crear perfil'}
      </Button>
      <p className="text-sm text-muted-foreground">
        Versión del consentimiento: {consent.version}
      </p>
    </div>
  );
}
