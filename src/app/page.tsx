// src/app/page.tsx
import Link from "next/link";

/**
 * Home (Landing) — versão dark, inspirada no Figma “QWIP – Venda HOJE”
 * - Tudo em Tailwind, sem libs extras
 * - Cores e gradientes inline (não precisa editar globals/tailwind.config)
 * - Estrutura: Hero -> Perfeito p/ você -> Como funciona -> Vitrine -> Planos -> CTA final
 */

export default function Home() {
  return (
    <main className="min-h-screen w-full overflow-hidden bg-[#0B0F12] text-white">
      {/* BG decor (radial + “orbes”) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 600px at 70% -100px, rgba(34,197,94,0.20), rgba(34,197,94,0) 40%), radial-gradient(900px 500px at -20% 10%, rgba(59,130,246,0.18), rgba(59,130,246,0) 40%)",
        }}
      />
      <Dots />

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-5 pt-16 sm:pt-20 md:pt-24 lg:pt-28">
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/10">
              {/* logo minimal */}
              <span className="text-base font-semibold text-white">Q</span>
            </div>
            <span className="text-sm font-medium text-white/70">QWIP</span>
          </div>

          <div className="hidden gap-3 sm:flex">
            <Link
              href="/vitrine"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/80 hover:bg-white/5"
            >
              Vitrine
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/80 hover:bg-white/5"
            >
              Dashboard
            </Link>
            <Link
              href="/#planos"
              className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-black hover:bg-emerald-400"
            >
              Começar grátis
            </Link>
          </div>
        </header>

        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-12 lg:gap-16">
          {/* Texto à esquerda */}
          <div>
            <div className="mb-4 flex items-center gap-2 text-xs text-white/70">
              <Badge>Powered by AI</Badge>
              <Badge tone="amber">Menos de 60s para publicar</Badge>
            </div>

            <h1 className="mb-4 text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl">
              Anúncios rápidos. <br />
              <span className="text-emerald-400">Link direto pro WhatsApp.</span>
            </h1>

            <p className="mb-7 max-w-xl text-base text-white/70 sm:text-lg">
              Publique em menos de 60 segundos. O anúncio expira automaticamente,
              gerando urgência e mantendo a vitrine sempre atual.
            </p>

            <div className="mb-5 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400"
              >
                <BoltIcon />
                Criar Anúncio Grátis
              </Link>

              <Link
                href="/vitrine"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/0 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
              >
                Ver Vitrine de Anúncios
              </Link>
            </div>

            {/* badges secundárias */}
            <ul className="flex flex-wrap gap-2 text-xs text-white/50">
              <Chip>100% direto no WhatsApp — sem taxas sobre a venda</Chip>
              <Chip>Menos de 60s</Chip>
              <Chip>Link compartilhável</Chip>
              <Chip>Expira automaticamente</Chip>
            </ul>
          </div>

          {/* Preview à direita (card simulado) */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -left-5 -top-5 h-8 w-8 rounded-full bg-emerald-500/20 blur-xl" />
            <div className="absolute -right-5 -bottom-5 h-8 w-8 rounded-full bg-sky-500/20 blur-xl" />

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-2xl ring-1 ring-white/10">
              <div className="border-b border-white/10 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs text-white/70">
                  <span className="inline-flex h-5 items-center gap-1 rounded-full bg-white/5 px-2">
                    <SparkIcon className="opacity-80" />
                    Melhorado com IA
                  </span>
                  <span className="inline-flex h-5 items-center gap-1 rounded-full bg-amber-500/10 px-2 text-amber-300">
                    ⏳ Expira em 23h 45min
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white">QWIP Vendas</h3>
              </div>

              <div className="p-4">
                <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10">
                  {/* Imagem fictícia */}
                  <div className="flex h-full items-center justify-center text-white/50">
                    Prévia do anúncio
                  </div>
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-semibold text-white">Marmita Caseira Completa</span>
                    <span className="text-emerald-400">R$ 18,50</span>
                  </div>
                  <p className="text-xs text-white/60">Centro, Rio de Janeiro • Entrega 30min</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <a
                    href="#"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-black hover:bg-emerald-400"
                  >
                    WhatsApp
                  </a>
                  <a
                    href="#"
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/5"
                  >
                    Compartilhar
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Perfeito para você */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:py-20">
        <SectionTitle
          title="Perfeito para você"
          subtitle="Não importa o que você vende, o QWIP funciona"
        />

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <DarkCard
            icon={<BagIcon />}
            title="Vendedores Autônomos"
            text="Roupas, cosméticos, artesanato. Venda no seu tempo."
            foot="Ex.: roupas infantis, maquiagem, bijuterias."
          />
          <DarkCard
            icon={<StoreIcon />}
            title="Lojistas Locais"
            text="Promoções rápidas, liquidações, produtos sazonais."
            foot="Ex.: açaí, marmitas, corte de cabelo."
          />
          <DarkCard
            icon={<CartIcon />}
            title="Vendas Pessoais"
            text="Usados, freelas e serviços pontuais."
            foot="Ex.: móveis usados, aulas particulares, pet sitting."
          />
        </div>
      </section>

      {/* Como funciona */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:py-20">
        <SectionTitle title="Como funciona" subtitle="Em 3 passos simples, seu anúncio entra no ar" />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <StepCard
            icon={<ClockIcon />}
            title="Crie seu anúncio em 60s"
            text="Foto, título, preço e endereço. Pronto."
          />
          <StepCard
            icon={<LinkIcon />}
            title="Compartilhe o link"
            text="Envie no WhatsApp, redes sociais e onde quiser."
          />
          <StepCard
            icon={<WhatsappIcon />}
            title="Receba no WhatsApp"
            text="O comprador fala direto com você, sem intermediação."
          />
        </div>
      </section>

      {/* Vitrine (preview estático) */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:py-20">
        <SectionTitle title="Vitrine de Anúncios" subtitle="Veja como ficam os anúncios no Qwip" />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <AdCard title="Marmita Caseira Completa" city="Vila Madalena, SP" price="R$ 18,50" />
          <AdCard title="Manicure & Pedicure" city="Centro, Rio de Janeiro" price="R$ 35,00" />
          <AdCard title="Açaí Premium c/ Frutas" city="Copacabana, RJ" price="R$ 15,50" />
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/vitrine"
            className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
          >
            Ver todos os anúncios
          </Link>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="mx-auto max-w-7xl px-5 py-16 sm:py-20">
        <SectionTitle title="Planos" subtitle="Do primeiro anúncio ao catálogo da sua loja" />

        <div className="mt-10 grid gap-5 md:grid-cols-4">
          <Plan
            ribbon="Comece já"
            name="FREE"
            price="R$0"
            items={[
              "1 anúncio ativo",
              "3 fotos por anúncio",
              "Expira em 24h",
              "0 boosts/mês",
              "Analytics básico",
            ]}
            ctaText="Criar grátis"
            ctaHref="/dashboard"
            muted
          />

          <Plan
            ribbon="Popular"
            name="LITE"
            price="R$49,90/mês"
            items={[
              "Até 100 anúncios/mês",
              "8 fotos por anúncio",
              "Expira em 48h",
              "1 boost/mês",
              "Vitrine com filtros",
            ]}
            ctaText="Assinar LITE"
            ctaHref="/#"
            highlight
          />

          <Plan
            ribbon="Para quem acelera"
            name="PRO"
            price="R$99,90/mês"
            items={[
              "Anúncios ilimitados",
              "Prioridade na vitrine",
              "Dashboard avançado",
              "2 boosts/mês",
              "Vitrine priorizada",
            ]}
            ctaText="Assinar PRO"
            ctaHref="/#"
          />

          <Plan
            ribbon="Para equipes"
            name="BUSINESS"
            price="R$199,90/mês"
            items={[
              "Equipe/multi-usuário",
              "Boosts e destaque",
              "Integrações avançadas",
              "Catálogo/API",
              "Branding e vitrine premium",
            ]}
            ctaText="Assinar BUSINESS"
            ctaHref="/#"
            muted
          />
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-7xl px-5 pb-24 pt-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center ring-1 ring-white/10 sm:p-10">
          <h3 className="mb-2 text-2xl font-bold sm:text-3xl">Pronto pra vender hoje?</h3>
          <p className="mx-auto mb-6 max-w-2xl text-white/70">
            Crie sua vitrine, compartilhe e feche no WhatsApp. Comece de graça e evolua quando fizer sentido.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400"
          >
            Começar agora
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#0B0F12]/80 py-8 text-center text-xs text-white/50">
        Qwip © {new Date().getFullYear()} — Feito com ❤️
      </footer>
    </main>
  );
}

/* =============== Componentes utilitários (inline) =============== */

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "default" | "amber";
}) {
  const base = "inline-flex h-6 items-center rounded-full px-2 text-[11px] font-medium";
  const styles =
    tone === "amber"
      ? "bg-amber-500/10 text-amber-300 ring-1 ring-amber-400/20"
      : "bg-white/5 text-white/80 ring-1 ring-white/10";
  return <span className={`${base} ${styles}`}>{children}</span>;
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/0 px-2 py-1 text-white/60">
      <CheckIcon className="opacity-70" /> {children}
    </li>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <h2 className="text-3xl font-extrabold sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-2 text-white/70">{subtitle}</p>}
    </div>
  );
}

