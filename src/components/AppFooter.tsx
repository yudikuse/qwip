'use client';

import Link from 'next/link';

export default function AppFooter() {
  const openCookieManager = () => {
    (window as Window & { qwipOpenCookieBanner?: () => void }).qwipOpenCookieBanner?.();
  };

  return (
    <footer className="mt-20 border-t border-neutral-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-neutral-400 md:flex-row">
        <span>© {new Date().getFullYear()} Qwip</span>
        <nav className="flex flex-wrap items-center gap-5">
          <Link href="/terms" className="hover:text-neutral-200">Termos</Link>
          <Link href="/privacy" className="hover:text-neutral-200">Privacidade</Link>
          <Link href="/cookies" className="hover:text-neutral-200">Cookies</Link>
          <button
            type="button"
            onClick={openCookieManager}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 hover:bg-neutral-800"
          >
            Gerenciar cookies
          </button>
        </nav>
      </div>
    </footer>
  );
}
