import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl py-16 px-4">
      <h1 className="text-2xl font-semibold mb-2">Página não encontrada</h1>
      <p className="text-slate-600 mb-6">
        O conteúdo que você procurou não existe ou foi movido.
      </p>
      <Link href="/" className="underline text-sm">← Voltar para a Home</Link>
    </main>
  );
}
