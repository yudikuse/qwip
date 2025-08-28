import Link from "next/link";

export default function TermosPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Termos de Uso</h1>

      {/* Coloque aqui os seus termos completos, se quiser manter o seu conteúdo atual */}
      <p className="text-gray-700 mb-8">
        Estes são os termos de uso. Ajuste o conteúdo conforme sua necessidade.
      </p>

      <Link
        href="/"
        className="inline-block rounded-md border px-4 py-2 hover:bg-gray-50"
      >
        ← Voltar para a Home
      </Link>
    </main>
  );
}
