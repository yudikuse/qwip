import Link from "next/link";

export default function PrivacidadePage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Política de Privacidade</h1>

      {/* Coloque aqui o texto completo da sua política, se quiser manter o seu conteúdo atual */}
      <p className="text-gray-700 mb-8">
        Esta é a nossa política de privacidade. Ajuste o conteúdo conforme sua necessidade.
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
