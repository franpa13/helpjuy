import type { PublicCardDto } from '@helpjuy/contracts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { CallButton, CardPage, CardSection, CardStrip, InactiveNotice, callbar, sec, tiny } from './card-ui';
import { EmergencyActions } from './EmergencyActions';

const SEX: Record<'F' | 'M' | 'X', string> = { F: 'Femenino', M: 'Masculino', X: 'Otro' };

/** "+54 388 412-3456" → "tel:+543884123456" */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Jujuy', day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(iso),
  );

/** Filas de condiciones y medicación: nombre en negrita, detalle a la derecha. */
const rows =
  'grid list-none gap-2 p-0 [&_li]:flex [&_li]:items-baseline [&_li]:justify-between [&_li]:gap-3 [&_li]:text-[19px] [&_li]:font-bold [&_li>span]:text-[15px] [&_li>span]:font-normal [&_li>span]:text-muted-foreground';

function Vital({ label, value, unit, blood = false }: { label: string; value: string | number; unit?: string; blood?: boolean }) {
  return (
    <div className={cn('border-r border-line px-2 pt-2.5 pb-3 last:border-r-0 card:px-8 card:py-3.5', blood && 'bg-red text-white')}>
      <small className={cn(tiny, blood ? 'text-white opacity-90' : 'text-muted-foreground')}>{label}</small>
      <b className="mt-1 block font-head text-4xl/none font-extrabold card:text-[52px]/none">
        {value}
        {unit && <em className="ml-0.5 text-[15px] font-semibold not-italic">{unit}</em>}
      </b>
    </div>
  );
}

function CallButtons({ card, variant, demo = false }: { card: PublicCardDto; variant: 'bar' | 'side'; demo?: boolean }) {
  // En la ficha de ejemplo ningún botón marca: llevan al aviso de arriba.
  const tel = (phone: string) => (demo ? '#demo' : telHref(phone));
  const contact = card.contacts?.[0];
  const side = variant === 'side';
  return (
    <div className={side ? undefined : callbar}>
      <CallButton href={demo ? '#demo' : 'tel:107'} tone="sos" side={side} caption="Emergencias · SAME Jujuy" title="Llamar 107" />
      {contact && (
        <CallButton
          href={tel(contact.phone)}
          tone="fam"
          side={side}
          caption={contact.relation ? `Contacto · ${contact.relation}` : 'Contacto de emergencia'}
          title={side ? contact.name : contact.name.split(' ')[0]}
        >
          <span className="sr-only">Llamar a {contact.name}</span>
        </CallButton>
      )}
      {side &&
        card.contacts?.slice(1).map((c) => (
          <a key={c.phone} className="block border-b border-line px-[22px] py-4 font-bold text-ink" href={tel(c.phone)}>
            <span className={cn(tiny, 'block text-muted-foreground')}>Otro contacto</span>
            {c.name}
            {c.relation ? ` (${c.relation})` : ''}
          </a>
        ))}
    </div>
  );
}

