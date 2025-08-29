// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative">
      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* halo/gradiente */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-[-20%] h-[700px] w-[900px] -translate-x-1/2 rounded-full blur-[120px]"
               style={{ background:
                 "radial-gradient(40% 40% at 50% 50%, rgba(19,255,167,0.18) 0%, rgba(19,255,167,0.06) 40%, transparent 70%)"
               }} />
        </div>

        <div className="container max-w-6xl pt-20 pb-12 lg:pt-24 lg:pb-16">
          {/* Top chips */}
          <div className="flex items-center gap-3 mb-6">
            <span className="badge">Powered by AI</span>
            <span className="badge">Menos de 60s para publicar</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Texto */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold leading-tight">
                Anúncios rápidos.<br />
                <span className="text-primary">Link direto pro</span><br />
                WhatsApp.
              </h1>

              <p className="mt-5 text-[15px] text-textMuted max-w-xl">
                Publique em menos de 60 segundos. O anúncio expira automaticamente,
                gerando urgência e mantendo a vitrine sempre atual.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/dashboard" className="btn-primary">Criar Anúncio Grátis</Link>
                <Link href="/vitrine" className="btn-outline">Ver Vitrine de Anúncios</Link>
              </div>

              {/* chips inferiores */}
              <div className="mt-8 flex flex-wrap gap-3 text-sm">
                <span className="badge">100% direto no WhatsApp</span>
                <span className="badge">Menos de 60s</span>
                <span className="badge">Link compartilhável</span>
                <span className="badge">Expira automaticamente</span>
              </div>
            </div>

            {/* Card preview do anúncio (skeleton) */}
            <div className="card shadow-glow p-4">
              <div className="flex items-center justify-between text-xs text-textMuted px-2 pb-2">
                <div className="inline-flex items-center gap-2">
                  <span className="badge">Melhorado com IA</span>
                </div>
                <div className="badge">⏳ Expira em 23h 45min</div>
              </div>

              <div className="rounded-lg bg-[#0A0F0E] border border-[--border] h-[260px] grid place-items-center text-textMuted">
                Prévia do anúncio
              </div>

              <div className="px-2 pt-4">
                <h3 className="text-[15px] font-semibold">Marmita Caseira Completa</h3>
                <p className="text-xs text-textMuted">Centro, Rio de Janeiro • Entrega 30min</p>
                <div className="mt-2 font-semibold text-primary">R$ 18,50</div>
              </div>

              <div className="flex gap-2 mt-4">
                <button className="btn-primary flex-1">WhatsApp</button>
                <button className="btn-outline flex-1">Compartilhar</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PERFEITO PARA VOCÊ */}
      <section className="container max-w-6xl py-14 lg:py-20">
        <h2 className="text-3xl lg:text-[32px] font-extrabold text-center mb-2">Perfeito para você</h2>
        <p className="text-center text-textMuted mb-10">Não importa o que você venda, o Qwip funciona.</p>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              t: "Vendedores Autônomos",
              d: "Roupas, cosméticos, artesanato. Venda no seu tempo.\nEx: roupas infantis, maquiagem, bijuterias.",
            },
            {
              t: "Lojistas Locais",
              d: "Promoções rápidas, liquidações, produtos sazonais.\nEx: açaí, farmácia, corte de cabelo.",
            },
            {
              t: "Vendas Pessoais",
              d: "Usados, freelas e serviços pontuais. Ex: móveis usados, aulas, pet sitting.",
            },
          ].map((item) => (
            <div key={item.t} className="card p-5">
              <div className="mb-3 text-primary">✔</div>
              <h3 className="font-semibold mb-1">{item.t}</h3>
              <p className="whitespace-pre-line text-sm text-textMuted">{item.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="container max-w-6xl py-14 lg:py-20">
        <h2 className="text-3xl lg:text-[32px] font-extrabold text-center mb-2">Como funciona</h2>
        <p className="text-center text-textMuted mb-10">
          Em 3 passos simples, seu anúncio entra no ar com urgência real
        </p>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            { n: "01", t: "Crie seu anúncio em 60s", d: "Foto, título, preço e endereço. Pronto." },
            { n: "02", t: "Compartilhe o link", d: "Envie no WhatsApp, redes sociais e onde quiser." },
            { n: "03", t: "Receba no WhatsApp", d: "O comprador fala direto com você, sem intermediação." },
          ].map((s) => (
            <div key={s.n} className="card p-5">
              <div className="text-textMuted text-sm mb-2">{s.n}</div>
              <h3 className="font-semibold mb-1">{s.t}</h3>
              <p className="text-sm text-textMuted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PLANOS */}
      <section className="container max-w-6xl py-14 lg:py-20">
        <h2 className="text-3xl lg:text-[32px] font-extrabold text-center mb-2">Planos</h2>
        <p className="text-center text-textMuted mb-10">Do primeiro anúncio ao catálogo da sua loja</p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* FREE */}
          <div className="card p-6 flex flex-col">
            <div className="text-sm text-textMuted mb-3">Comece já</div>
            <h3 className="text-xl font-bold mb-1">FREE</h3>
            <div className="text-2xl font-extrabold mb-4">R$0</div>
            <ul className="text-sm text-textMuted space-y-2 mb-6">
              <li>1 anúncio ativo</li>
              <li>3 fotos por anúncio</li>
              <li>Expira em 24h</li>
              <li>0 boosts/mês</li>
              <li>Analytics básico</li>
            </ul>
            <Link href="/dashboard" className="btn-outline mt-auto">Criar grátis</Link>
          </div>

          {/* LITE */}
          <div className="card p-6 border-primary/30 shadow-glow flex flex-col">
            <div className="text-sm text-textMuted mb-3">Popular</div>
            <h3 className="text-xl font-bold mb-1">LITE</h3>
            <div className="text-2xl font-extrabold mb-4">R$49,90/mês</div>
            <ul className="text-sm text-textMuted space-y-2 mb-6">
              <li>Até 100 anúncios/mês</li>
              <li>8 fotos por anúncio</li>
              <li>Expira em 48h</li>
              <li>1 boost/mês</li>
              <li>Vitrine com filtros</li>
            </ul>
            <button className="btn-primary mt-auto">Assinar LITE</button>
          </div>

          {/* PRO */}
          <div className="card p-6 flex flex-col">
            <div className="text-sm text-textMuted mb-3">Para quem acelera</div>
            <h3 className="text-xl font-bold mb-1">PRO</h3>
            <div className="text-2xl font-extrabold mb-4">R$99,90/mês</div>
            <ul className="text-sm text-textMuted space-y-2 mb-6">
              <li>Anúncios ilimitados</li>
              <li>Prioridade na vitrine</li>
              <li>Expira em 72h</li>
              <li>2 boosts/mês</li>
              <li>Dashboard avançado</li>
            </ul>
            <button className="btn-outline mt-auto">Assinar PRO</button>
          </div>
        </div>
      </section>

      {/* Rodapé simples */}
      <footer className="py-10 text-center text-xs text-textMuted">
        Qwip © 2025 — Feito com ❤️
      </footer>
    </main>
  );
}