function DarkCard({
  icon,
  title,
  text,
  foot,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  foot?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 ring-1 ring-white/10">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
        {icon}
      </div>
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      <p className="mb-2 text-sm text-white/70">{text}</p>
      {foot && <p className="text-xs text-white/40">{foot}</p>}
    </div>
  );
}

function StepCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 ring-1 ring-white/10">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-300">
        {icon}
      </div>
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-white/70">{text}</p>
    </div>
  );
}

function AdCard({ title, city, price }: { title: string; city: string; price: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] ring-1 ring-white/10">
      <div className="aspect-[4/3] w-full bg-white/5" />
      <div className="p-4">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-semibold text-white">{title}</span>
          <span className="text-emerald-400">{price}</span>
        </div>
        <p className="mb-3 text-xs text-white/60">{city}</p>
        <a
          href="#"
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-black hover:bg-emerald-400"
        >
          Falar no WhatsApp
        </a>
      </div>
    </div>
  );
}

function Plan({
  ribbon,
  name,
  price,
  items,
  ctaText,
  ctaHref,
  highlight,
  muted,
}: {
  ribbon?: string;
  name: string;
  price: string;
  items: string[];
  ctaText: string;
  ctaHref: string;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={[
        "relative flex flex-col rounded-2xl border p-5 ring-1",
        highlight
          ? "border-emerald-500/30 bg-emerald-500/[0.04] ring-emerald-500/20"
          : "border-white/10 bg-white/[0.03] ring-white/10",
      ].join(" ")}
    >
      {ribbon && (
        <span
          className={[
            "pointer-events-none absolute -top-2 left-4 rounded-full px-2 py-0.5 text-[11px] font-medium",
            highlight ? "bg-emerald-500 text-black" : "bg-white/10 text-white/80",
          ].join(" ")}
        >
          {ribbon}
        </span>
      )}

      <h4 className="mt-3 text-sm text-white/50">{name}</h4>
      <div className="mb-4 text-2xl font-extrabold">{price}</div>

      <ul className="mb-5 flex flex-1 flex-col gap-2 text-sm">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2 text-white/80">
            <CheckIcon className="mt-0.5 shrink-0 text-emerald-400" />
            <span className={muted ? "text-white/60" : ""}>{it}</span>
          </li>
        ))}
      </ul>

      <Link
        href={ctaHref}
        className={[
          "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold",
          highlight
            ? "bg-emerald-500 text-black hover:bg-emerald-400"
            : "border border-white/10 text-white hover:bg-white/5",
        ].join(" ")}
      >
        {ctaText}
      </Link>
    </div>
  );
}

