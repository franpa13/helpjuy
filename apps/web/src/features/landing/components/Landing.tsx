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
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/18 bg-night px-[clamp(16px,4vw,48px)] py-2.5 text-white">
        <Link href="/" className="font-head text-[22px] font-extrabold tracking-[0.06em] text-white uppercase no-underline max-[559px]:[&_svg]:size-6 max-[559px]:[&>span>span]:text-[24px]!" aria-label="HelpJuy, inicio">
          <Logo size={32} crossColor="var(--red-bright)" />
        </Link>
        <nav className="flex items-center gap-[18px] text-base font-bold max-[559px]:gap-3 max-[559px]:text-[15px] [&_a]:text-white" aria-label="Cuenta">
          <Link href="/ingresar">Ingresar</Link>
          <Link href="/registro" className="rounded-md bg-red-bright px-3.5 py-2 whitespace-nowrap text-white! no-underline max-[559px]:px-2.5 max-[559px]:py-[7px]">
            Crear mi ficha
          </Link>
        </nav>
      </header>

      <main>
        <section className="overflow-hidden bg-night text-white">
          <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-12 px-[clamp(16px,4vw,48px)] pt-[clamp(32px,6vw,80px)] pb-[clamp(48px,7vw,96px)] split:grid-cols-[1.15fr_1fr] split:gap-10">
            <HeroText />
            <HeroVisual />
          </div>
        </section>

        <section className="bg-night-deep text-white" aria-label="En pocas palabras">
          <StaggerList as="ul" className="mx-auto grid max-w-[1240px] list-none grid-cols-1 gap-x-8 gap-y-4 px-[clamp(16px,4vw,48px)] py-[22px] sm:grid-cols-2 wide:grid-cols-4">
            {FACTS.map(({ icon: Icon, text }) => (
              <StaggerItem as="li" key={text} className="flex items-center gap-3 text-base/[1.3] font-bold">
                <Icon className="size-[26px] shrink-0 text-[#ff5a6e]" aria-hidden="true" strokeWidth={2.2} />
                <span>{text}</span>
              </StaggerItem>
            ))}
          </StaggerList>
        </section>

        <section className="mx-auto max-w-[1240px] px-[clamp(16px,4vw,48px)] py-[clamp(56px,8vw,104px)]" aria-labelledby="como-funciona">
          <Reveal>
            <h2 id="como-funciona" className="max-w-[16ch] text-[clamp(36px,5vw,64px)]/[0.92]">
              Cómo funciona
            </h2>
          </Reveal>
          <ol className="mt-10 grid list-none gap-0 border-t-3 border-ink p-0 min-[860px]:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="border-b border-line py-6 pr-6 min-[860px]:border-b-0 min-[860px]:pt-7 min-[860px]:pr-7 min-[860px]:pb-0 min-[860px]:not-first:border-l min-[860px]:not-first:pl-7 [&_p]:max-w-[32em]">
                <div className="mb-4 flex items-end justify-between">
                  <StepNumber n={i + 1} />
                  <span className="inline-grid size-11 shrink-0 place-items-center rounded-md [&_svg]:size-6 bg-red text-white">
                    <s.icon aria-hidden="true" strokeWidth={2.2} />
                  </span>
                </div>
                <Reveal delay={0.1 + i * 0.12} y={16}>
                  <h3 className="mb-2 text-[26px]/none">{s.title}</h3>
                  <p>{s.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="border-y-3 border-ink bg-white px-[clamp(16px,4vw,48px)] py-[clamp(56px,8vw,104px)]"
          aria-labelledby="que-ve"
        >
          <div className="mx-auto max-w-[1144px] grid gap-10 panel:grid-cols-[0.9fr_1.1fr] panel:items-start panel:gap-16">
            <Reveal>
              <h2 id="que-ve" className="max-w-[16ch] text-[clamp(36px,5vw,64px)]/[0.92]">
                Lo que ve el paramédico en los primeros segundos
              </h2>
              <p className="mt-[18px] max-w-[36em] text-[19px] text-muted-foreground">
                Cuando alguien está inconsciente, el equipo de emergencia no puede preguntarle nada. Tu ficha contesta por
                vos, en el orden en que lo necesitan.
              </p>
            </Reveal>
            <StaggerList as="dl" className="border-t-3 border-ink">
              {DATA.map((d, i) => (
                <StaggerItem key={d.name} className="grid grid-cols-1 gap-1 border-b border-line py-4 min-[560px]:grid-cols-[11rem_1fr] min-[560px]:items-baseline min-[560px]:gap-5 [&_dd]:m-0 [&_dt]:flex [&_dt]:items-center [&_dt]:gap-3 [&_dt]:font-head [&_dt]:text-2xl/none [&_dt]:font-extrabold [&_dt]:uppercase first:[&_dt]:text-red" from={{ x: 24 }}>
                  <dt>
                    <span className={i === 0 ? 'inline-grid size-9 shrink-0 place-items-center rounded-md [&_svg]:size-5 bg-red text-white' : 'inline-grid size-9 shrink-0 place-items-center rounded-md [&_svg]:size-5 border-2 border-ink text-ink'}>
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

        <section className="mx-auto max-w-[1240px] px-[clamp(16px,4vw,48px)] py-[clamp(56px,8vw,104px)]" aria-labelledby="donde">
          <Reveal>
            <h2 id="donde" className="max-w-[16ch] text-[clamp(36px,5vw,64px)]/[0.92]">
              Llevalo donde estés
            </h2>
            <p className="mt-[18px] max-w-[36em] text-[19px] text-muted-foreground">
              No hace falta tener auto ni moto. Un accidente le puede pasar a cualquiera, también caminando.
            </p>
          </Reveal>
          <StaggerList as="ul" className="mt-10 grid list-none gap-x-8 gap-y-6 p-0 min-[700px]:grid-cols-2 min-[1000px]:grid-cols-3 min-[1000px]:gap-x-12 min-[1000px]:gap-y-10 [&>li]:border-t-3 [&>li]:border-ink [&>li]:pt-4">
            {PLACES.map((p) => (
              <StaggerItem as="li" key={p.name}>
                <p.icon className="mb-3.5 block size-10 text-red" aria-hidden="true" strokeWidth={2} />
                <h3 className="mb-2 text-[26px]/none">{p.name}</h3>
                <p>{p.text}</p>
              </StaggerItem>
            ))}
          </StaggerList>
        </section>

        <section className="bg-night text-white" aria-labelledby="privacidad">
          <div className="mx-auto max-w-[1240px] px-[clamp(16px,4vw,48px)] py-[clamp(56px,8vw,104px)]">
            <Reveal>
              <h2 id="privacidad" className="max-w-[16ch] text-[clamp(36px,5vw,64px)]/[0.92]">
                Tus datos son tuyos
              </h2>
            </Reveal>
            <StaggerList as="ul" className="mt-10 grid list-none gap-x-10 gap-y-7 p-0 min-[800px]:grid-cols-2 [&>li]:flex [&>li]:items-start [&>li]:gap-4 [&_p]:max-w-[34em] [&_p]:text-white/82">
              {PRIVACY.map((p) => (
                <StaggerItem as="li" key={p.title} from={{ x: -18 }}>
                  <span className="inline-grid size-11 shrink-0 place-items-center rounded-md [&_svg]:size-6 bg-red text-white">
                    <p.icon aria-hidden="true" strokeWidth={2.2} />
                  </span>
                  <div>
                    <h3 className="mb-2 text-[26px]/none">{p.title}</h3>
                    <p>{p.text}</p>
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-[clamp(16px,4vw,48px)] py-[clamp(56px,8vw,104px)]" aria-labelledby="preguntas">
          <Reveal>
            <h2 id="preguntas" className="max-w-[16ch] text-[clamp(36px,5vw,64px)]/[0.92]">
              Preguntas frecuentes
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <Faq items={FAQ} />
          </Reveal>
        </section>

        <section className="mx-auto grid max-w-[1240px] justify-items-start gap-7 border-t-3 border-ink px-[clamp(16px,4vw,48px)] py-[clamp(56px,8vw,96px)]">
          <Reveal>
            <h2 className="max-w-[14ch] text-[clamp(40px,6vw,80px)]/[0.9]">Hacé tu ficha hoy. Ojalá nunca la necesites.</h2>
          </Reveal>
          <Reveal delay={0.15}>
            <Link href="/registro" className="inline-flex min-h-14 items-center justify-center rounded-md px-[26px] py-3.5 font-head text-[22px] font-extrabold uppercase tracking-[0.03em] no-underline border-2 border-red bg-red text-white">
              Crear mi ficha gratis
            </Link>
          </Reveal>
        </section>
      </main>

      <footer className="grid gap-2 bg-night px-[clamp(16px,4vw,48px)] pt-8 pb-10 text-[15px] text-white [&_a]:font-bold [&_a]:text-red-bright">
        <p className="font-head text-[26px] font-extrabold uppercase">
          En una emergencia llamá al <a href="tel:107">107</a> (SAME Jujuy).
        </p>
        <p>HelpJuy no reemplaza la atención médica. Los datos los carga cada persona y no los verifica un médico.</p>
        <p>Hecho en Jujuy, Argentina.</p>
      </footer>
    </>
  );
}
