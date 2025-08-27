// src/app/privacidade/page.tsx
export const metadata = { title: 'Política de Privacidade • Qwip' };

export default function Page() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-4">Política de Privacidade</h1>
      <p className="text-gray-700 mb-4">
        Explicamos aqui como coletamos, usamos e protegemos suas informações.
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700">
        <li>Armazenamos dados mínimos para funcionamento básico.</li>
        <li>Você pode solicitar remoção/alteração de dados.</li>
        <li>Utilizamos cookies estritamente necessários.</li>
      </ul>
      <div className="mt-8">
        <a className="underline" href="/">← Voltar para a Home</a>
      </div>
    </main>
  );
}
