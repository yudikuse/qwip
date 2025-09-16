import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-2xl font-semibold">Anúncio não encontrado</h1>
      <p className="mt-2 text-gray-600">
        O anúncio que você tentou acessar não existe ou foi removido.
      </p>
      <div className="mt-6">
        <Link
          href="/vitrine"
          className="rounded-lg border px-4 py-2 font-medium hover:bg-gray-50"
        >
          ← Voltar para a Vitrine
        </Link>
      </div>
    </div>
  );
}
