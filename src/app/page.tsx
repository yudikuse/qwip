// src/app/page.tsx
import Link from "next/link";

export const dynamic = "force-static";

export default function HomePage() {
  return (
    <main className="relative">
      {/* HERO */}
      <section className="container mx-auto max-w-6xl px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Texto */}
          <div>
            <div className="flex gap-2 mb-6">
              <span className="chip">Powered by AI</span>
              <span className="chip">🚀 Menos de 60s para publicar</span>
            </div>

            <h1 className="hero-title">
              <span className="block">Anúncios rápidos.</span>
              <span className="block text-primary">Link direto pro</span>
              <span className="block text-primary">WhatsApp.</span>
            </h1>

            <p className="mt-4 max-w-[52ch] text-sm text-muted-foreground">
              Publique em menos de 60 segundos. O anúncio expira
              automaticamente, gerando urgência e mantendo a vitrine sempre atual.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="btn">Criar Anúncio Grátis</Link>
              <Link href="/vitrine" className="btn-secondary">Ver Vitrine de Anúncios</Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-xs">
              <span className="chip">✅ 100% direto no WhatsApp — sem taxas sobre a venda</span>
              <span className="chip">⏱️ Menos de 60s</span>
              <span className="chip">🔗 Link compartilhável</span>
              <span className="chip">⏳ Expira automaticamente</span>
            </div>
          </div>

          {/* Mock do card (direita) */}
          <div className="relative">
            <div className="card p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <div className="flex items-center gap-2">
                  <span className="chip">🧠 Melhorado com IA</span>
                </div>
                <span className="chip" style={{background: "var(--accent)", color: "var(--accent-foreground)"}}>
                  ⏰ Expira em 23h 45min
                </span>
              </div>

              <div className="aspect-video w-full rounded-xl bg-zinc-800/40 border border-border grid place-items-center text-zinc-500">
                Prévia do anúncio
              </div>

              <div className="mt-4 text-sm">
                <div className="font-semibold">Marmita Caseira Completa</div>
                <div className="text-muted-foreground text-xs">
                  Centro, Rio de Janeiro • Entrega 30min
                </div>
                <div className="mt-1 text-primary font-semibold">R$ 18,50</div>
              </div>

              <div className="mt-4 flex gap-3">
                <button className="btn grow">WhatsApp</button>
                <button className="btn-secondary grow">Compartilhar</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PERFEITO PARA VOCÊ */}
      <section className="container mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-center text-2xl font-semibold">Perfeito para você</h2>
        <p className="text-center text-muted-foreground text-sm mt-2">
          Não importa o que você venda, o Qwip funciona
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {title: "Vendedores Autônomos", desc: "Roupas, cosméticos, artesanato. Venda no seu tempo.", ex: "Ex: roupas infantis, maquiagem, bijuterias."},
            {title: "Lojistas Locais", desc: "Promoções rápidas, liquidações, produtos sazonais.", ex: "Ex: açaí, farmácia, corte de cabelo."},
            {title: "Vendas Pessoais", desc: "Usados, freelas e serviços pontuais.", ex: "Ex: móveis usados, aulas particulares, pet sitting."},
          ].map((c) => (
            <div key={c.title} className="card p-6">
              <div className="text-primary mb-3">✔</div>
              <div className="font-semibold">{c.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{c.desc}</div>
              <div className="text-xs text-muted-foreground mt-2 opacity-80">{c.ex}</div>
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="container mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-center text-2xl font-semibold">Como funciona</h2>
        <p className="text-center text-muted-foreground text-sm mt-2">
          Em 3 passos simples, seu anúncio entra no ar com urgência real
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {n:"01", t:"Crie seu anúncio em 60s", d:"Foto, título, preço e endereço. Pronto."},
            {n:"02", t:"Compartilhe o link", d:"Envie no WhatsApp, redes sociais e onde quiser."},
            {n:"03", t:"Receba no WhatsApp", d:"O comprador fala direto com você, sem intermediação."},
          ].map(s => (
            <div key={s.n} className="card p-6">
              <div className="text-xs text-muted-foreground">{s.n}</div>
              <div className="font-semibold mt-1">{s.t}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* VITRINE DE ANÚNCIOS */}
      <section className="container mx-auto max-w-6xl px-6 py-10">
        <h2 className="text-center text-2xl font-semibold">Vitrine de Anúncios</h2>
        <p className="text-center text-muted-foreground text-sm mt-2">
          Veja como ficam os anúncios reais no Qwip
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {t:"Marmita Caseira Completa", p:"R$ 18,50", tag:"Últimas 4"},
            {t:"Manicure & Pedicure", p:"R$ 35,00", tag:"Expira hoje"},
            {t:"Açaí Premium c/ Frutas", p:"R$ 15,50", tag:"Expira em 45min"},
          ].map((a) => (
            <div key={a.t} className="card overflow-hidden">
              <div className="relative">
                <div className="aspect-[16/10] w-full bg-zinc-800/40 grid place-items-center text-zinc-500">
                  Foto do anúncio
                </div>
                <span className="absolute top-2 right-2 chip" style={{background:"var(--accent)", color:"var(--accent-foreground)"}}>
                  {a.tag}
                </span>
              </div>
              <div className="p-4">
                <div className="text-sm font-semibold">{a.t}</div>
                <div className="mt-1 text-primary font-semibold">{a.p}</div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button className="btn w-full">Falar no WhatsApp</button>
                  <button className="btn-secondary w-full">Compartilhar</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-8">
          <Link href="/vitrine" className="btn-secondary">Ver todos os anúncios</Link>
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="container mx-auto max-w-6xl px-6 py-10">
        <div className="flex justify-center">
          <span className="chip">📈 +1249 vendedores ativos neste mês</span>
        </div>
        <h2 className="text-center text-2xl font-semibold mt-4">O que dizem nossos usuários</h2>
        <p className="text-center text-muted-foreground text-sm mt-2">
          Resultados reais de pequenos negócios como você
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {n:"Fernanda Couto", r:"Marmitaria Caseira", q:"Vendi em 2h pelo Qwip! Publiquei a marmita às 10h, às 12h já tinha 3 clientes."},
            {n:"Carlos Mendes", r:"Assistência Técnica", q:"O que mais gosto é que expira automaticamente. Nunca mais anúncio velho na internet."},
            {n:"Mariana Silva", r:"Studio de Beleza", q:"Menos de 1 minuto para criar. Mais tempo vendendo, menos tempo perdendo com tecnologia."},
          ].map((d) => (
            <div key={d.n} className="card p-6">
              <div className="text-yellow-400">★★★★★</div>
              <p className="mt-3 text-sm text-muted-foreground">“{d.q}”</p>
              <div className="mt-4 text-sm">
                <div className="font-semibold">{d.n}</div>
                <div className="text-xs text-muted-foreground">{d.r}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto max-w-4xl px-6 py-10">
        <h2 className="text-center text-2xl font-semibold">Perguntas Frequentes</h2>
        <p className="text-center text-muted-foreground text-sm mt-2">
          Respondemos as principais dúvidas sobre o QWIP
        </p>

        <div className="mt-6 divide-y divide-border rounded-2xl border border-border overflow-hidden">
          {[
            ["Por que o anúncio expira automaticamente?",
             "Para gerar urgência real e manter sua vitrine sempre atual — sem anúncios velhos."],
            ["O Qwip é seguro? Como funciona a moderação?",
             "Aplicamos filtros automáticos e revisões humanas quando necessário."],
            ["Posso denunciar anúncios impróprios?",
             "Sim. Cada card tem um menu para sinalizar conteúdo. Agimos rapidamente."],
            ["Preciso instalar aplicativo?",
             "Não. É 100% web e funciona no seu celular."],
            ["Como o Qwip ganha dinheiro? Há taxas sobre vendas?",
             "Não cobramos taxa sobre sua venda. Temos planos com benefícios extras."],
            ["Posso cancelar minha assinatura a qualquer momento?",
             "Pode, sem fidelidade."],
            ["O que acontece se eu esquecer de renovar um anúncio importante?",
             "Você receberá lembretes e pode republicar em 1 clique."],
            ["Funciona para qualquer tipo de produto/serviço?",
             "Sim, desde autônomos até pequenos comércios locais."],
          ].map(([q, a], i) => (
            <details key={i} className="group open:bg-card">
              <summary className="cursor-pointer list-none select-none px-5 py-4 text-sm font-medium flex items-center justify-between">
                {q}
                <span className="ml-4 text-muted-foreground group-open:rotate-180 transition">⌄</span>
              </summary>
              <div className="px-5 pb-4 text-sm text-muted-foreground">{a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="container mx-auto max-w-6xl px-6 py-14">
        <div className="card p-8 text-center">
          <h3 className="text-xl font-semibold">Pronto para vender mais rápido?</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Junte-se a centenas de vendedores que já usam urgência real.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link href="/dashboard" className="btn">Começar Agora — Grátis</Link>
            <Link href="/vitrine" className="btn-secondary">Ver Mais Exemplos</Link>
          </div>
        </div>

        <footer className="text-center text-xs text-muted-foreground mt-6">
          Qwip © 2025 — Feito com ❤️ • <Link href="/termos" className="underline">Termos de Uso</Link> •{" "}
          <Link href="/privacidade" className="underline">Política de Privacidade</Link> •{" "}
          <Link href="/contato" className="underline">Contato</Link>
        </footer>
      </section>
    </main>
  );
}
