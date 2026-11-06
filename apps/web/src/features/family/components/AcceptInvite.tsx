'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiError, postJson } from '@/shared/api/client';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export function AcceptInvite({ token, groupName }: { token: string; groupName: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function accept() {
    setSending(true);
    try {
      await postJson(`/family-invites/${token}/accept`);
      router.push('/panel/familia');
      router.refresh();
    } catch (err) {
      setSending(false);
      setError(
        err instanceof ApiError && err.code === 'invalid_token'
          ? 'La invitación venció o ya se usó. Pedile a quien te invitó un link nuevo.'
          : 'No pudimos unirte al grupo. Probá de nuevo.',
      );
    }
  }

  return (
    <div className="stack">
      {error && <Alert variant="error">{error}</Alert>}
      <Button type="button" onClick={accept} disabled={sending}>
        {sending ? 'Uniéndote…' : `Unirme a ${groupName}`}
      </Button>
    </div>
  );
}
