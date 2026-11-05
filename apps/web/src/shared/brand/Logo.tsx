/**
 * Símbolo de HelpJuy: un QR cuyo cuarto "ojo" es una cruz de emergencia.
 * Se lee como lo que hace la app: un código que se escanea y lleva a tu información médica.
 * Grilla de 100: ojos de 40×40, módulos de 8, cruz de 40×40 con brazos de 14.
 */
export const QR_PATH =
  'M0 0H40V40H0Z M8 8V32H32V8Z M14 14H26V26H14Z ' +
  'M60 0H100V40H60Z M68 8V32H92V8Z M74 14H86V26H74Z ' +
  'M0 60H40V100H0Z M8 68V92H32V68Z M14 74H26V86H14Z ' +
  'M46 0H54V8H46Z M46 16H54V24H46Z M46 46H54V54H46Z M0 46H8V54H0Z M24 46H32V54H24Z M46 76H54V84H46Z M46 92H54V100H46Z';

export const CROSS_PATH = 'M73 60H87V73H100V87H87V100H73V87H60V73H73Z';

type SymbolProps = {
  size?: number;
  /** Color del QR. */
  color?: string;
  /** Color de la cruz. Por defecto, el rojo de la marca. */
  crossColor?: string;
  className?: string;
  title?: string;
};

export function LogoSymbol({ size = 28, color = 'currentColor', crossColor = '#C8102E', className, title }: SymbolProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      shapeRendering="crispEdges"
    >
      <path d={QR_PATH} fill={color} fillRule="evenodd" />
      <path d={CROSS_PATH} fill={crossColor} />
    </svg>
  );
}

type LogoProps = { size?: number; color?: string; crossColor?: string; className?: string };

/** Símbolo + nombre. El nombre usa la tipografía de títulos de la web (Barlow Condensed). */
export function Logo({ size = 28, color = 'currentColor', crossColor, className }: LogoProps) {
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.34, color, lineHeight: 1 }}
    >
      <LogoSymbol size={size} crossColor={crossColor ?? color} />
      <span
        style={{
          fontFamily: 'var(--font-head), "Arial Narrow", sans-serif',
          fontWeight: 800,
          fontSize: size * 1.02,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          transform: 'translateY(0.04em)',
        }}
      >
        HelpJuy
      </span>
    </span>
  );
}