export function EmergencyCard({ card, token, demo = false }: { card: PublicCardDto; token?: string; demo?: boolean }) {
  const meta = [card.identity?.sex ? SEX[card.identity.sex] : null, card.identity?.language ? `Habla ${card.identity.language}` : null]
    .filter(Boolean)
    .join(' · ');
  const hasCare =
    card.care &&
    (card.care.communication || card.care.directives || card.care.transfusion !== 'UNKNOWN' || card.care.organDonor !== 'UNKNOWN');
  const hasMore = card.history || card.insurance || card.doctor || card.notes;
  const SECTION_KEYS = ['identity', 'vitals', 'allergies', 'conditions', 'medications', 'contacts', 'care', 'history', 'insurance', 'doctor', 'notes'] as const;
  const nothingVisible = card.updatedAt !== null && SECTION_KEYS.every((k) => card[k] === undefined);
  const hasMedical =
    !!card.allergies?.items.length ||
    !!card.allergies?.none ||
    !!card.conditions?.items.length ||
    !!card.medications?.items.length ||
    !!card.vitals?.bloodType ||
    !!hasCare ||
    !!hasMore;
  const showConditions = card.conditions && (card.conditions.items.length > 0 || card.conditions.none);
  const showMeds = card.medications && (card.medications.items.length > 0 || card.medications.none);

  return (
    <CardPage>
      <CardStrip logo />
      {demo && (
        <aside
          id="demo"
          role="note"
          aria-label="Ficha de ejemplo"
          className="scroll-mt-4 border-b-3 border-ink bg-amber-tint px-4 py-3 text-[17px] card:px-8"
        >
          <strong>Ficha de ejemplo.</strong> Lucía no existe: así ve tu ficha quien escanea tu QR. Los botones no llaman ni
          avisan a nadie. <a href="/registro" className="font-bold">Hacé la tuya gratis →</a>
        </aside>
      )}

      <div className="flex items-center gap-4 border-b-3 border-ink px-4 pt-[18px] pb-3.5 card:gap-6 card:px-8">
        {card.photoVersion && token && (
          <Avatar className="size-20 shrink-0 rounded-md border-3 border-ink card:size-28">
            <AvatarImage
              src={`/api/public/cards/${token}/photo?v=${card.photoVersion}`}
              alt={`Foto de ${card.firstName} ${card.lastName}`}
              className="rounded-none"
            />
            <AvatarFallback className="rounded-none text-2xl">
              {`${card.firstName[0] ?? ''}${card.lastName[0] ?? ''}`.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
        <div className="min-w-0">
          <h1 className="text-[clamp(38px,10vw,64px)]/[0.92] wrap-anywhere">
            {card.firstName} {card.lastName}
          </h1>
          {meta && <p className="mt-1.5 text-base text-muted-foreground">{meta}</p>}
        </div>
      </div>

      {card.vitals || card.identity?.age !== undefined ? (
        <section className="grid grid-cols-4 border-b-3 border-ink" aria-label="Datos básicos">
          <Vital label="Edad" value={card.identity?.age ?? '—'} />
          <Vital label="Sangre" value={card.vitals?.bloodType ?? '—'} blood />
          <Vital label="Peso" value={card.vitals?.weightKg ?? '—'} unit={card.vitals?.weightKg ? 'kg' : undefined} />
          <Vital label="Altura" value={card.vitals?.heightCm ?? '—'} unit={card.vitals?.heightCm ? 'cm' : undefined} />
        </section>
      ) : null}

      <div className="card:grid card:grid-cols-[1fr_320px] card:items-start">
        <main className="grid card:border-r-3 card:border-ink">
          {(token || demo) && (
            <EmergencyActions
              token={token ?? ''}
              demo={demo}
              firstName={card.firstName}
              lastName={card.lastName}
              contact={card.contacts?.[0] ? { name: card.contacts[0].name.split(' ')[0], phone: card.contacts[0].phone } : undefined}
            />
          )}
          {nothingVisible && (
            <InactiveNotice title="Esta persona eligió no mostrar sus datos médicos">
              <p>Si necesita ayuda, llamá al 107.</p>
            </InactiveNotice>
          )}
          {!nothingVisible && !card.active && !hasMedical && (
            <InactiveNotice title="Esta ficha todavía no tiene datos de emergencia">
              <p>Si la persona necesita ayuda, llamá al 107.</p>
            </InactiveNotice>
          )}
          {!nothingVisible && !card.active && hasMedical && (
            <InactiveNotice title="Sin contacto de emergencia cargado">
              <p>Si la persona necesita ayuda, llamá al 107.</p>
            </InactiveNotice>
          )}

          {card.allergies && (card.allergies.items.length > 0 || card.allergies.none) && (
            <CardSection tone="red" title="Alergias" aria-label="Alergias">
              {card.allergies.none ? (
                <p className="font-head text-[32px]/none font-extrabold text-red uppercase">Sin alergias conocidas</p>
              ) : (
                <ul className="grid list-none gap-1.5 p-0">
                  {card.allergies.items.map((a) => (
                    <li
                      key={a.substance}
                      className="flex items-baseline justify-between gap-3 border-b border-dashed border-[#e4b3bc] pb-1.5 last:border-0 last:pb-0"
                    >
                      <b className="font-head text-[32px]/none font-extrabold text-red uppercase">{a.substance}</b>
                      {a.reaction && <span className="text-[15px] font-bold">{a.reaction}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </CardSection>
          )}

          <div className="card:grid card:grid-cols-2">
            {showConditions && (
              <CardSection
                tone="amber"
                title="Condiciones"
                aria-label="Condiciones"
                className={cn(showMeds && 'card:border-r card:border-r-line')}
              >
                {card.conditions!.none ? (
                  <p className="text-lg font-bold">Ninguna conocida</p>
                ) : (
                  <ul className={rows}>
                    {card.conditions!.items.map((c) => (
                      <li key={c.name}>
                        {c.name} {c.note && <span>{c.note}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardSection>
            )}
            {showMeds && (
              <CardSection tone="blue" title="Medicación" aria-label="Medicación">
                {card.medications!.none ? (
                  <p className="text-lg font-bold">No toma medicación habitual</p>
                ) : (
                  <ul className={rows}>
                    {card.medications!.items.map((m) => (
                      <li key={m.name}>
                        <div>
                          {m.name}
                          {m.anticoagulant && (
                            <span className="ml-2 inline-block bg-ink px-1.5 py-[3px] align-[3px] font-head text-xs font-bold tracking-widest text-white">
                              ANTICOAG.
                            </span>
                          )}
                        </div>
                        {m.dose && <span>{m.dose}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardSection>
            )}
          </div>

          {hasCare && card.care && (
            <CardSection title="Para tener en cuenta" aria-label="Para tener en cuenta">
              <ul className="grid list-none gap-2.5 p-0 [&_li]:border-l-3 [&_li]:border-ink [&_li]:pl-3.5 [&_li]:text-[17px] [&_li]:font-bold [&_li>span]:block [&_li>span]:text-sm [&_li>span]:font-normal [&_li>span]:text-muted-foreground">
                {card.care.transfusion === 'REFUSES' && (
                  <li className="border-red! text-red">
                    NO acepta transfusiones de sangre<span>Decisión de la persona</span>
                  </li>
                )}
                {card.care.communication && (
                  <li>
                    {card.care.communication}
                    <span>Cómo comunicarse</span>
                  </li>
                )}
                {card.care.transfusion === 'ACCEPTS' && (
                  <li>
                    Acepta transfusiones<span>Sin restricciones</span>
                  </li>
                )}
                {card.care.organDonor === 'YES' && <li>Donante de órganos</li>}
                {card.care.organDonor === 'NO' && <li>No es donante de órganos</li>}
                {card.care.directives && (
                  <li>
                    {card.care.directives}
                    <span>Voluntades anticipadas</span>
                  </li>
                )}
              </ul>
            </CardSection>
          )}

          {hasMore && (
            <Collapsible className={cn(sec, 'group/more')}>
              <CollapsibleTrigger className="flex w-full cursor-pointer justify-between font-head text-base font-extrabold tracking-[0.14em] uppercase after:text-muted-foreground after:content-['Ver_+'] group-data-[state=open]/more:after:content-['Cerrar']">
                Más información
              </CollapsibleTrigger>
              <CollapsibleContent>
              <dl
                className={cn(
                  'mt-3.5 grid grid-cols-1 gap-3 text-base min-[480px]:grid-cols-2 [&_dd]:m-0 [&_dt]:mb-0.5 [&_dt]:text-muted-foreground',
                  `[&_dt]:font-head [&_dt]:text-xs [&_dt]:font-bold [&_dt]:tracking-[0.12em] [&_dt]:uppercase`,
                )}
              >
                {card.history?.surgeries && (
                  <div>
                    <dt>Cirugías</dt>
                    <dd>{card.history.surgeries}</dd>
                  </div>
                )}
                {card.history?.implants && (
                  <div>
                    <dt>Implantes o prótesis</dt>
                    <dd>{card.history.implants}</dd>
                  </div>
                )}
                {card.insurance && (
                  <div>
                    <dt>Obra social</dt>
                    <dd>
                      {card.insurance.name}
                      {card.insurance.number ? ` · ${card.insurance.number}` : ''}
                    </dd>
                  </div>
                )}
                {card.doctor && (
                  <div>
                    <dt>Médico de cabecera</dt>
                    <dd>
                      {card.doctor.name}
                      {card.doctor.phone && (
                        <>
                          {' · '}
                          <a href={demo ? '#demo' : telHref(card.doctor.phone)}>{card.doctor.phone}</a>
                        </>
                      )}
                    </dd>
                  </div>
                )}
                {card.notes && (
                  <div>
                    <dt>Notas</dt>
                    <dd>{card.notes}</dd>
                  </div>
                )}
              </dl>
              </CollapsibleContent>
            </Collapsible>
          )}
        </main>

        <aside className="hidden card:sticky card:top-0 card:block">
          <CallButtons card={card} variant="side" demo={demo} />
        </aside>
      </div>

      <p className="px-4 pt-3.5 pb-[130px] text-sm text-muted-foreground card:px-8 card:pt-4 card:pb-8">
        Datos cargados por el titular, <strong>no verificados por un médico</strong>.
        {card.updatedAt && <> Actualizado el {formatDate(card.updatedAt)}.</>}
      </p>

      <nav className="fixed inset-x-0 bottom-0 z-10 card:hidden" aria-label="Llamadas">
        <CallButtons card={card} variant="bar" demo={demo} />
      </nav>
    </CardPage>
  );
}
