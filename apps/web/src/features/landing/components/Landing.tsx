import Link from 'next/link';
import { HeroVisual } from './HeroVisual';
import styles from './landing.module.css';

const STEPS = [
  {
    title: 'Cargá tus datos',
    text: 'Alergias, enfermedades, remedios, grupo sanguíneo y a quién llamar. Todo es opcional: completás lo que quieras, cuando quieras.',
  },
  {
    title: 'Imprimí tu QR',
    text: 'Te armamos la tarjeta para la billetera y el sticker para el casco. Lo imprimís en tu casa o en cualquier fotocopiadora.',
  },
  {
    title: 'Si pasa algo, lo escanean',
    text: 'Con la cámara del celular, sin app ni contraseña. Ven tu ficha al instante y pueden llamar al 107 o a tu familia con un toque.',
  },
];

const DATA = [
  { name: 'Alergias', why: 'Evita que te den un remedio que te hace mal, como la penicilina o el ibuprofeno.' },
  { name: 'Medicación', why: 'Si tomás anticoagulantes, un golpe en la cabeza se trata de otra manera.' },
  { name: 'Enfermedades', why: 'Diabetes, epilepsia o problemas del corazón cambian lo primero que revisan.' },
  { name: 'Grupo sanguíneo', why: 'Ayuda a preparar una transfusión si hace falta.' },
  { name: 'Edad y peso', why: 'Con eso calculan las dosis, sobre todo en chicos y adultos mayores.' },
  { name: 'Contactos', why: 'Le avisan a tu familia en seguida, aunque no tengas el celular a mano.' },
];

const PLACES = [
  { name: 'Billetera', text: 'Una tarjeta del tamaño de una de crédito. Es lo primero que se revisa para identificarte.' },
  { name: 'Casco', text: 'Un sticker con tus datos más importantes impresos, por si no hay señal en la ruta.' },
  { name: 'Moto, auto o bici', text: 'En el tablero, el parabrisas o el cuadro. Sirve también si sos peatón y la llevás encima.' },
  { name: 'Heladera', text: 'Para adultos mayores en casa: los equipos de emergencia saben buscar ahí.' },
];

const PRIVACY = [
  { title: 'Todo es opcional', text: 'Ningún dato es obligatorio. Cargás solo lo que te parezca útil.' },
  { title: 'Vos elegís qué se ve', text: 'Cada dato se puede mostrar en el QR o dejar privado. Antes de imprimir ves exactamente lo que va a ver el paramédico.' },
  { title: 'Sabés cuándo lo escanean', text: 'Cada escaneo queda registrado y te avisamos por email.' },
  { title: 'Borrás todo cuando quieras', text: 'Descargás tus datos o eliminás la cuenta con un clic. Si perdés el casco, generás un QR nuevo y el viejo deja de funcionar.' },
  { title: 'Cumple la ley', text: 'Los datos de salud son datos sensibles según la Ley 25.326. Te pedimos consentimiento claro y se guardan en servidores de la Unión Europea.' },
];

const FAQ = [
  {
    q: '¿Cuánto cuesta?',
    a: 'Nada. HelpJuy es gratis y no tiene publicidad. Solo pagás la impresión del sticker o la tarjeta, si no tenés impresora.',
  },
  {
    q: '¿Cualquiera puede ver mis datos?',
    a: 'Quien escanea tu QR ve solo lo que vos marcaste como público. Nunca se muestra tu dirección, tu DNI ni tu email. La página no aparece en Google.',
  },
  {
    q: '¿Y si no hay señal donde pasa el accidente?',
    a: 'El sticker y la tarjeta llevan impresos tus datos más importantes: alergias, grupo sanguíneo y un teléfono. Se pueden leer sin internet.',
  },
  {
    q: '¿Puedo hacer la ficha de mis hijos o de mis padres?',
    a: 'Sí. Desde una misma cuenta podés tener varias fichas, cada una con su propio QR. Para menores, declarás que sos su madre, padre o tutor.',
  },
  {
    q: '¿Reemplaza a mi médico o a mi historia clínica?',
    a: 'No. Es una ayuda para los primeros minutos de una emergencia. Los datos los cargás vos y no los revisa un médico.',
  },
  {
    q: '¿Qué pasa si cambio de medicación?',
    a: 'La actualizás en la web y la ficha cambia al instante; el QR sigue siendo el mismo. Solo tenés que reimprimir si cambia algo de lo que va impreso, y te avisamos.',
  },
];

