// src/app/page.tsx
import Link from "next/link";

export const metadata = {
  title: "Qwip — Venda mais no WhatsApp",
  description:
    "Crie sua vitrine e venda pelo WhatsApp. Planos que cabem no bolso, comece grátis e evolua quando fizer sentido.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* NAVBAR */}
      <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xl font-semibold tracking-tight"
            aria-label="Qwip"
          >
            {/* Logo simples (inline SVG) */}
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-black text-white">Q</span>
            <span className="select-none">Qwip</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/vitrine"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Vitrine
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              Dashboard
            </Link>
            <Link
              href="/vitrine"
              className="ml-2 rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white hover:bg-black/90"
            >
              Começar grátis
            </Link>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <section className="relative">
        {/* “glow” decorativo sutil */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-24 z-0 flex justify-center"
        >
          <div className="h-56 w-[36rem] rounded-full bg-black/5 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-8 pt-16 md:pb-16 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-green-500 text-white">✓</span>
              MVP online
            </div>

            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Venda mais no WhatsApp com a sua{" "}
              <span className="bg-gradient-to-r from-black to-slate-500 bg-clip-text text-transparent">
                vitrine Qwip
              </span>
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-slate-600 sm:text-lg">
              Crie sua vitrine, compartilhe seus produtos e feche pedidos direto
              no WhatsApp. Comece grátis e evolua quando fizer sentido.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/vitrine"
                className="inline-flex items-center justify-center rounded-lg bg-black px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-black/90"
              >
                Ver Vitrine
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm hover:bg-slate-50"
              >
                Abrir Dashboard
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 text-xs text-slate-500 sm:flex sm:flex-wrap sm:justify-center">
              <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1">
                Sem cartão para começar
              </span>
              <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1">
                Cancelamento a qualquer momento
              </span>
              <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1">
                Foco em WhatsApp
              </span>
              <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1">
                Em evolução contínua
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS */}
      <section className="border-t bg-white">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Planos que cabem no bolso
            </h2>
            <p className="mt-2 text-pretty text-slate-600">
              Comece grátis e evolua quando fizer sentido. Cancele quando quiser.
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* FREE */}
            <PricingCard
              badge="Comece já"
              title="FREE"
              price="R$0"
              features={[
                "Até 10 anúncios/mês",
                "Link do WhatsApp",
                "Vitrine básica",
              ]}
              ctaLabel="Começar grátis"
              ctaHref="/vitrine"
            />

            {/* LITE */}
            <PricingCard
              badge="Popular"
              title="LITE"
              price="R$49,90/mês"
              features={[
                "Até 100 anúncios/mês",
                "Vitrine com filtros",
                "Suporte por email",
              ]}
              ctaLabel="Assinar LITE"
              ctaHref="#"
              highlight
            />

            {/* PRO */}
            <PricingCard
              badge="Para quem acelera"
              title="PRO"
              price="R$99,90/mês"
              features={[
                "Anúncios ilimitados",
                "Prioridade na vitrine",
                "Dashboard completo",
              ]}
              ctaLabel="Assinar PRO"
              ctaHref="#"
            />

            {/* BUSINESS */}
            <PricingCard
              badge="Para equipes"
              title="BUSINESS"
              price="R$199,90/mês"
              features={[
                "Equipe/multi-usuário",
                "Boosts e destaque",
                "Integrações avançadas",
              ]}
              ctaLabel="Assinar BUSINESS"
              ctaHref="#"
            />
          </div>

          <p className="mt-8 text-center text-xs text-slate-500">
            * Preços fictícios para o MVP. Sujeitos a alterações.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row">
          <p>
            Qwip © {new Date().getFullYear()} · Feito com{" "}
            <span aria-hidden>❤️</span>
          </p>
          <div className="flex items-center gap-4">
            <Link href="/termos" className="hover:text-slate-700">
              Termos
            </Link>
            <span className="text-slate-300">•</span>
            <Link href="/privacidade" className="hover:text-slate-700">
              Privacidade
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* =========================
   Componente de card (local)
   ========================= */
type PricingProps = {
  badge?: string;
  title: string;
  price: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  highlight?: boolean;
};

function PricingCard({
  badge,
  title,
  price,
  features,
  ctaLabel,
  ctaHref,
  highlight,
}: PricingProps) {
  return (
    <div
      className={[
        "relative flex flex-col rounded-2xl border bg-white p-5 shadow-sm",
        highlight ? "border-slate-900 shadow-md" : "border-slate-200",
      ].join(" ")}
    >
      {badge ? (
        <span
          className={[
            "absolute -top-2 left-4 inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
            highlight
              ? "bg-black text-white"
              : "border border-slate-200 bg-white text-slate-700",
          ].join(" ")}
        >
          {badge}
        </span>
      ) : null}

      <div className="mt-3">
        <h3
          className={[
            "text-lg font-bold",
            highlight ? "text-slate-900" : "text-slate-800",
          ].join(" ")}
        >
          {title}
        </h3>
        <p className="mt-1 text-2xl font-extrabold tracking-tight">{price}</p>
      </div>

      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-slate-400" />
            {f}
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <Link
          href={ctaHref}
          className={[
            "inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold",
            highlight
              ? "bg-black text-white hover:bg-black/90"
              : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
          ].join(" ")}
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
