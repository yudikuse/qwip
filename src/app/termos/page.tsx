import Link from "next/link";

export default function TermosPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">Termos de Uso</h1>

      <p className="text-gray-700 mb-4">
        Estes Termos de Uso regem a utilização do Qwip. Ao usar o serviço, você
        concorda com as condições abaixo. Edite os tópicos conforme a sua
        necessidade.
      </p>

      <ol className="list-decimal pl-6 space-y-2 text-gray-700 mb-8">
        <li>Definições e aceitação</li>
        <li>Cadastro e responsabilidades do usuário</li>
        <li>Planos, pagamentos e cancelamentos</li>
        <li>Conteúdos proibidos e moderação</li>
        <li>Limitação de responsabilidade</li>
        <li>Alterações nos termos</li>
        <li>Foro e legislação aplicável</li>
      </ol>

      <Link
        href="/"
        className="inline-block rounded-md border px-4 py-2 hover:bg-gray-50"
      >
        ← Voltar para a Home
      </Link>
    </main>
  );
}
