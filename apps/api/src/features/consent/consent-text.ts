/**
 * Texto del consentimiento. Si se modifica, hay que cambiar CONSENT_VERSION en @helpjuy/contracts
 * para que se vuelva a pedir.
 */
export const CONSENT_TEXT = `## Antes de cargar tus datos

**Qué guardamos.** Tu nombre, tus contactos de emergencia y los datos de salud que vos elijas cargar: alergias, enfermedades, medicación, grupo sanguíneo, peso, altura y otros datos útiles en una emergencia.

**Todo es opcional.** No estás obligado a cargar ningún dato de salud. Podés cargar solo lo que quieras.

**Quién lo ve.** Lo que marques como público lo puede ver **cualquier persona que escanee tu QR**, sin iniciar sesión. Está pensado para que un paramédico o un testigo sepa cómo ayudarte. Lo que marques como privado solo lo ves vos.

**Dónde se guarda.** En servidores ubicados en **Frankfurt (Unión Europea)**, una jurisdicción que la normativa argentina considera con protección adecuada de datos personales.

**Foto (opcional).** Si subís una foto, le borramos los datos ocultos (como la ubicación) y la guardamos cifrada. Por defecto **no se muestra**: solo se ve al escanear el QR si vos lo elegís.

**Cuándo abren tu ficha.** Cada vez que alguien abre tu ficha queda registrado el día y la hora (**no guardamos quién fue ni dónde estaba**) y te avisamos por email, como mucho una vez por hora. Ese registro se borra a los 90 días. Si alguien marca una emergencia, le avisamos a tu familia con la ubicación aproximada que comparta, que se borra a los 30 días.

**No es una historia clínica.** Los datos los cargás vos y **no los verifica ningún médico**.

**Tus derechos.** Podés ver, corregir, descargar y borrar tus datos en cualquier momento desde **Tu cuenta**. Si borrás tu cuenta, borramos todo. Si perdés un QR impreso, generás uno nuevo y el viejo deja de funcionar.

**Marco legal.** Los datos de salud son *datos sensibles* según la **Ley 25.326 de Protección de Datos Personales**. Por eso te pedimos este consentimiento expreso antes de guardarlos.`;
