import './globals.css';
import type { Metadata } from 'next';
import CookieBanner from '@/components/CookieBanner';
import ConsentScripts from '@/components/ConsentScripts';
import AppFooter from '@/components/AppFooter';

export const metadata: Metadata = {
  title: 'Qwip — Venda HOJE',
  description: 'Crie seu anúncio, compartilhe o link e receba no WhatsApp.',
  metadataBase: new URL('https://qwip.pro'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-neutral-950 text-neutral-100 antialiased">
        {/* Scripts que respeitam consentimento */}
        <ConsentScripts />

        {/* Banner de cookies */}
        <CookieBanner />

        {/* Conteúdo */}
        {children}

        {/* Rodapé (client component) */}
        <AppFooter />
      </body>
    </html>
  );
}
