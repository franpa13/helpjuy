import type { PublicCardDto } from '@helpjuy/contracts';
import { LogoSymbol } from '@/shared/brand/Logo';
import styles from './emergency-card.module.css';

const SEX: Record<'F' | 'M' | 'X', string> = { F: 'Femenino', M: 'Masculino', X: 'Otro' };

/** "+54 388 412-3456" → "tel:+543884123456" */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Jujuy', day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(iso),
  );

function CallButtons({ card, variant }: { card: PublicCardDto; variant: 'bar' | 'side' }) {
  const contact = card.contacts?.[0];
  return (
    <div className={variant === 'bar' ? styles.callbar : styles.side}>
      <a className={`${styles.btn} ${styles.sos}`} href="tel:107">
        <small>Emergencias · SAME Jujuy</small>
        <b>Llamar 107</b>
      </a>
      {contact && (
        <a className={`${styles.btn} ${styles.fam}`} href={telHref(contact.phone)}>
          <small>{contact.relation ? `Contacto · ${contact.relation}` : 'Contacto de emergencia'}</small>
          <b>{variant === 'bar' ? contact.name.split(' ')[0] : contact.name}</b>
          <span className={styles.srOnly}>Llamar a {contact.name}</span>
        </a>
      )}
      {variant === 'side' &&
        card.contacts?.slice(1).map((c) => (
          <a key={c.phone} className={styles.extra} href={telHref(c.phone)}>
            <span className={styles.label}>Otro contacto</span>
            {c.name}
            {c.relation ? ` (${c.relation})` : ''}
          </a>
        ))}
    </div>
  );
}

export function EmergencyCard({ card }: { card: PublicCardDto }) {
  const meta = [card.identity?.sex ? SEX[card.identity.sex] : null, card.identity?.language ? `Habla ${card.identity.language}` : null]
    .filter(Boolean)
    .join(' · ');
  const hasCare =
    card.care &&
    (card.care.communication || card.care.directives || card.care.transfusion !== 'UNKNOWN' || card.care.organDonor !== 'UNKNOWN');
  const hasMore = card.history || card.insurance || card.doctor || card.notes;
  const hasMedical =
    !!card.allergies?.items.length ||
    !!card.allergies?.none ||
    !!card.conditions?.items.length ||
    !!card.medications?.items.length ||
    !!card.vitals?.bloodType ||
    !!hasCare ||
    !!hasMore;

  return (
    <div className={styles.page}>
      <header className={styles.strip}>
        <span className={styles.stripTitle}>
          <LogoSymbol size={18} crossColor="currentColor" />
          <span>Ficha de emergencia</span>
        </span>
        <span>Jujuy</span>
      </header>

      <div className={styles.id}>
        <h1 className={styles.name}>
          {card.firstName} {card.lastName}
        </h1>
        {meta && <p className={styles.meta}>{meta}</p>}
      </div>

      {card.vitals || card.identity?.age !== undefined ? (
        <section className={styles.vitals} aria-label="Datos básicos">
          <div className={styles.vital}>
            <small>Edad</small>
            <b>{card.identity?.age ?? '—'}</b>
          </div>
          <div className={`${styles.vital} ${styles.blood}`}>
            <small>Sangre</small>
            <b>{card.vitals?.bloodType ?? '—'}</b>
          </div>
          <div className={styles.vital}>
            <small>Peso</small>
            <b>
              {card.vitals?.weightKg ?? '—'}
              {card.vitals?.weightKg ? <em>kg</em> : null}
            </b>
          </div>
          <div className={styles.vital}>
            <small>Altura</small>
            <b>
              {card.vitals?.heightCm ?? '—'}
              {card.vitals?.heightCm ? <em>cm</em> : null}
            </b>
          </div>
        </section>
      ) : null}

      <div className={styles.layout}>
        <main className={styles.content}>
          {!card.active && !hasMedical && (
            <section className={`${styles.sec} ${styles.inactive}`}>
              <h2>Esta ficha todavía no tiene datos de emergencia</h2>
              <p>Si la persona necesita ayuda, llamá al 107.</p>
            </section>
          )}
          {!card.active && hasMedical && (
            <section className={`${styles.sec} ${styles.inactive}`}>
              <h2>Sin contacto de emergencia cargado</h2>
              <p>Si la persona necesita ayuda, llamá al 107.</p>
            </section>
          )}

          {card.allergies && (card.allergies.items.length > 0 || card.allergies.none) && (
            <section className={`${styles.sec} ${styles.alert}`} aria-label="Alergias">
              <h2>Alergias</h2>
              {card.allergies.none ? (
                <p className={styles.none}>Sin alergias conocidas</p>
              ) : (
                <ul className={styles.alg}>
                  {card.allergies.items.map((a) => (
                    <li key={a.substance}>
                      <b>{a.substance}</b>
                      {a.reaction && <span>{a.reaction}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <div className={styles.two}>
            {card.conditions && (card.conditions.items.length > 0 || card.conditions.none) && (
              <section className={`${styles.sec} ${styles.cond}`} aria-label="Condiciones">
                <h2>Condiciones</h2>
                {card.conditions.none ? (
                  <p className={styles.noneSmall}>Ninguna conocida</p>
                ) : (
                  <ul className={styles.rows}>
                    {card.conditions.items.map((c) => (
                      <li key={c.name}>
                        {c.name} {c.note && <span>{c.note}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
            {card.medications && (card.medications.items.length > 0 || card.medications.none) && (
              <section className={`${styles.sec} ${styles.meds}`} aria-label="Medicación">
                <h2>Medicación</h2>
                {card.medications.none ? (
                  <p className={styles.noneSmall}>No toma medicación habitual</p>
                ) : (
                  <ul className={styles.rows}>
                    {card.medications.items.map((m) => (
                      <li key={m.name}>
                        <div>
                          {m.name}
                          {m.anticoagulant && <span className={styles.flag}>ANTICOAG.</span>}
                        </div>
                        {m.dose && <span>{m.dose}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>

          {hasCare && card.care && (
            <section className={styles.sec} aria-label="Para tener en cuenta">
              <h2>Para tener en cuenta</h2>
              <ul className={styles.notes}>
                {card.care.transfusion === 'REFUSES' && (
                  <li className={styles.critical}>
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
            </section>
          )}

          {hasMore && (
            <details className={styles.sec}>
              <summary>Más información</summary>
              <dl className={styles.kv}>
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
                          <a href={telHref(card.doctor.phone)}>{card.doctor.phone}</a>
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
            </details>
          )}
        </main>

        <aside className={styles.aside}>
          <CallButtons card={card} variant="side" />
        </aside>
      </div>

      <p className={styles.foot}>
        Datos cargados por el titular, <strong>no verificados por un médico</strong>.
        {card.updatedAt && <> Actualizado el {formatDate(card.updatedAt)}.</>}
      </p>

      <nav className={styles.barWrap} aria-label="Llamadas">
        <CallButtons card={card} variant="bar" />
      </nav>
    </div>
  );
}
