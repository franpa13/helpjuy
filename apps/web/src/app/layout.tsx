import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible, Barlow_Condensed } from 'next/font/google';
import { MotionProvider } from '@/shared/motion/MotionProvider';
import './globals.css';

const body = Atkinson_Hyperlegible({
  variable: '--font-atkinson',
  subsets: ['latin'],
  weight: ['400', '700'],
});

const head = Barlow_Condensed({
  variable: '--font-barlow',
  subsets: ['latin'],
  weight: ['600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'HelpJuy — Ficha médica de emergencia',
  description: 'Creá tu ficha médica de emergencia con QR. Gratis, en Jujuy.',
};

export const viewport: Viewport = {
  themeColor: '#0f2236',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="es" className={`${body.variable} ${head.variable}`}>
      <body>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