export function Landing() {
  return (
    <>
      <header className={styles.nav}>
        <Link href="/" className={styles.brand}>
          <i className="cross" aria-hidden="true" />
          HelpJuy
        </Link>
        <nav className={styles.navLinks} aria-label="Cuenta">
          <Link href="/ingresar">Ingresar</Link>
          <Link href="/registro" className={styles.navCta}>
            Crear mi ficha
          </Link>
        </nav>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>Si no podés hablar, tu ficha habla por vos</h1>
              <p className={styles.heroLead}>
                Cargá tus alergias, tu medicación y a quién llamar. Imprimí tu QR y llevalo en la billetera o en el casco.
                Si tenés un accidente, el paramédico lo escanea y sabe cómo ayudarte.
              </p>
              <div className={styles.heroCtas}>
                <Link href="/registro" className={styles.ctaPrimary}>
                  Crear mi ficha gratis
                </Link>
                <Link href="/ingresar" className={styles.ctaGhost}>
                  Ya tengo cuenta
                </Link>
              </div>
              <p className={styles.heroNote}>Es gratis, no hay que instalar nada y lo empezás en menos de 3 minutos.</p>
            </div>
            <HeroVisual />
          </div>
        </section>

        <section className={styles.section} aria-labelledby="como-funciona">
          <h2 id="como-funciona" className={styles.h2}>
            Cómo funciona
          </h2>
          <ol className={styles.steps}>
            {STEPS.map((s, i) => (
              <li key={s.title} className={styles.step}>
                <span className={styles.stepNum} aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className={styles.h3}>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={`${styles.section} ${styles.sectionPaper}`} aria-labelledby="que-ve">
          <div className={styles.split}>
            <div>
              <h2 id="que-ve" className={styles.h2}>
                Lo que ve el paramédico en los primeros segundos
              </h2>
              <p className={styles.sectionLead}>
                Cuando alguien está inconsciente, el equipo de emergencia no puede preguntarle nada. Tu ficha contesta por vos, en el
                orden en que lo necesitan.
              </p>
            </div>
            <dl className={styles.dataList}>
              {DATA.map((d) => (
                <div key={d.name} className={styles.dataRow}>
                  <dt>{d.name}</dt>
                  <dd>{d.why}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="donde">
          <h2 id="donde" className={styles.h2}>
            Llevalo donde estés
          </h2>
          <p className={styles.sectionLead}>No hace falta tener auto ni moto. Un accidente le puede pasar a cualquiera, también caminando.</p>
          <ul className={styles.places}>
            {PLACES.map((p) => (
              <li key={p.name}>
                <h3 className={styles.h3}>{p.name}</h3>
                <p>{p.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.privacy} aria-labelledby="privacidad">
          <div className={styles.privacyInner}>
            <h2 id="privacidad" className={styles.h2}>
              Tus datos son tuyos
            </h2>
            <ul className={styles.privacyList}>
              {PRIVACY.map((p) => (
                <li key={p.title}>
                  <h3 className={styles.h3}>{p.title}</h3>
                  <p>{p.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="preguntas">
          <h2 id="preguntas" className={styles.h2}>
            Preguntas frecuentes
          </h2>
          <div className={styles.faq}>
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className={styles.final}>
          <h2 className={styles.finalTitle}>Hacé tu ficha hoy. Ojalá nunca la necesites.</h2>
          <Link href="/registro" className={styles.ctaPrimary}>
            Crear mi ficha gratis
          </Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <p className={styles.footerSos}>
          En una emergencia llamá al <a href="tel:107">107</a> (SAME Jujuy).
        </p>
        <p>
          HelpJuy no reemplaza la atención médica. Los datos los carga cada persona y no los verifica un médico.
        </p>
        <p>Hecho en Jujuy, Argentina.</p>
      </footer>
    </>
  );
}
