import { CONSENT_VERSION } from '@helpjuy/contracts';
import Link from 'next/link';
import { Logo } from '@/shared/brand/Logo';

export const metadata = {
  title: 'Política de privacidad — HelpJuy',
  description: 'Qué datos guarda HelpJuy, para qué, dónde, por cuánto tiempo y cómo ejercer tus derechos (Ley 25.326).',
};

/** Dirección de contacto del responsable (variable de entorno CONTACT_EMAIL en Vercel). */
const contact = process.env.CONTACT_EMAIL;

const section = 'grid gap-3 border-t border-line pt-6 [&_h2]:text-[28px] [&_li]:ml-5 [&_ul]:grid [&_ul]:list-disc [&_ul]:gap-1.5';

export default function PrivacidadPage() {
  return (
    <div className="min-h-dvh bg-paper">
      <header className="bg-night px-[clamp(16px,4vw,48px)] py-3">
        <Link href="/" className="text-white no-underline" aria-label="HelpJuy, inicio">
          <Logo size={28} crossColor="var(--red-bright)" />
        </Link>
      </header>
      <main className="mx-auto grid max-w-[760px] gap-8 px-4 pt-10 pb-16 text-[17px]">
        <div>
          <h1 className="text-[clamp(40px,7vw,64px)]/[0.92]">Política de privacidad</h1>
          <p className="mt-3 text-muted-foreground">
            Versión vigente desde el 7 de noviembre de 2026 (consentimiento {CONSENT_VERSION}). La escribimos sin letra chica.
          </p>
        </div>

        <section className={section}>
          <h2>Qué es HelpJuy</h2>
          <p>
            Una herramienta gratuita para armar una ficha médica de emergencia con un código QR. Si te pasa algo, quien
            escanee el QR (un paramédico o un testigo) ve los datos que vos elegiste mostrar y puede avisarle a tu familia.
            No es una historia clínica: los datos los cargás vos y no los verifica ningún médico.
          </p>
        </section>

        <section className={section}>
          <h2>Qué datos guardamos</h2>
          <ul>
            <li>
              <strong>De tu cuenta:</strong> tu email y tu contraseña (guardada con un algoritmo que no se puede revertir), o
              tu identificador de Google si entrás con Google.
            </li>
            <li>
              <strong>De cada ficha:</strong> nombre, relación con vos y, solo si los cargás, datos de salud (alergias,
              enfermedades, medicación, grupo sanguíneo, peso, altura, cirugías, obra social, médico, notas), contactos de
              emergencia y una foto. <strong>Todo es opcional</strong> salvo el nombre.
            </li>
            <li>
              <strong>Cuándo abren tu ficha:</strong> solo el día y la hora. No guardamos quién fue, su IP ni dónde estaba.
            </li>
            <li>
              <strong>Si alguien marca una emergencia:</strong> el día, la hora y, si quien escaneó la comparte, una
              ubicación aproximada (redondeada a unos 100 metros).
            </li>
            <li>
              <strong>Grupos familiares:</strong> el nombre del grupo y quiénes lo integran. Los miembros no ven tus datos
              médicos: solo reciben los avisos.
            </li>
            <li>
              <strong>Tu consentimiento:</strong> qué versión aceptaste y cuándo, como prueba de que lo diste.
            </li>
          </ul>
          <p>
            Los datos de salud son <strong>datos sensibles</strong> según la Ley 25.326. Por eso te pedimos un consentimiento
            expreso, sin casillas marcadas de antemano, antes de guardarlos.
          </p>
        </section>

        <section className={section}>
          <h2>Quién ve qué</h2>
          <ul>
            <li>
              <strong>Quien escanea tu QR</strong> ve solo las secciones que marcaste como &quot;Se ve en el QR&quot;. Nunca
              ve tu email, tu fecha de nacimiento (solo la edad) ni lo que dejaste en &quot;Solo yo&quot;. La foto está
              oculta hasta que vos decidas mostrarla.
            </li>
            <li>
              <strong>Tu familia</strong> (si armás un grupo) recibe un email cuando alguien marca una emergencia, con la hora
              y la ubicación aproximada. Nada más.
            </li>
            <li>
              <strong>Buscadores:</strong> las fichas no aparecen en Google; les pedimos expresamente que no las indexen.
            </li>
            <li>
              <strong>Quien administra HelpJuy</strong> ve una lista de cuentas: tu email, cuándo te registraste, si lo
              confirmaste, cuántas fichas tenés y si tu QR está activo o impreso. La usa para dar soporte y medir cuánto se
              usa la app. Nunca ve tus datos médicos ni los nombres de tus fichas.
            </li>
            <li>
              <strong>Nadie más.</strong> No vendemos ni compartimos tus datos, no hay publicidad ni seguimiento.
            </li>
          </ul>
        </section>

        <section className={section}>
          <h2>Dónde se guardan y con quién trabajamos</h2>
          <p>
            Los datos de salud y la foto se guardan <strong>cifrados</strong> (AES-256) en servidores de{' '}
            <strong>Frankfurt, Unión Europea</strong>, una jurisdicción que la normativa argentina considera con protección
            adecuada. Para funcionar usamos estos proveedores, que procesan datos solo para prestarnos el servicio:
          </p>
          <ul>
            <li>Neon: base de datos (Frankfurt).</li>
            <li>Render: servidor de la aplicación (Frankfurt).</li>
            <li>Vercel: publicación del sitio web.</li>
            <li>Resend: envío de emails (confirmación de cuenta y avisos).</li>
            <li>Google: solo si elegís entrar con Google.</li>
            <li>OpenStreetMap: el mapa de la sección Avisos se dibuja con sus mapas.</li>
          </ul>
        </section>

        <section className={section}>
          <h2>Cuánto tiempo los guardamos</h2>
          <ul>
            <li>Tu cuenta y tus fichas: hasta que las borres.</li>
            <li>La ubicación de un aviso de emergencia: 30 días.</li>
            <li>El registro de cuándo abrieron tu ficha: 90 días.</li>
            <li>Sesiones, invitaciones y links de confirmación: hasta que vencen.</li>
          </ul>
        </section>

        <section className={section}>
          <h2>Tus derechos</h2>
          <p>
            Podés ver y corregir tus datos cuando quieras desde el panel. En <strong>Tu cuenta</strong> podés{' '}
            <strong>descargar todos tus datos</strong> y <strong>borrar tu cuenta</strong>: se borra todo y los QR impresos
            dejan de funcionar. Si perdés un QR impreso, generás uno nuevo y el viejo deja de servir. Podés acceder a tus datos
            en forma gratuita a intervalos no inferiores a seis meses, salvo que acredites un interés legítimo (art. 14, inc. 3,
            Ley 25.326); en HelpJuy lo podés hacer cuando quieras.
            {contact && (
              <>
                {' '}
                Para cualquier consulta escribinos a <a href={`mailto:${contact}`}>{contact}</a>.
              </>
            )}
          </p>
          <p className="border-l-6 border-blue bg-blue-tint px-4 py-3 text-[15px]">
            La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la
            atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por
            incumplimiento de las normas vigentes en materia de protección de datos personales.
          </p>
        </section>

        <section className={section}>
          <h2>Menores</h2>
          <p>
            La ficha de un menor la crea su madre, padre o tutor, que declara serlo al aceptar el consentimiento. Te
            recomendamos no mostrar la foto de un menor en el QR.
          </p>
        </section>

        <p className="border-t border-line pt-6 text-muted-foreground">
          Si cambiamos algo importante, actualizamos esta página con la nueva fecha y las fichas nuevas piden aceptar la nueva versión.{' '}
          <Link href="/">Volver al inicio</Link>
        </p>
      </main>
    </div>
  );
}
