// src/app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 -z-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-10"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 0%, rgba(32,209,119,0.20) 0%, rgba(32,209,119,0.00) 60%), radial-gradient(40% 40% at 80% 20%, rgba(255,200,87,0.18) 0%, rgba(255,200,87,0.00) 60%)",
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
          <div className="chip border border-border/60 bg-muted/40 text-[12px] md:text-xs">
            Venda hoje pelo WhatsApp • link expira por tempo
          </div>

          <h1 className="hero-title mt-5 tracking-tight">
            Anúncios rápidos que{" "}
            <span className="whitespace-nowrap text-primary">viram conversas</span>
            <br className="hidden sm:block" />
            no WhatsApp
          </h1>

          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Crie um link em 30s, compartilhe e receba leads. Sem cadastro demorado,
            sem complicação. Boost opcional para aparecer primeiro.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/criar" className="btn">
              Criar anúncio grátis
            </Link>
            <Link href="/#planos" className="btn-secondary border border-border/60">
              Ver planos
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-primary" />
              Link expira em até 72h
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-accent" />
              Vitrine por cidade/bairro
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-zinc-500" />
              Sem taxas sobre a venda
            </span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 pb-10 md:px-6 md:pb-16">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { t: "Crie em 30s", d: "Título, preço, fotos e pronto. Link pronto para compartilhar." },
            { t: "Link que expira", d: "Controle de urgência: 24–72h ou por estoque." },
            { t: "Vitrine local", d: "Compradores por cidade/bairro primeiro." },
            { t: "Boost opcional", d: "Pague para subir no topo quando precisar vender rápido." },
          ].map((f, i) => (
            <div key={i} className="card p-5">
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/70">
                <div className="h-3 w-3 rounded-[2px] bg-primary" />
              </div>
              <h3 className="text-base font-semibold">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PLANOS RESUMO */}
      <section id="planos" className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-14">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { nome: "FREE", preco: "R$ 0", desc: "Anúncios básicos com selo opcional." },
            { nome: "LITE", preco: "R$ 49,90/mês", desc: "Mais destaque e métricas simples." },
            { nome: "PRO", preco: "R$ 99,90/mês", desc: "Vitrine priorizada e automações." },
            { nome: "BUSINESS", preco: "R$ 199,90/mês", desc: "Multi-loja, times e relatórios." },
          ].map((p, i) => (
            <div key={i} className="card p-5">
              <div className="text-xs text-muted-foreground">{p.nome}</div>
              <div className="mt-1 text-xl font-bold tracking-tight">{p.preco}</div>
              <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
              <Link href={`/dashboard/${p.nome.toLowerCase()}`} className="btn mt-4 w-full">
                Acessar {p.nome}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* DEPOIMENTOS */}
      <section className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-12">
        <h2 className="text-2xl font-semibold tracking-tight">Quem vendeu com o Qwip</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            { nome: "Carla • Brechó Zona Sul", txt: "Postei às 10h e às 15h já tinha 12 conversas. Vendi 3 peças no mesmo dia." },
            { nome: "Diego • Auto Peças Centro", txt: "O boost valeu muito. Fiquei no topo e acabou o estoque rápido." },
            { nome: "Nayara • Decor São José", txt: "Gostei do link expirar. Cria urgência e me livra de ficar respondendo depois." },
          ].map((r, i) => (
            <div key={i} className="card p-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/70 to-accent/70" />
                <div className="text-sm font-medium">{r.nome}</div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-6">“{r.txt}”</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-5xl px-4 pb-16 md:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">Perguntas frequentes</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {[
            { q: "O Qwip cobra taxa sobre a venda?", a: "Não. O Qwip gera leads e conversas no seu WhatsApp. Você fecha a venda direto." },
            { q: "Por quanto tempo o link vale?", a: "Você escolhe: 24, 48 ou 72 horas. Também dá para encerrar por estoque." },
            { q: "O que é o Boost?", a: "Um impulso pago para seu anúncio aparecer primeiro nas vitrines locais por um período." },
            { q: "Consigo medir resultados?", a: "Sim. Contamos visualizações, cliques, conversas iniciadas e origem (orgânico/boost)." },
          ].map((f, i) => (
            <details key={i} className="card group p-4 open:ring-1 open:ring-primary/20">
              <summary className="cursor-pointer list-none text-sm font-semibold">
                {f.q}
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground md:flex-row md:px-6">
          <div>© {new Date().getFullYear()} Qwip</div>
          <nav className="flex items-center gap-5">
            <Link href="/termos" className="hover:text-foreground">Termos</Link>
            <Link href="/privacidade" className="hover:text-foreground">Privacidade</Link>
            <a
              href="https://wa.me/5500000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              Fale no WhatsApp
            </a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
