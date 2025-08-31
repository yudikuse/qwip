'use client';

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-semibold">Política de Cookies — Qwip</h1>
        <p className="text-neutral-300 mt-2">Última atualização: 30/08/2025 • Versão: v1</p>

        <section className="prose prose-invert prose-neutral mt-8 max-w-none">
          <p>
            Esta Política explica como o Qwip usa cookies e tecnologias semelhantes. Usamos
            <strong> cookies essenciais</strong> para o funcionamento do site e, opcionalmente,
            <strong> analíticos</strong> e <strong>marketing</strong> — sempre mediante o seu
            consentimento.
          </p>

          <h2>Categorias</h2>
          <ul>
            <li>
              <strong>Essenciais:</strong> necessários para segurança, autenticação e entrega do
              serviço (não podem ser desativados).
            </li>
            <li>
              <strong>Analíticos (opcionais):</strong> medem uso e ajudam a melhorar a experiência.
            </li>
            <li>
              <strong>Marketing (opcionais):</strong> podem personalizar mensagens/conteúdos.
            </li>
          </ul>

          <h2>Como gerenciar preferências</h2>
          <p>
            Você pode gerenciar cookies no rodapé (banner) quando solicitado ou limpar o cookie de
            consentimento no navegador. Ao alterar preferências, recarregue a página.
          </p>

          <h2>Dúvidas de privacidade</h2>
          <p>
            Consulte nosso <a href="/privacy">Aviso de Privacidade</a> e fale com o DPO:
            <a href="mailto:privacidade@qwip.pro"> privacidade@qwip.pro</a>.
          </p>
        </section>
      </div>
    </main>
  );
}
