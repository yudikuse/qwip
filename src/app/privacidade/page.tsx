import Link from "next/link";

export default function PrivacidadePage() {
  return (
    <main className="mx-auto max-w-3xl py-16 px-4">
      <h1 className="text-2xl font-semibold mb-4">Política de Privacidade</h1>
      <p className="text-slate-700 mb-4">
        Versão placeholder. Descreva coleta, uso, armazenamento e direitos.
      </p>
      <ul className="list-disc pl-6 space-y-2 text-slate-700 mb-8">
        <li>Tipos de dados coletados;</li>
        <li>Base legal e finalidades;</li>
        <li>Compartilhamento com terceiros;</li>
        <li>Direitos dos titulares;</li>
        <li>Retenção e segurança.</li>
      </ul>
      <Link href="/" className="underline text-sm">← Voltar para a Home</Link>
    </main>
  );
}