/* =============== Ícones simples (inline SVG) =============== */

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 0 1 0 1.414l-7.25 7.25a1 1 0 0 1-1.414 0L3.293 9.957a1 1 0 1 1 1.414-1.414l3.043 3.043 6.543-6.543a1 1 0 0 1 1.414 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
function BoltIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M13 2 3 14h7l-1 8 11-14h-7l1-6z" />
    </svg>
  );
}
function SparkIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2 9 9 2 12l7 3 3 7 3-7 7-3-7-3-3-7z" />
    </svg>
  );
}
function BagIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M7 7V6a5 5 0 0 1 10 0v1h2a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2Zm2-1a3 3 0 1 1 6 0v1H9V6Z" />
    </svg>
  );
}
function StoreIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M3 9 4.5 4h15L21 9H3Zm0 2h18v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9Z" />
    </svg>
  );
}
function CartIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm10 0a2 2 0 1 0 .001 4.001A2 2 0 0 0 17 18ZM3 2h2l3.6 7.59-1.35 2.45A2 2 0 0 0 9 15h9v-2H9.42a.25.25 0 0 1-.22-.37L9.8 11h6.9a2 2 0 0 0 1.79-1.11l3.58-6.89A1 1 0 0 0 21.2 2H6.21L5.27 0H1v2Z" />
    </svg>
  );
}
function ClockIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 22A10 10 0 1 0 2 12a10 10 0 0 0 10 10Zm1-10V7h-2v6h6v-2h-4Z" />
    </svg>
  );
}
function LinkIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M13 6h5a1 1 0 0 1 1 1v5h-2V9.41l-7.29 7.3-1.42-1.42 7.3-7.29H13V6ZM7 7h4v2H8.41l-.7.7L6.3 11.1l-.7.7V17h8v2H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" />
    </svg>
  );
}
function WhatsappIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M20.5 3.5A11 11 0 0 0 3.2 19.2L2 22l2.9-1.2a11 11 0 0 0 15.6-17.3Zm-8.3 16a9 9 0 0 1-4.6-1.3l-.3-.2-2.7 1 1-2.6-.2-.3a9 9 0 1 1 6.9 3.4Zm5.2-6.7c-.3-.1-1.7-.8-1.9-.9s-.4-.1-.6.1c-.2.3-.7.9-.8 1-.1.1-.3.2-.6.1s-1.2-.5-2.3-1.4c-.8-.7-1.4-1.6-1.6-1.9-.2-.3 0-.4.1-.6l.2-.3c.1-.1.1-.3.2-.4.1-.1.1-.3 0-.5 0-.1-.6-1.4-.9-1.9-.3-.5-.5-.4-.6-.4h-.5c-.2 0-.5.1-.8.4s-1 1-1 2.4 1 2.7 1.1 2.9 2 3.1 4.8 4.3c.7.3 1.3.6 1.7.7.7.2 1.3.2 1.8.1.5-.1 1.7-.7 1.9-1.3.2-.6.2-1.1.2-1.2 0-.1-.2-.1-.5-.2Z" />
    </svg>
  );
}

/* Pontinhos decorativos no fundo (sutil) */
function Dots() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full opacity-[0.06]"
    >
      <defs>
        <pattern id="dots" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="white" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
}
