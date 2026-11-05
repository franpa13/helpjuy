import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible, Barlow_Condensed } from 'next/font/google';
import './globals.css';

const body = Atkinson_Hyperlegible({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '700'],
});

const head = Barlow_Condensed({
  variable: '--font-head',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'HelpJuy — Ficha médica de emergencia',
  description: 'Creá tu ficha médica de emergencia con QR. Gratis, en Jujuy.',
};

export const viewport: Viewport = {
  themeColor: '#c8102e',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className={`${body.variable} ${head.variable}`}>
      <body>{children}</body>
    </html>
  );
}
