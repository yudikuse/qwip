/* eslint-disable @next/next/no-img-element */

// Home – QWIP (pixel aligned ao Figma)
export default function Page() {
  return (
    <main className="relative">
      {/* NAV mínima */}
      <div className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-page/55 border-b border-zinc-800/70">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-100">
            <div className="h-6 w-6 rounded-md grid place-items-center bg-zinc-900 border border-zinc-700/70">
              <span className="text-[13px]">Q</span>
            </div>
            <span className="font-semibold tracking-tight">Qwip</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <a href="/vitrine" className="btn-ghost">Vitrine</a>
            <a href="/dashboard" className="btn-ghost">Dashboard</a>
            <a href="#cta" className="btn">Começar grátis</a>
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="pt-16 pb-8">
        <div className="container grid lg:grid-cols-2 gap-10 items-center">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="badge">Powered by AI</span>
              <span className="badge">Menos de 60s para publicar</span>
            </div>

            <h1 className="text-hero md:text-hero font-extrabold tracking-tight">
              Anúncios rápidos.<br />
              <span className="text-brand">Link direto pro</span><br />
              WhatsApp.
            </h1>

            <p className="mt-5 text-zinc-300 max-w-lg">
              Publique em menos de 60 segundos. O anúncio expira
              automaticamente, gerando urgência e mantendo a vitrine sempre atual.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#cta" className="btn">⚡ Criar Anúncio Grátis</a>
              <a href="/vitrine" className="btn-ghost">Ver Vitrine de Anúncios</a>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-[13px] text-zinc-300/90">
              <span className="badge">100% direto no WhatsApp — sem taxas sobre a venda</span>
              <span className="badge">Menos de 60s</span>
              <span className="badge">Link compartilhável</span>
              <span className="badge">Expira automaticamente</span>
            </div>
          </div>

          {/* Mock do cartão (lado direito) */}
          <div className="card p-4">
            <div className="border border-zinc-700/70 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/60 border-b border-zinc-800">
                <div className="text-sm font-medium text-zinc-300">QWIP Vendas</div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="badge">Melhorado com IA</span>
                  <span className="badge">⏳ Expira em 23h 45min</span>
                </div>
              </div>
              <div className="h-[260px] w-full bg-zinc-800/80 grid place-items-center text-zinc-400">
                Prévia do anúncio
              </div>
              <div className="px-4 py-3 text-sm">
                <div className="font-semibold">Marmita Caseira Completa</div>
                <div className="text-zinc-400">Centro, Rio de Janeiro • Entrega 30min</div>
              </div>
              <div className="flex items-center justify-between px-4 pb-4">
                <div className="text-brand font-semibold">R$ 18,50</div>
                <div className="flex gap-2">
                  <a className="btn-ghost" href="https://wa.me/" target="_blank">WhatsApp</a>
                  <button className="btn-ghost">Compartilhar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* “Perfeito para você” */}
      <section className="py-10">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-semibold text-center">Perfeito para você</h2>
          <p className="text-zinc-400 text-center mt-2">Não importa o que você venda, o QWIP funciona.</p>

          <div className="grid md:grid-cols-3 gap-4 mt-8">
            {[
              {
                t: "Vendedores Autônomos",
                d: "Roupas, cosméticos, artesanato. Venda no seu tempo.",
              },
              {
                t: "Lojistas Locais",
                d: "Promoções rápidas, liquidações, produtos sazonais.",
              },
              {
                t: "Vendas Pessoais",
                d: "Usados, freelas e serviços pontuais.",
              },
            ].map((c, i) => (
              <div key={i} className="card p-5">
                <div className="h-9 w-9 rounded-lg bg-brand/15 text-brand grid place-items-center mb-3">✔</div>
                <div className="font-semibold">{c.t}</div>
                <div className="text-zinc-400 text-sm mt-1">{c.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-8">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-semibold text-center">Como funciona</h2>
          <p className="text-zinc-400 text-center mt-2">
            Em 3 passos simples, seu anúncio entra no ar com urgência real
          </p>

          <div className="grid md:grid-cols-3 gap-4 mt-8">
            {[
              { n: "01", t: "Crie seu anúncio em 60s", d: "Foto, título, preço e endereço. Pronto." },
              { n: "02", t: "Compartilhe o link", d: "Envie no WhatsApp, redes sociais e onde quiser." },
              { n: "03", t: "Receba no WhatsApp", d: "O comprador fala direto com você, sem intermediação." },
            ].map((s) => (
              <div key={s.n} className="card p-5">
                <div className="text-zinc-500 text-sm">{s.n}</div>
                <div className="mt-2 font-semibold">{s.t}</div>
                <div className="text-zinc-400 text-sm mt-1">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vitrine de Anúncios (exemplos) */}
      <section className="py-10">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-semibold text-center">Vitrine de Anúncios</h2>
          <p className="text-zinc-400 text-center mt-2">
            Veja como ficam os anúncios reais no Qwip
          </p>

          <div className="grid md:grid-cols-3 gap-5 mt-8">
            {[
              { img: "/img/demo-1.jpg", t: "Marmita Caseira Completa", price: "R$ 18,50" },
              { img: "/img/demo-2.jpg", t: "Manicure & Pedicure", price: "R$ 35,00" },
              { img: "/img/demo-3.jpg", t: "Açaí Premium c/ Frutas", price: "R$ 15,50" },
            ].map((a, i) => (
              <article key={i} className="card overflow-hidden">
                <div className="relative aspect-[4/3] bg-zinc-800/60" />
                <div className="p-4">
                  <div className="text-sm text-zinc-400">Vila Madalena, SP</div>
                  <div className="font-semibold mt-1">{a.t}</div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-brand font-semibold">{a.price}</div>
                    <a className="btn-ghost" href="/vitrine">Falar no WhatsApp</a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="text-center mt-6">
            <a href="/vitrine" className="btn-ghost">Ver todos os anúncios</a>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-10">
        <div className="container">
          <div className="badge mx-auto mb-3">+1249 vendedores ativos neste mês</div>
          <h2 className="text-2xl md:text-3xl font-semibold text-center">O que dizem nossos usuários</h2>
          <p className="text-zinc-400 text-center mt-2">
            Resultados reais de pequenos negócios como você
          </p>

          <div className="grid md:grid-cols-3 gap-4 mt-8">
            {[
              {
                ini: "F",
                nome: "Fernanda Couto",
                cargo: "Marmitaria Caseira",
                texto:
                  "Vendi em 2h pelo Qwip! Publiquei a marmita às 10h, às 12h já tinha 3 clientes.",
              },
              {
                ini: "C",
                nome: "Carlos Mendes",
                cargo: "Assistência Técnica",
                texto:
                  "O que mais gosto é que expira automaticamente. Nunca mais anúncio velho na internet.",
              },
              {
                ini: "M",
                nome: "Mariana Silva",
                cargo: "Studio de Beleza",
                texto:
                  "Menos de 1 minuto para criar. Mais tempo vendendo, menos tempo perdendo com tecnologia.",
              },
            ].map((p, i) => (
              <div key={i} className="card p-5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand/15 text-brand grid place-items-center font-semibold">
                    {p.ini}
                  </div>
                  <div>
                    <div className="font-medium">{p.nome}</div>
                    <div className="text-xs text-zinc-400">{p.cargo}</div>
                  </div>
                </div>
                <div className="mt-3 text-zinc-300 text-sm leading-relaxed">“{p.texto}”</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12">
        <div className="container">
          <h2 className="text-2xl md:text-3xl font-semibold text-center">Perguntas Frequentes</h2>
          <p className="text-zinc-400 text-center mt-2">
            Respondemos as principais dúvidas sobre o QWIP
          </p>

          <div className="mx-auto mt-8 max-w-3xl space-y-3">
            {[
              ["Por que o anúncio expira automaticamente?",
               "Para manter a vitrine sempre atual e aumentar a urgência de compra."],
              ["O Qwip é seguro? Como funciona a moderação?",
               "Temos moderação automática e denúncias da comunidade."],
              ["Posso denunciar anúncios impróprios?",
               "Sim. Cada anúncio tem um menu com opção de denúncia."],
              ["Preciso instalar aplicativo?",
               "Não. É tudo no navegador e os clientes falam direto no seu WhatsApp."],
              ["Como o Qwip ganha dinheiro? Há taxas sobre vendas?",
               "Planos por assinatura. Não cobramos taxa sobre a sua venda."],
              ["Posso cancelar minha assinatura a qualquer momento?",
               "Pode sim, sem fidelidade e sem burocracia."],
            ].map(([q, a], i) => (
              <details key={i} className="card">
                <summary className="cursor-pointer select-none list-none px-5 py-4 font-medium">
                  {q}
                </summary>
                <div className="px-5 pb-5 text-zinc-300">{a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final / footer */}
      <section id="cta" className="py-14">
        <div className="container text-center">
          <h3 className="text-2xl md:text-3xl font-semibold">Pronto para vender mais rápido?</h3>
          <p className="text-zinc-400 mt-2">
            Junte-se a centenas de vendedores que já usam urgência real.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <a className="btn" href="/dashboard">Começar Agora — Grátis</a>
            <a className="btn-ghost" href="/vitrine">Ver Mais Exemplos</a>
          </div>
          <p className="text-[13px] text-zinc-500 mt-3">
            Plano gratuito para sempre • Sem taxas sobre vendas • Cancele quando quiser
          </p>
        </div>

        <footer className="mt-12 border-t border-zinc-800/70">
          <div className="container py-6 text-sm text-zinc-400 flex flex-wrap items-center justify-between gap-3">
            <div>Qwip © 2025 — Feito com ❤️</div>
            <nav className="flex gap-5">
              <a className="hover:text-zinc-200" href="/termos">Termos de Uso</a>
              <a className="hover:text-zinc-200" href="/privacidade">Política de Privacidade</a>
              <a className="hover:text-zinc-200" href="/contato">Contato</a>
            </nav>
          </div>
        </footer>
      </section>
    </main>
  );
}
