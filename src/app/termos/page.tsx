import Link from "next/link";

export default function TermosPage() {
  return (
    <main className="mx-auto max-w-3xl py-16 px-4">
      <h1 className="text-2xl font-semibold mb-4">Termos de Uso</h1>
      <p className="text-slate-700 mb-4">
        Versão placeholder. Regras de uso, responsabilidades e condições.
      </p>
      <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-8">
        <li>Cadastro e elegibilidade;</li>
        <li>Responsabilidades;</li>
        <li>Condutas proibidas;</li>
        <li>Limites de responsabilidade;</li>
        <li>Foro e legislação.</li>
      </ul>
      <Link href="/" className="underline text-sm">← Voltar para a Home</Link>
    </main>
  );
}
