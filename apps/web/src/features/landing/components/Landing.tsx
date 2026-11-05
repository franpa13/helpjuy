import {
  BellRing,
  ClipboardPen,
  Droplet,
  Eye,
  Gift,
  HeartPulse,
  KeyRound,
  CarFront,
  Landmark,
  ListChecks,
  Motorbike,
  PhoneCall,
  Pill,
  Printer,
  Refrigerator,
  Scale,
  ScanQrCode,
  ShieldCheck,
  Smartphone,
  Trash,
  TriangleExclamationPoint,
  WalletCards,
  WifiOff,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/shared/brand/Logo';
import { Reveal, StaggerItem, StaggerList } from '@/shared/motion/Reveal';
import { Faq } from './Faq';
import { HeroText } from './HeroText';
import { HeroVisual } from './HeroVisual';
import { StepNumber } from './StepNumber';
import styles from './landing.module.css';

const STEPS = [
  {
    icon: ClipboardPen,
    title: 'Cargá tus datos',
    text: 'Alergias, enfermedades, remedios, grupo sanguíneo y a quién llamar. Todo es opcional: completás lo que quieras, cuando quieras.',
  },
  {
    icon: Printer,
    title: 'Imprimí tu QR',
    text: 'Te armamos la tarjeta para la billetera y el sticker para el casco. Lo imprimís en tu casa o en cualquier fotocopiadora.',
  },
  {
    icon: ScanQrCode,
    title: 'Si pasa algo, lo escanean',
    text: 'Con la cámara del celular, sin app ni contraseña. Ven tu ficha al instante y pueden llamar al 107 o a tu familia con un toque.',
  },
];

const DATA = [
  { icon: TriangleExclamationPoint, name: 'Alergias', why: 'Evita que te den un remedio que te hace mal, como la penicilina o el ibuprofeno.' },
  { icon: Pill, name: 'Medicación', why: 'Si tomás anticoagulantes, un golpe en la cabeza se trata de otra manera.' },
  { icon: HeartPulse, name: 'Enfermedades', why: 'Diabetes, epilepsia o problemas del corazón cambian lo primero que revisan.' },
  { icon: Droplet, name: 'Grupo sanguíneo', why: 'Ayuda a preparar una transfusión si hace falta.' },
  { icon: Scale, name: 'Edad y peso', why: 'Con eso calculan las dosis, sobre todo en chicos y adultos mayores.' },
  { icon: PhoneCall, name: 'Contactos', why: 'Le avisan a tu familia en seguida, aunque no tengas el celular a mano.' },
];

const PLACES = [
  {
    icon: WalletCards,
    name: 'Billetera',
    text: 'Una tarjeta del tamaño de una de crédito, al lado del DNI. Es lo primero que se revisa para identificarte.',
  },
  {
    icon: Smartphone,
    name: 'Celular',
    text: 'Un sticker atrás, debajo de la funda. Es lo que casi todos llevamos siempre encima.',
  },
  {
    icon: KeyRound,
    name: 'Llavero',
    text: 'Una tarjetita plastificada colgada de las llaves, para salir sin pensar en nada más.',
  },
  {
    icon: Motorbike,
    name: 'Moto y casco',
    text: 'Un sticker en el casco y otro en la moto, con tus datos clave impresos por si no hay señal en la ruta.',
  },
  {
    icon: CarFront,
    name: 'Auto',
    text: 'En el parasol o la guantera del lado del conductor, donde un rescatista mira primero.',
  },
  {
    icon: Refrigerator,
    name: 'Heladera',
    text: 'Para adultos mayores en casa: los equipos de emergencia saben buscar ahí.',
  },
];

const PRIVACY = [
  { icon: ListChecks, title: 'Todo es opcional', text: 'Ningún dato es obligatorio. Cargás solo lo que te parezca útil.' },
  {
    icon: Eye,
    title: 'Vos elegís qué se ve',
    text: 'Cada dato se puede mostrar en el QR o dejar privado. Antes de imprimir ves exactamente lo que va a ver el paramédico.',
  },
  { icon: BellRing, title: 'Sabés cuándo lo escanean', text: 'Cada escaneo queda registrado y te avisamos por email.' },
  {
    icon: Trash,
    title: 'Borrás todo cuando quieras',
    text: 'Descargás tus datos o eliminás la cuenta con un clic. Si perdés el casco, generás un QR nuevo y el viejo deja de funcionar.',
  },
  {
    icon: Landmark,
    title: 'Cumple la ley',
    text: 'Los datos de salud son datos sensibles según la Ley 25.326. Te pedimos consentimiento claro y se guardan en servidores de la Unión Europea.',
  },
];

const FACTS: Array<{ icon: LucideIcon; text: string }> = [
  { icon: Gift, text: 'Gratis, sin publicidad' },
  { icon: Smartphone, text: 'Sin instalar nada: se abre con la cámara' },
  { icon: WifiOff, text: 'Lo impreso sirve aunque no haya señal' },
  { icon: ShieldCheck, text: 'Cumple la Ley 25.326 de datos personales' },
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
        <Link href="/" className={styles.brand} aria-label="HelpJuy, inicio">
          <Logo size={32} crossColor="var(--red-bright)" />
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
            <HeroText />
            <HeroVisual />
          </div>
        </section>

        <section className={styles.facts} aria-label="En pocas palabras">
          <StaggerList as="ul" className={styles.factsList}>
            {FACTS.map(({ icon: Icon, text }) => (
              <StaggerItem as="li" key={text} className={styles.fact}>
                <Icon className={styles.factIcon} aria-hidden="true" strokeWidth={2.2} />
                <span>{text}</span>
              </StaggerItem>
            ))}
          </StaggerList>
        </section>

        <section className={styles.section} aria-labelledby="como-funciona">
          <Reveal>
            <h2 id="como-funciona" className={styles.h2}>
              Cómo funciona
            </h2>
          </Reveal>
          <ol className={styles.steps}>
            {STEPS.map((s, i) => (
              <li key={s.title} className={styles.step}>
                <div className={styles.stepHead}>
                  <StepNumber n={i + 1} />
                  <span className={styles.iconTileRed}>
                    <s.icon aria-hidden="true" strokeWidth={2.2} />
                  </span>
                </div>
                <Reveal delay={0.1 + i * 0.12} y={16}>
                  <h3 className={styles.h3}>{s.title}</h3>
                  <p>{s.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        <section className={`${styles.section} ${styles.sectionPaper}`} aria-labelledby="que-ve">
          <div className={styles.split}>
            <Reveal>
              <h2 id="que-ve" className={styles.h2}>
                Lo que ve el paramédico en los primeros segundos
              </h2>
              <p className={styles.sectionLead}>
                Cuando alguien está inconsciente, el equipo de emergencia no puede preguntarle nada. Tu ficha contesta por
                vos, en el orden en que lo necesitan.
              </p>
            </Reveal>
            <StaggerList as="dl" className={styles.dataList}>
              {DATA.map((d, i) => (
                <StaggerItem key={d.name} className={styles.dataRow} from={{ x: 24 }}>
                  <dt>
                    <span className={i === 0 ? styles.iconTileRed : styles.iconTileLine}>
                      <d.icon aria-hidden="true" strokeWidth={2.2} />
                    </span>
                    {d.name}
                  </dt>
                  <dd>{d.why}</dd>
                </StaggerItem>
              ))}
            </StaggerList>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="donde">
          <Reveal>
            <h2 id="donde" className={styles.h2}>
              Llevalo donde estés
            </h2>
            <p className={styles.sectionLead}>
              No hace falta tener auto ni moto. Un accidente le puede pasar a cualquiera, también caminando.
            </p>
          </Reveal>
          <StaggerList as="ul" className={styles.places}>
            {PLACES.map((p) => (
              <StaggerItem as="li" key={p.name}>
                <p.icon className={styles.placeIcon} aria-hidden="true" strokeWidth={2} />
                <h3 className={styles.h3}>{p.name}</h3>
                <p>{p.text}</p>
              </StaggerItem>
            ))}
          </StaggerList>
        </section>

        <section className={styles.privacy} aria-labelledby="privacidad">
          <div className={styles.privacyInner}>
            <Reveal>
              <h2 id="privacidad" className={styles.h2}>
                Tus datos son tuyos
              </h2>
            </Reveal>
            <StaggerList as="ul" className={styles.privacyList}>
              {PRIVACY.map((p) => (
                <StaggerItem as="li" key={p.title} from={{ x: -18 }}>
                  <span className={styles.iconTileRed}>
                    <p.icon aria-hidden="true" strokeWidth={2.2} />
                  </span>
                  <div>
                    <h3 className={styles.h3}>{p.title}</h3>
                    <p>{p.text}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>
          </div>
        </section>

        <section className={styles.section} aria-labelledby="preguntas">
          <Reveal>
            <h2 id="preguntas" className={styles.h2}>
              Preguntas frecuentes
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <Faq items={FAQ} />
          </Reveal>
        </section>

        <section className={styles.final}>
          <Reveal>
            <h2 className={styles.finalTitle}>Hacé tu ficha hoy. Ojalá nunca la necesites.</h2>
          </Reveal>
          <Reveal delay={0.15}>
            <Link href="/registro" className={styles.ctaPrimary}>
              Crear mi ficha gratis
            </Link>
          </Reveal>
        </section>
      </main>

      <footer className={styles.footer}>
        <p className={styles.footerSos}>
          En una emergencia llamá al <a href="tel:107">107</a> (SAME Jujuy).
        </p>
        <p>HelpJuy no reemplaza la atención médica. Los datos los carga cada persona y no los verifica un médico.</p>
        <p>Hecho en Jujuy, Argentina.</p>
      </footer>
    </>
  );
}
