/**
 * Símbolo de HelpJuy: cruz escalonada (cruz de emergencia + chakana andina) sobre una grilla de 9×9,
 * como los módulos de un QR. El píxel vacío del centro es el "módulo" del QR y el centro de la chakana.
 */
export const SYMBOL_PATH =
  'M30 0H60V20H70V30H90V60H70V70H60V90H30V70H20V60H0V30H20V20H30Z M40 40V50H50V40Z';

type SymbolProps = { size?: number; color?: string; className?: string; title?: string };

export function LogoSymbol({ size = 28, color = 'currentColor', className, title }: SymbolProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 90 90"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      shapeRendering="crispEdges"
    >
      <path d={SYMBOL_PATH} fill={color} fillRule="evenodd" />
    </svg>
  );
}

type LogoProps = { size?: number; color?: string; className?: string };

/** Símbolo + nombre. El nombre usa la tipografía de títulos de la web (Barlow Condensed). */
export function Logo({ size = 28, color = 'currentColor', className }: LogoProps) {
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.32, color, lineHeight: 1 }}
    >
      <LogoSymbol size={size} />
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
