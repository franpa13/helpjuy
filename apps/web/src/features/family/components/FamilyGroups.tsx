'use client';

import type { CreatedInviteDto, EmergencyAlertResultDto, FamilyGroupDto, FamilyInviteDto } from '@helpjuy/contracts';
import { BellOff, BellRing, Copy, Send, UserMinus, Users } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError, apiFetch, postJson } from '@/shared/api/client';
import { Alert } from '@/shared/ui/Alert';
import { Button } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { AlertPreview, FamilyIntro, IntroLead } from './FamilyIntro';
import styles from './family.module.css';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

const waText = (groupName: string, url: string) =>
  `Te invito a "${groupName}" en HelpJuy. Si alguien escanea el QR de emergencia de uno de nosotros y marca que pasó algo, te llega un aviso. No ves datos médicos de nadie. Unite acá: ${url}`;

function CreateGroup({ onCreated, first }: { onCreated: (g: FamilyGroupDto) => void; first: boolean }) {
  const [name, setName] = useState(first ? 'Mi familia' : '');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError('Ponele un nombre al grupo');
    setSending(true);
    try {
      onCreated(await postJson<FamilyGroupDto>('/family-groups', { name }));
      setName('');
      setError(null);
    } catch {
      setError('No pudimos crear el grupo. Probá de nuevo.');
    } finally {
      setSending(false);
    }
  }

  return (
    <form className={styles.create} onSubmit={submit} noValidate>
      <Field
        label="Nombre del grupo"
        value={name}
        maxLength={60}
        onChange={(e) => setName(e.target.value)}
        placeholder="Familia Paredes"
        error={error ?? undefined}
      />
      <Button type="submit" disabled={sending}>
        Crear grupo
      </Button>
    </form>
  );
}

