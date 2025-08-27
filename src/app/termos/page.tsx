// src/app/termos/page.tsx
export const metadata = { title: 'Termos de Uso • Qwip' };

export default function Page() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">Termos de Uso</h1>
      <p className="text-gray-700 mb-4">
        Estes termos regem o uso da plataforma Qwip. Ao utilizar o serviço,
        você concorda com as condições aqui descritas.
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700">
        <li>Conteúdos de anúncios são de responsabilidade do anunciante.</li>
        <li>Proibido publicar material ilegal, ofensivo ou enganoso.</li>
        <li>Podemos atualizar estes termos a qualquer momento.</li>
      </ul>
      <div className="mt-8">
        <a className="underline" href="/">← Voltar para a Home</a>
      </div>
    </main>
  );
}
