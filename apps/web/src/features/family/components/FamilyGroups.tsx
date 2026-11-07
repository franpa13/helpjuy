'use client';

import type { CreatedInviteDto, EmergencyAlertResultDto, FamilyGroupDto, FamilyInviteDto } from '@helpjuy/contracts';
import { BellOff, BellRing, ChevronDown, Copy, Send, UserMinus, Users } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError, apiFetch, postJson } from '@/shared/api/client';
import { Alert } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Field } from '@/shared/ui/Field';
import { AlertPreview, FamilyIntro, IntroLead } from './FamilyIntro';
import { Badge } from '@/components/ui/badge';
import { Card, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Pide confirmación antes de algo que no se deshace (reemplaza al confirm() del navegador). */
function ConfirmAction({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel size="inline">Cancelar</AlertDialogCancel>
          <AlertDialogAction size="inline" onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Pliegue con el título como botón y una flecha que gira al abrir. */
function Fold({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <Collapsible className={cn('group/fold', className)}>
      <CollapsibleTrigger className="flex w-full cursor-pointer items-center justify-between gap-2 text-left font-bold">
        {title}
        <ChevronDown aria-hidden="true" size={20} className="shrink-0 transition-transform group-data-[state=open]/fold:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2.5">{children}</CollapsibleContent>
    </Collapsible>
  );
}
const meta = 'mt-1 text-[15px] text-muted-foreground';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

const waText = (groupName: string, url: string) =>
  `Te invito a "${groupName}" en HelpJuy. Si alguien escanea el QR de emergencia de uno de nosotros y marca que pasó algo, te llega un aviso. No ves datos médicos de nadie. Unite acá: ${url}`;

function CreateGroup({
  onCreated,
  first,
  stacked = false,
}: {
  onCreated: (g: FamilyGroupDto) => void;
  first: boolean;
  /** En una columna angosta, el botón va abajo del campo. */
  stacked?: boolean;
}) {
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
    <form className={cn('grid gap-2.5', !stacked && 'sm:grid-cols-[1fr_auto] sm:items-end')} onSubmit={submit} noValidate>
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

  async function removeMember(userId: string, self: boolean) {
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
    <Card asChild rule="thin" className="grid gap-3.5 p-[18px]">
      <article>
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[30px]">{group.name}</h2>
          <p className={meta}>
            {group.members.length} {group.members.length === 1 ? 'miembro' : 'miembros'}
            {group.muted ? ' · avisos silenciados' : ''}
          </p>
        </div>
        <span className="grid size-11 place-items-center rounded-md bg-night text-white" aria-hidden="true">
          <Users size={22} />
        </span>
      </header>

      {notice && <Alert variant={notice.tone}>{notice.text}</Alert>}

      <ul className="grid list-none border-t border-line p-0" aria-label={`Miembros de ${group.name}`}>
        {group.members.map((m) => (
          <li key={m.userId} className="flex items-center gap-3 border-b border-line py-2.5">
            <Avatar className="size-10" aria-hidden="true">
              <AvatarFallback>{initials(m.name)}</AvatarFallback>
            </Avatar>
            <span className="flex flex-1 flex-wrap items-center gap-x-2.5 gap-y-1 font-bold">
              {m.name}
              <span className="inline-flex gap-1.5">
                {m.isMe && (
                  <Badge variant="outline" className="rounded-full bg-paper normal-case tracking-normal">
                    Vos
                  </Badge>
                )}
                {m.role === 'ADMIN' && (
                  <Badge variant="blue" className="rounded-full border border-blue normal-case tracking-normal">
                    Administra
                  </Badge>
                )}
              </span>
            </span>
            {admin && !m.isMe && (
              <Tooltip>
              <ConfirmAction
                title={`¿Sacar a ${m.name}?`}
                description={`Deja de recibir los avisos de "${group.name}". Lo podés volver a invitar cuando quieras.`}
                confirmLabel="Sí, sacar"
                onConfirm={() => removeMember(m.userId, false)}
                trigger={
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="soft"
                      size="icon"
                      className="size-10 bg-transparent text-muted-foreground hover:border-red hover:text-red"
                      aria-label={`Sacar a ${m.name}`}
                    >
                      <UserMinus size={18} aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                }
              />
              <TooltipContent>Sacar del grupo</TooltipContent>
              </Tooltip>
            )}
          </li>
        ))}
      </ul>

      {group.members.length === 1 && (
        <p className="border-l-6 border-amber bg-amber-tint px-3.5 py-2.5 font-bold">
          Todavía sos la única persona del grupo. Mandá el link a quienes querés que se enteren si te pasa algo.
        </p>
      )}

      {admin && (
        <div className="grid gap-2.5">
          {!invite ? (
            <Button type="button" variant="outline" onClick={createInvite}>
              Invitar a alguien
            </Button>
          ) : (
            <>
              <p className="text-[15px] text-muted-foreground">
                Mandale este link a la persona. Sirve una sola vez y vence en 7 días. Si no tiene cuenta, la crea al abrirlo.
              </p>
              <div className="flex gap-2">
                <Input className="min-h-12 flex-1 bg-paper px-3 py-2.5 text-sm" readOnly value={invite.url} aria-label="Link de invitación" onFocus={(e) => e.target.select()} />
                <Button type="button" variant="outline" size="compact" className="min-h-12 bg-white" onClick={copy}>
                  <Copy size={18} aria-hidden="true" />
                  {copied ? 'Copiado' : 'Copiar'}
                </Button>
              </div>
              <a
                className={cn(buttonVariants({ size: 'compact' }), 'min-h-13 border-[#1d8a4a] bg-[#1d8a4a] text-[17px]')}
                href={`https://wa.me/?text=${encodeURIComponent(waText(group.name, invite.url))}`}
                target="_blank"
                rel="noreferrer"
              >
                <Send size={18} aria-hidden="true" />
                Compartir por WhatsApp
              </a>
              <Button type="button" variant="link" className="justify-self-start py-1" onClick={createInvite}>
                Generar otro link
              </Button>
            </>
          )}
          {pending && pending.length > 0 && (
            <div>
              <p className="label">Invitaciones pendientes</p>
              <ul className="mt-1.5 grid list-none gap-1.5 p-0">
                {pending.map((i) => (
                  <li key={i.id} className="flex items-center justify-between text-[15px]">
                    Vence el {new Date(i.expiresAt).toLocaleDateString('es-AR')}
                    <Button type="button" variant="link" className="py-1" onClick={() => revoke(i.id)}>
                      Cancelar
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <footer className="flex flex-wrap gap-2 border-t border-line pt-3">
        {admin && (
          <Button type="button" variant="soft" size="compact" onClick={testAlert}>
            <BellRing size={18} aria-hidden="true" />
            Probar aviso
          </Button>
        )}
        <Button type="button" variant="soft" size="compact" onClick={toggleMute} aria-pressed={group.muted}>
          <BellOff size={18} aria-hidden="true" />
          {group.muted ? 'Volver a recibir avisos' : 'Silenciar avisos'}
        </Button>
        <ConfirmAction
          title={`¿Salir de "${group.name}"?`}
          description="Vas a dejar de recibir sus avisos de emergencia. Para volver, te tienen que invitar de nuevo."
          confirmLabel="Sí, salir"
          onConfirm={() => removeMember(me.userId, true)}
          trigger={
            <Button type="button" variant="soft" size="compact" className="text-red hover:border-red">
              Salir del grupo
            </Button>
          }
        />
      </footer>
      </article>
    </Card>
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
    <Alert variant="warning">
      Confirmá tu email para recibir los avisos de emergencia. Te mandamos un link cuando creaste la cuenta; podés pedir otro desde Mis fichas.
    </Alert>
  );

  if (groups.length === 0) {
    return (
      <div className="stack">
        {verifyNotice}
        <div className="grid gap-6 [grid-template-areas:'lead'_'create'_'steps'_'preview'] min-[1000px]:grid-cols-[1.1fr_1fr] min-[1000px]:grid-rows-[auto_auto_1fr] min-[1000px]:items-start min-[1000px]:gap-x-10 min-[1000px]:[grid-template-areas:'lead_create'_'steps_create'_'steps_preview']">
          <IntroLead className="[grid-area:lead]" />
          <Card rule="red" className="grid gap-2 p-5 [grid-area:create]">
            <h2 className="text-[30px]">Creá tu grupo</h2>
            <p className={meta}>Después te damos el link para invitar a tu familia.</p>
            <div className="mt-2">
              <CreateGroup first stacked onCreated={created} />
            </div>
          </Card>
          <FamilyIntro className="[grid-area:steps]" />
          <AlertPreview className="[grid-area:preview]" />
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      {verifyNotice}
      <div className="grid gap-5 wide:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)] wide:items-start wide:gap-7">
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
        <aside className="grid gap-4 wide:sticky wide:top-6" aria-label="Sobre los avisos">
          <Card className="p-[18px]">
            <CardTitle>Cómo funciona</CardTitle>
            <FamilyIntro compact />
            <Fold title="Ver un ejemplo del aviso" className="mt-3.5 border-t border-line pt-3">
              <AlertPreview compact />
            </Fold>
          </Card>
          <Fold title="Crear otro grupo" className="border border-line bg-white px-4 py-3.5">
            <p className={meta}>Por ejemplo, uno con tu familia y otro con amigos o compañeros de trabajo.</p>
            <div className="mt-2.5">
              <CreateGroup first={false} stacked onCreated={created} />
            </div>
          </Fold>
        </aside>
      </div>
    </div>
  );
}
