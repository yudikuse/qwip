import Link from "next/link";

export default function PrivacidadePage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">Política de Privacidade</h1>

      <p className="text-gray-700 mb-4">
        Descreva aqui como os dados dos usuários são coletados, utilizados e
        armazenados. Ajuste este texto conforme a política do seu produto.
      </p>

      <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-8">
        <li>Quais dados coletamos</li>
        <li>Base legal e finalidade</li>
        <li>Compartilhamento com terceiros</li>
        <li>Armazenamento e segurança</li>
        <li>Direitos do titular e contato</li>
      </ul>

      <Link
        href="/"
        className="inline-block rounded-md border px-4 py-2 hover:bg-gray-50"
      >
        ← Voltar para a Home
      </Link>
    </main>
  );
}
