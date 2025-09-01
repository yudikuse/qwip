'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="mb-3 text-3xl font-semibold">Página não encontrada</h1>
      <p className="mb-8 text-neutral-400">
        O link pode estar incorreto ou o conteúdo não existe mais.
      </p>

      <div className="flex items-center justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg border border-neutral-700 px-4 py-2 hover:bg-neutral-800"
        >
          Ir para a Home
        </Link>

        <a
          href="mailto:suporte@qwip.pro"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-500"
        >
          Falar com o suporte
        </a>
      </div>
    </main>
  );
}
