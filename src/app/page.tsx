// src/app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B0F0D] text-slate-200">
      {/* BG blobs / glow */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-[420px] w-[420px] rounded-full bg-emerald-500/15 blur-[120px]" />
        <div className="absolute -right-40 top-40 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      {/* NAV mínimo (usa o que você já tem) */}
      <header className="sticky top-0 z-20 border-b border-white/5 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="inline-grid h-7 w-7 place-items-center rounded-md bg-white text-black">Q</span>
            <span className="tracking-tight">Qwip</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link href="/vitrine" className="text-slate-300 hover:text-white">Vitrine</Link>
            <Link href="/dashboard" className="text-slate-300 hover:text-white">Dashboard</Link>
            <Link
              href="/#planos"
              className="rounded-lg bg-emerald-500 px-3 py-1.5 font-medium text-black hover:bg-emerald-400"
            >
              Começar grátis
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 md:grid-cols-2 md:gap-14 md:px-8 md:py-24">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                Powered by AI
              </span>
              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs text-amber-300">
                ⏱️ Menos de 60s para publicar
              </span>
            </div>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl">
              Anúncios rápidos.
              <br />
              <span className="text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text">
                Link direto pro WhatsApp.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-slate-300">
              Publique em menos de 60 segundos. O anúncio expira automaticamente,
              gerando urgência e mantendo a vitrine sempre atual.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 font-medium text-black hover:bg-emerald-400"
              >
                ⚡ Criar Anúncio Grátis
              </Link>
              <Link
                href="/vitrine"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 font-medium text-white hover:bg-white/10"
              >
                Ver Vitrine de Anúncios
              </Link>
            </div>

            {/* bullets */}
            <div className="mt-10 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                "100% direto no WhatsApp",
                "Menos de 60s",
                "Link compartilhável",
                "Expira automaticamente",
              ].map((t) => (
                <div
                  key={t}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300"
                >
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Preview Card */}
          <div className="mx-auto w-full max-w-xl">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur">
              <div className="flex items-center justify-between px-2 pb-3">
                <div className="text-xs text-slate-400">QWIP Vendas</div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="rounded bg-emerald-500/15 px-2 py-0.5 text-emerald-300">🤖 Melhorado com IA</span>
                  <span className="rounded bg-amber-500/10 px-2 py-0.5 text-amber-300">⏳ Expira em 23h 45min</span>
                </div>
              </div>

              <div className="aspect-video w-full rounded-xl border border-white/10 bg-white/5" />
              <div className="mt-3 px-2 text-sm">
                <div className="font-medium text-slate-200">Marmita Caseira Completa</div>
                <div className="text-xs text-slate-400">Centro, Rio de Janeiro • Entrega 30min</div>
              </div>

              <div className="mt-4 flex items-center justify-between px-2 text-sm">
                <span className="font-semibold text-emerald-300">R$ 18,50</span>
                <div className="flex gap-2">
                  <button className="rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-black hover:bg-emerald-400">
                    WhatsApp
                  </button>
                  <button className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white hover:bg-white/10">
                    Compartilhar
                  </button>
                </div>
              </div>
            </div>
            {/* glow */}
            <div className="mx-auto mt-6 h-24 w-3/4 rounded-full bg-emerald-500/10 blur-2xl" />
          </div>
        </div>
      </section>

      {/* Perfeito para você */}
      <section className="border-t border-white/5 bg-black/20 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-center text-3xl font-bold text-white md:text-4xl">
            Perfeito para você
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-300">
            Não importa o que você venda, o Qwip funciona.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {[
              {
                title: "Vendedores Autônomos",
                desc:
                  "Roupas, cosméticos, artesanato. Venda no seu tempo. Ex: roupas infantis, maquiagem, bijuterias.",
              },
              {
                title: "Lojistas Locais",
                desc:
                  "Promoções rápidas, liquidações, produtos sazonais. Ex: açai, farmácia, corte de cabelo.",
              },
              {
                title: "Vendas Pessoais",
                desc:
                  "Usados, freelas e serviços pontuais. Ex: móveis usados, aulas particulares, pet sitting.",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]"
              >
                <div className="mb-3 inline-grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/15 text-emerald-300">
                  ✓
                </div>
                <h3 className="text-lg font-semibold text-white">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-center text-3xl font-bold text-white md:text-4xl">
            Como funciona
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-300">
            Em 3 passos simples, seu anúncio entra no ar com urgência real
          </p>

          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Crie seu anúncio em 60s",
                d: "Foto, título, preço e endereço. Pronto.",
              },
              {
                n: "02",
                t: "Compartilhe o link",
                d: "Envie no WhatsApp, redes sociais e onde quiser.",
              },
              {
                n: "03",
                t: "Receba no WhatsApp",
                d: "O comprador fala direto com você, sem intermediação.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="rounded-2xl border border-white/10 bg-white/5 p-6"
              >
                <div className="mb-3 text-sm text-slate-400">{s.n}</div>
                <h3 className="text-lg font-semibold text-white">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vitrine de Anúncios (mock simples) */}
      <section className="border-t border-white/5 bg-black/20 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-center text-3xl font-bold text-white md:text-4xl">
            Vitrine de Anúncios
          </h2>
        </div>
        <div className="mx-auto mt-10 grid max-w-7xl grid-cols-1 gap-6 px-4 md:grid-cols-3 md:px-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/5 p-3"
            >
              <div className="aspect-[4/3] w-full rounded-xl border border-white/10 bg-white/5" />
              <div className="px-1 pt-3">
                <div className="mb-1 text-sm text-slate-400">Vila Madalena, SP</div>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Marmita Caseira Completa</div>
                  <div className="text-emerald-300">R$ 18,50</div>
                </div>
              </div>
              <div className="mt-3 flex gap-2 px-1">
                <button className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-black hover:bg-emerald-400">
                  Falar no WhatsApp
                </button>
                <button className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10">
                  Ver mais
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-7xl px-4 text-center md:px-8">
          <Link
            href="/vitrine"
            className="inline-block rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white hover:bg-white/10"
          >
            Ver todos os anúncios
          </Link>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-8">
          <h2 className="text-center text-3xl font-bold text-white md:text-4xl">
            Planos
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-300">
            Do primeiro anúncio ao catálogo da sua loja
          </p>

          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-4">
            {[
              {
                tag: "Comece já",
                name: "FREE",
                price: "R$0",
                cta: "Criar grátis",
                features: [
                  "1 anúncio ativo",
                  "3 fotos por anúncio",
                  "Expira em 24h",
                  "0 boosts/mês",
                  "Analytics básico",
                ],
                highlight: false,
              },
              {
                tag: "Popular",
                name: "LITE",
                price: "R$49,90/mês",
                cta: "Assinar LITE",
                features: [
                  "Até 100 anúncios/mês",
                  "8 fotos por anúncio",
                  "Expira em 48h",
                  "1 boost/mês",
                  "Vitrine com filtros",
                ],
                highlight: true,
              },
              {
                tag: "Para quem acelera",
                name: "PRO",
                price: "R$99,90/mês",
                cta: "Assinar PRO",
                features: [
                  "Anúncios ilimitados",
                  "Prioridade na vitrine",
                  "Expira em 72h",
                  "2 boosts/mês",
                  "Dashboard avançado",
                ],
                highlight: false,
              },
              {
                tag: "Para equipes",
                name: "BUSINESS",
                price: "R$199,90/mês",
                cta: "Assinar BUSINESS",
                features: [
                  "Equipe/multi-usuário",
                  "Boosts e destaque",
                  "Expira em 72h",
                  "Vitrine priorizada",
                  "Integrações avançadas",
                ],
                highlight: false,
              },
            ].map((p) => (
              <div
                key={p.name}
                className={`relative rounded-2xl border bg-white/5 p-6 ${
                  p.highlight
                    ? "border-emerald-400/30 shadow-[0_0_0_1px_rgba(16,185,129,0.25)_inset]"
                    : "border-white/10"
                }`}
              >
                <div className="mb-4 text-xs text-slate-400">{p.tag}</div>
                <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                <div className="mt-1 text-2xl font-extrabold text-white">{p.price}</div>

                <ul className="mt-5 space-y-2 text-sm text-slate-300">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-[6px] inline-block h-2 w-2 rounded-full bg-emerald-400" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`mt-6 w-full rounded-lg px-4 py-2 font-semibold ${
                    p.highlight
                      ? "bg-emerald-500 text-black hover:bg-emerald-400"
                      : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER simples */}
      <footer className="border-t border-white/5 py-10 text-center text-sm text-slate-400">
        Qwip © {new Date().getFullYear()} — Feito com ❤️
      </footer>
    </main>
  );
}
