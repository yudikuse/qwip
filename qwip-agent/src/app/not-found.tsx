// src/app/not-found.tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[70vh] grid place-items-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold mb-2">Página não encontrada</h1>
        <p className="text-zinc-400 mb-6">
          A página que você tentou acessar não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-medium hover:bg-emerald-500 transition-colors"
        >
          ← Voltar para a página inicial
        </Link>
      </div>
    </main>
  );
}
