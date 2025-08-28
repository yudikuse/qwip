import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-xl text-center">
        <h1 className="text-3xl font-bold mb-2">Página não encontrada</h1>
        <p className="text-gray-600 mb-6">
          A página que você tentou acessar não existe ou foi movida.
        </p>

        <Link
          href="/"
          className="inline-block rounded-md border px-4 py-2 hover:bg-gray-50"
        >
          ← Voltar para a Home
        </Link>
      </div>
    </main>
  );
}
