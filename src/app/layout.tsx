import './globals.css';
import type { Metadata } from 'next';
import CookieBanner from '@/components/CookieBanner';

export const metadata: Metadata = {
  title: 'Qwip — Venda HOJE',
  description: 'Crie seu anúncio, compartilhe o link e receba no WhatsApp.',
  metadataBase: new URL('https://qwip.pro'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-neutral-950 text-neutral-100 antialiased">
        {/* Banner de cookies */}
        <CookieBanner />

        {/* Conteúdo */}
        {children}

        {/* Rodapé enxuto com links legais */}
        <footer className="mt-20 border-t border-neutral-800">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-neutral-400 md:flex-row">
            <span>© {new Date().getFullYear()} Qwip</span>
            <nav className="flex flex-wrap items-center gap-5">
              <a href="/terms" className="hover:text-neutral-200">Termos</a>
              <a href="/privacy" className="hover:text-neutral-200">Privacidade</a>
              <a href="/cookies" className="hover:text-neutral-200">Cookies</a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