function GroupCard({
  group,
  onChange,
  onGone,
  autoInvite = false,
}: {
  group: FamilyGroupDto;
  onChange: (g: FamilyGroupDto) => void;
  onGone: () => void;
  /** Recién creado: mostramos el link de invitación sin un clic extra. */
  autoInvite?: boolean;
}) {
  const admin = group.myRole === 'ADMIN';
  const me = group.members.find((m) => m.isMe)!;
  const [invite, setInvite] = useState<CreatedInviteDto | null>(null);
  const [pending, setPending] = useState<FamilyInviteDto[] | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fail = (err: unknown) =>
    setNotice({
      tone: 'error',
      text:
        err instanceof ApiError && err.code === 'test_alert_cooldown'
          ? 'Ya mandaste una prueba hace poco. Esperá unos minutos para mandar otra.'
          : err instanceof ApiError && err.status === 403
            ? 'Solo quien administra el grupo puede hacer eso.'
            : 'Algo salió mal. Probá de nuevo.',
    });

  async function createInvite() {
    try {
      setInvite(await postJson<CreatedInviteDto>(`/family-groups/${group.id}/invites`));
      setPending(await apiFetch<FamilyInviteDto[]>(`/family-groups/${group.id}/invites`));
      setCopied(false);
    } catch (err) {
      fail(err);
    }
  }

  const invitedOnce = useRef(false);
  useEffect(() => {
    if (autoInvite && admin && !invitedOnce.current) {
      invitedOnce.current = true;
      void createInvite();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoInvite, admin]);

  async function revoke(id: string) {
    await apiFetch(`/family-groups/${group.id}/invites/${id}`, { method: 'DELETE' }).catch(fail);
    setPending((p) => p?.filter((i) => i.id !== id) ?? null);
  }

  async function toggleMute() {
    try {
      onChange(await apiFetch<FamilyGroupDto>(`/family-groups/${group.id}/me`, { method: 'PATCH', body: JSON.stringify({ muted: !group.muted }) }));
    } catch (err) {
      fail(err);
    }
  }

  async function removeMember(userId: string, name: string, self: boolean) {
    const ok = window.confirm(self ? `¿Salir de "${group.name}"? Vas a dejar de recibir sus avisos.` : `¿Sacar a ${name} del grupo?`);
    if (!ok) return;
    try {
      await apiFetch(`/family-groups/${group.id}/members/${userId}`, { method: 'DELETE' });
      if (self) onGone();
      else onChange({ ...group, members: group.members.filter((m) => m.userId !== userId) });
    } catch (err) {
      fail(err);
    }
  }

  async function testAlert() {
    try {
      const r = await postJson<EmergencyAlertResultDto>(`/family-groups/${group.id}/test-alert`);
      setNotice({
        tone: 'success',
        text:
          r.notified === 0
            ? 'No se mandó ninguna prueba: nadie del grupo tiene el email confirmado todavía.'
            : `Mandamos un aviso de prueba a ${r.notified} ${r.notified === 1 ? 'persona' : 'personas'}. Revisen su email.`,
      });
    } catch (err) {
      fail(err);
    }
  }

  async function copy() {
    if (!invite) return;
    await navigator.clipboard?.writeText(invite.url).catch(() => undefined);
    setCopied(true);
  }

  return (
    <article className={styles.group}>
      <header className={styles.groupHead}>
        <div>
          <h2>{group.name}</h2>
          <p className={styles.meta}>
            {group.members.length} {group.members.length === 1 ? 'miembro' : 'miembros'}
            {group.muted ? ' · avisos silenciados' : ''}
          </p>
        </div>
        <span className={styles.groupIcon} aria-hidden="true">
          <Users size={22} />
        </span>
      </header>

      {notice && <Alert tone={notice.tone}>{notice.text}</Alert>}

      <ul className={styles.members} aria-label={`Miembros de ${group.name}`}>
        {group.members.map((m) => (
          <li key={m.userId}>
            <span className={styles.avatar} aria-hidden="true">
              {initials(m.name)}
            </span>
            <span className={styles.memberName}>
              {m.name}
              <span className={styles.badges}>
                {m.isMe && <span className={styles.badge}>Vos</span>}
                {m.role === 'ADMIN' && <span className={`${styles.badge} ${styles.badgeAdmin}`}>Administra</span>}
              </span>
            </span>
            {admin && !m.isMe && (
              <button type="button" className={styles.iconBtn} onClick={() => removeMember(m.userId, m.name, false)}>
                <UserMinus size={18} aria-hidden="true" />
                <span className={styles.srOnly}>Sacar a {m.name}</span>
              </button>
            )}
          </li>
        ))}
      </ul>

      {group.members.length === 1 && (
        <p className={styles.alone}>
          Todavía sos la única persona del grupo. Mandá el link a quienes querés que se enteren si te pasa algo.
        </p>
      )}

      {admin && (
        <div className={styles.inviteBox}>
          {!invite ? (
            <Button type="button" variant="secondary" onClick={createInvite}>
              Invitar a alguien
            </Button>
          ) : (
            <>
              <p className={styles.inviteHelp}>
                Mandale este link a la persona. Sirve una sola vez y vence en 7 días. Si no tiene cuenta, la crea al abrirlo.
              </p>
              <div className={styles.linkRow}>
                <input className={styles.linkInput} readOnly value={invite.url} aria-label="Link de invitación" onFocus={(e) => e.target.select()} />
                <button type="button" className={styles.copyBtn} onClick={copy}>
                  <Copy size={18} aria-hidden="true" />
                  {copied ? 'Copiado' : 'Copiar'}
                </button>
              </div>
              <a
                className={styles.whatsapp}
                href={`https://wa.me/?text=${encodeURIComponent(waText(group.name, invite.url))}`}
                target="_blank"
                rel="noreferrer"
              >
                <Send size={18} aria-hidden="true" />
                Compartir por WhatsApp
              </a>
              <button type="button" className={styles.linkBtn} onClick={createInvite}>
                Generar otro link
              </button>
            </>
          )}
          {pending && pending.length > 0 && (
            <div className={styles.pending}>
              <p className="label">Invitaciones pendientes</p>
              <ul>
                {pending.map((i) => (
                  <li key={i.id}>
                    Vence el {new Date(i.expiresAt).toLocaleDateString('es-AR')}
                    <button type="button" className={styles.linkBtn} onClick={() => revoke(i.id)}>
                      Cancelar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <footer className={styles.groupActions}>
        {admin && (
          <button type="button" className={styles.action} onClick={testAlert}>
            <BellRing size={18} aria-hidden="true" />
            Probar aviso
          </button>
        )}
        <button type="button" className={styles.action} onClick={toggleMute} aria-pressed={group.muted}>
          <BellOff size={18} aria-hidden="true" />
          {group.muted ? 'Volver a recibir avisos' : 'Silenciar avisos'}
        </button>
        <button type="button" className={`${styles.action} ${styles.danger}`} onClick={() => removeMember(me.userId, me.name, true)}>
          Salir del grupo
        </button>
      </footer>
    </article>
  );
}

export function FamilyGroups({
  initial,
  emailVerified = true,
}: {
  initial: FamilyGroupDto[];
  emailVerified?: boolean;
}) {
  const [groups, setGroups] = useState(initial);
  const [justCreated, setJustCreated] = useState<string | null>(null);
  const replace = (g: FamilyGroupDto) => setGroups((gs) => gs.map((x) => (x.id === g.id ? g : x)));
  const created = (g: FamilyGroupDto) => {
    setGroups((gs) => [...gs, g]);
    setJustCreated(g.id);
  };

  const verifyNotice = !emailVerified && (
    <Alert tone="warning">
      Confirmá tu email para recibir los avisos de emergencia. Te mandamos un link cuando creaste la cuenta; podés pedir otro desde Mis fichas.
    </Alert>
  );

  if (groups.length === 0) {
    return (
      <div className="stack">
        {verifyNotice}
        <div className={styles.emptyLayout}>
          <IntroLead />
          <section className={`${styles.createCard} ${styles.areaCreate}`}>
            <h2>Creá tu grupo</h2>
            <p className={styles.meta}>Después te damos el link para invitar a tu familia.</p>
            <CreateGroup first onCreated={created} />
          </section>
          <FamilyIntro />
          <AlertPreview />
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      {verifyNotice}
      <div className={styles.withGroups}>
        <div className="stack">
          {groups.map((g) => (
            <GroupCard
              key={g.id}
              group={g}
              autoInvite={g.id === justCreated}
              onChange={replace}
              onGone={() => setGroups((gs) => gs.filter((x) => x.id !== g.id))}
            />
          ))}
        </div>
        <aside className={styles.groupsSide} aria-label="Sobre los avisos">
          <section className={styles.howBox}>
            <h2 className={styles.howTitle}>Cómo funciona</h2>
            <FamilyIntro compact />
            <details className={styles.exampleDetails}>
              <summary>Ver un ejemplo del aviso</summary>
              <AlertPreview compact />
            </details>
          </section>
          <details className={styles.more}>
            <summary>Crear otro grupo</summary>
            <p className={styles.meta}>Por ejemplo, uno con tu familia y otro con amigos o compañeros de trabajo.</p>
            <CreateGroup first={false} onCreated={created} />
          </details>
        </aside>
      </div>
    </div>
  );
}
