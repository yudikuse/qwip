// src/app/page.tsx
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import QButton from "@/components/ui/QButton";
import type { Metadata } from "next";

const SITE_URL = "https://qwip.pro";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Qwip — Venda HOJE com link direto pro WhatsApp",
  description:
    "Crie e compartilhe seu anúncio em menos de 60s. Link direto pro WhatsApp, vitrine com urgência real e moderação inteligente. Sem taxas sobre a venda.",
  applicationName: "Qwip",
  keywords: [
    "anúncio",
    "anuncios",
    "vitrine",
    "vendas",
    "whatsapp",
    "link whatsapp",
    "negócio local",
    "autônomos",
    "classificados",
    "marketplace",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL + "/",
    title: "Qwip — Venda HOJE com link direto pro WhatsApp",
    description:
      "Crie e compartilhe seu anúncio em menos de 60s. Link direto pro WhatsApp e urgência real.",
    siteName: "Qwip",
    images: [
      {
        url: "/images/og-home.jpg",
        width: 1200,
        height: 630,
        alt: "Qwip — Venda HOJE",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Qwip — Venda HOJE com link direto pro WhatsApp",
    description:
      "Crie anúncios rápidos e compartilhe no WhatsApp. Sem taxas sobre a venda.",
    images: ["/images/og-home.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Google Analytics (não altera layout) */}
      <Script
        id="ga-loader"
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-HXC29BV5NT"
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-HXC29BV5NT');
        `}
      </Script>

      {/* JSON-LD estruturado (SEO) */}
      <Script id="ld-website" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Qwip",
          url: SITE_URL,
          potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/vitrine?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        })}
      </Script>
      <Script id="ld-org" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Qwip",
          url: SITE_URL,
          logo: `${SITE_URL}/favicon/android-chrome-512x512.png`,
          sameAs: [],
        })}
      </Script>

      {/* HERO */}
      <section className="relative">
        <div className="container mx-auto max-w-6xl px-6 py-20 lg:py-28">
          {/* Pills */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
              <SparkleIcon className="h-3.5 w-3.5" />
              Powered by AI
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-400/20">
              <BoltIcon className="h-3.5 w-3.5" />
              Menos de 60s para publicar
            </span>
          </div>

          <div className="mt-8 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            {/* Copy */}
            <div>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
                Anúncios rápidos.
                <br />
                <span className="text-primary">Link direto pro WhatsApp.</span>
              </h1>

              <p className="mt-6 max-w-xl text-zinc-400">
                Publique em menos de 60 segundos. O anúncio expira automaticamente,
                gerando urgência e mantendo a vitrine sempre atual.
              </p>

              {/* Botões do hero (igual ao Figma) */}
              <div className="mt-8 flex flex-wrap gap-3">
                <QButton
                  href="/anuncio/novo"
                  variant="solid"
                  size="lg"
                  icon={<FlashIcon className="-ml-0.5 h-4 w-4" />}
                >
                  Criar Anúncio Grátis
                </QButton>

                <QButton
                  href="/vitrine"
                  variant="outline"
                  size="lg"
                  icon={<EyeIcon className="-ml-0.5 h-4 w-4" />}
                >
                  Ver Vitrine de Anúncios
                </QButton>
              </div>

              {/* Benefícios */}
              <ul className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-400">
                <li className="inline-flex items-center gap-2">
                  <CheckDot className="h-3.5 w-3.5 text-emerald-400" />
                  100% direto no WhatsApp — sem taxas sobre a venda
                </li>
                <li className="inline-flex items-center gap-2">
                  <CheckDot className="h-3.5 w-3.5 text-emerald-400" />
                  Menos de 60s
                </li>
                <li className="inline-flex items-center gap-2">
                  <CheckDot className="h-3.5 w-3.5 text-emerald-400" />
                  Link compartilhável
                </li>
                <li className="inline-flex items-center gap-2">
                  <CheckDot className="h-3.5 w-3.5 text-emerald-400" />
                  Expira automaticamente
                </li>
              </ul>
            </div>

            {/* Mockup Card */}
            <div className="relative">
              <div className="rounded-2xl border border-white/10 bg-card p-5 shadow-2xl">
                <div className="rounded-xl border border-white/10 bg-[#0B0E12] p-4">
                  {/* Header */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold">
                        Q
                      </div>
                      <span className="font-medium">QWIP Vendas</span>
                      <span className="text-zinc-500">agora</span>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-400 ring-1 ring-emerald-500/20">
                      <SparkleIcon className="h-3 w-3" />
                      Melhorado com IA
                    </span>
                  </div>

                  {/* Imagem */}
                  <div className="relative overflow-hidden rounded-lg">
                    <Image
                      src="/images/hero-card.jpg"
                      alt="Marmita Caseira Completa"
                      width={1200}
                      height={650}
                      className="h-56 w-full object-cover"
                      sizes="(min-width: 1024px) 560px, 100vw"
                      priority
                    />
                    <div className="absolute right-2 top-2 rounded-md bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-zinc-900">
                      Expira em 23h 45min
                    </div>
                  </div>

                  {/* Footer do card */}
                  <div className="mt-3">
                    <div className="flex items-end justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-white">
                          Marmita Caseira Completa
                        </h3>
                        <p className="mt-0.5 text-xs text-zinc-400">
                          R$ 18,50 • Vila Olímpia, SP
                        </p>
                      </div>
                      <span className="rounded-md bg-rose-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                        Últimas 3 unidades
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <a
                        href="#"
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-[#0F1115] transition hover:bg-emerald-400"
                      >
                        <WhatsIcon className="h-4 w-4" />
                        WhatsApp
                      </a>
                      <a
                        href="#"
                        className="inline-flex items-center justify-center rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/5"
                      >
                        Compartilhar
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* bolinhas decorativas */}
              <div className="pointer-events-none absolute -right-4 -top-4 h-6 w-6 rounded-full bg-emerald-500/15"></div>
              <div className="pointer-events-none absolute -left-3 bottom-10 h-4 w-4 rounded-full bg-amber-400/20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Perfeito para você */}
      <SectionPerfeitoParaVoce />

      {/* Como funciona */}
      <SectionComoFunciona />

      {/* Vitrine */}
      <SectionVitrine />

      {/* Planos */}
      <SectionPlanos />

      {/* Depoimentos */}
      <SectionDepoimentos />

      {/* FAQ */}
      <SectionFAQ />

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 text-sm text-zinc-400">
        <div className="container mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6">
          <span>© 2025 Qwip</span>
          <nav className="flex gap-6">
            <Link href="/termos" className="hover:text-zinc-200">Termos</Link>
            <Link href="/privacidade" className="hover:text-zinc-200">Privacidade</Link>
            <Link href="https://wa.me/" className="hover:text-zinc-200">Fale no WhatsApp</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}

/* ===== Seções reaproveitando os componentes já definidos abaixo ===== */

function SectionPerfeitoParaVoce() {
  return (
    <section className="py-16">
      <div className="container mx-auto max-w-6xl px-6">
        <h2 className="text-center text-3xl font-bold">Perfeito para você</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-zinc-400">
          Não importa o que você venda, o QWIP funciona
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<UsersIcon className="h-5 w-5" />}
            title="Vendedores Autônomos"
            desc="Roupas, cosméticos, artesanato. Venda no seu tempo."
            hint="Ex.: roupas infantis, maquiagem, bijuterias."
          />
          <FeatureCard
            icon={<BagIcon className="h-5 w-5" />}
            title="Lojistas Locais"
            desc="Promoções rápidas, liquidações, produtos sazonais."
            hint="Ex.: açaí, farmácia, corte de cabelo."
          />
          <FeatureCard
            icon={<HomeIcon className="h-5 w-5" />}
            title="Vendas Pessoais"
            desc="Usados, freelas e serviços pontuais."
            hint="Ex.: móveis usados, aulas particulares, pet sitting."
          />
        </div>
      </div>
    </section>
  );
}

function SectionComoFunciona() {
  return (
    <section id="como-funciona" className="py-10">
      <div className="container mx-auto max-w-6xl px-6">
        <h2 className="text-center text-3xl font-bold">Como funciona</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-zinc-400">
          Em 3 passos simples, seu anúncio entra no ar com urgência real
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          <HowCard
            icon={<UploadIcon className="h-5 w-5" />}
            title="Crie seu anúncio em 60s"
            desc="Foto, título, preço e cidade. Pronto."
          />
          <HowCard
            icon={<ShareIcon className="h-5 w-5" />}
            title="Compartilhe o link"
            desc="Envie no WhatsApp, redes sociais e onde quiser."
          />
          <HowCard
            icon={<WhatsIcon className="h-5 w-5" />}
            title="Receba no WhatsApp"
            desc="O comprador fala direto com você, sem intermediação."
          />
        </div>
      </div>
    </section>
  );
}

function SectionVitrine() {
  return (
    <section id="vitrine" className="py-14">
      <div className="container mx-auto max-w-6xl px-6">
        <h2 className="text-center text-3xl font-bold">Vitrine de Anúncios</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-zinc-400">
          Veja como ficam os anúncios reais no Qwip
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <AdCard
            img="/images/vitrine-1.jpg"
            title="Marmita Caseira Completa"
            subtitle="Centro, Rio de Janeiro • Entrega 30min"
            price="R$ 18,50"
            topBadge="Expira em 2d 12h"
            sideBadge="Últimas 4"
          />
          <AdCard
            img="/images/vitrine-2.jpg"
            title="Manicure & Pedicure"
            subtitle="Centro, Rio de Janeiro"
            price="R$ 35,00"
            topBadge="Expira hoje"
          />
          <AdCard
            img="/images/vitrine-3.jpg"
            title="Açaí Premium c/ Frutas"
            subtitle="Copacabana, RJ"
            price="R$ 15,50"
            topBadge="Expira em 45min"
          />
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            href="/vitrine"
            className="inline-flex items-center justify-center rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/5"
          >
            Ver todos os anúncios
          </Link>
        </div>
      </div>
    </section>
  );
}

function SectionPlanos() {
  return (
    <section id="planos" className="py-16">
      <div className="container mx-auto max-w-6xl px-6">
        <h2 className="text-center text-3xl font-bold">Planos</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-zinc-400">
          Do primeiro anúncio ao catálogo da sua loja
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <PlanCard
            title="FREE"
            price="R$ 0"
            cta="Acessar FREE"
            features={[
              "1 anúncio ativo",
              "3 fotos por anúncio",
              "Expira em 24h",
              "0 boosts/mês",
              "Analytics básico",
            ]}
          />
          <PlanCard
            title="LITE"
            price="R$ 49,90/mês"
            highlight
            cta="Acessar LITE"
            features={[
              "Até 100 anúncios/mês",
              "8 fotos por anúncio",
              "Expira em 48h",
              "1 boost/mês",
              "Vitrine com filtros",
            ]}
          />
          <PlanCard
            title="PRO"
            price="R$ 99,90/mês"
            cta="Acessar PRO"
            features={[
              "Anúncios ilimitados",
              "Prioridade na vitrine",
              "Expira em 72h",
              "2 boosts/mês",
              "Dashboard avançado",
            ]}
          />
          <PlanCard
            title="BUSINESS"
            price="R$ 199,90/mês"
            cta="Acessar BUSINESS"
            features={[
              "Equipe/multi-usuário",
              "Boosts e destaque",
              "Expira em 72h",
              "Vitrine priorizada",
              "Integrações avançadas",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function SectionDepoimentos() {
  return (
    <section className="py-10">
      <div className="container mx-auto max-w-6xl px-6">
        <h2 className="text-2xl font-semibold">Quem vendeu com o Qwip</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <Testimonial
            name="Carla • Brechó Zona Sul"
            text="Postei às 10h e às 15h já tinha 12 conversas. Vendi 3 peças no mesmo dia."
          />
          <Testimonial
            name="Diego • Auto Peças Centro"
            text="O boost valeu muito. Fiquei no topo e acabou o estoque rápido."
          />
          <Testimonial
            name="Nayara • Decor São José"
            text="Gostei do link expirar. Cria urgência e me livra de ficar respondendo depois."
          />
        </div>
      </div>
    </section>
  );
}

function SectionFAQ() {
  return (
    <section id="faq" className="py-14">
      <div className="container mx-auto max-w-5xl px-6">
        <h2 className="text-2xl font-semibold">Perguntas Frequentes</h2>
        <div className="mt-6 grid gap-3">
          <Accordion q="Por que o anúncio expira automaticamente?" a="Para gerar urgência real e manter a vitrine sempre atualizada. Você pode renovar ou repostar." />
          <Accordion q="O Qwip é seguro? Como funciona a moderação?" a="Conteúdos são revisados de forma automática e manual. Denúncias são avaliadas rapidamente." />
          <Accordion q="Posso denunciar anúncios impróprios?" a="Sim. Cada anúncio tem opção de denúncia. Conteúdos fora das regras são removidos." />
          <Accordion q="Preciso instalar aplicativo?" a="Não. É 100% web e o link é compartilhável. O contato acontece no seu WhatsApp." />
          <Accordion q="Como o Qwip ganha dinheiro? Há taxas sobre vendas?" a="Não cobramos taxa por venda. Temos planos de assinatura e boosts opcionais." />
          <Accordion q="Posso cancelar minha assinatura a qualquer momento?" a="Sim, sem fidelidade. Você controla tudo no Dashboard." />
          <Accordion q="O que acontece se eu esquecer de renovar um anúncio importante?" a="O anúncio expira e sai da vitrine. Você pode repostar em segundos." />
          <Accordion q="Funciona para qualquer tipo de produto/serviço?" a="Sim. Pequenos negócios locais, autônomos, freelas e vendas pessoais." />
        </div>
      </div>
    </section>
  );
}

/* ---------- Componentes base ---------- */

function FeatureCard({
  icon,
  title,
  desc,
  hint,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-6">
      <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-zinc-400">{desc}</p>
      <p className="mt-3 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

function HowCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-6 text-center">
      <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
        {icon}
      </div>
      <h4 className="font-semibold">{title}</h4>
      <p className="mt-1 text-sm text-zinc-400">{desc}</p>
    </div>
  );
}

function AdCard({
  img,
  title,
  subtitle,
  price,
  topBadge,
  sideBadge,
}: {
  img: string;
  title: string;
  subtitle: string;
  price: string;
  topBadge?: string;
  sideBadge?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-4">
      <div className="relative overflow-hidden rounded-lg">
        <Image
          src={img}
          alt={title}
          width={1200}
          height={650}
          className="h-56 w-full object-cover"
          sizes="(min-width: 1024px) 360px, 100vw"
        />
        {topBadge ? (
          <div className="absolute right-2 top-2 rounded-md bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-zinc-900">
            {topBadge}
          </div>
        ) : null}
        {sideBadge ? (
          <div className="absolute left-2 top-2 rounded-md bg-rose-500 px-2 py-0.5 text-[11px] font-semibold text-white">
            {sideBadge}
          </div>
        ) : null}
      </div>
      <div className="mt-3">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-200">{price}</span>
          <a
            href="#"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-[#0F1115] transition hover:bg-emerald-400"
          >
            <WhatsIcon className="h-4 w-4" />
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  title,
  price,
  features,
  cta,
  highlight,
}: {
  title: string;
  price: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-card p-6 ${
        highlight
          ? "border-emerald-500/40 ring-1 ring-emerald-500/20"
          : "border-white/10"
      }`}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        {highlight ? (
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
            Popular
          </span>
        ) : null}
      </div>
      <div className="mt-2 text-2xl font-bold">{price}</div>

      <ul className="mt-4 space-y-2 text-sm text-zinc-300">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <CheckDot className="mt-1 h-3.5 w-3.5 text-emerald-400" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button className="mt-5 w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#0F1115] transition hover:bg-emerald-400">
        {cta}
      </button>
    </div>
  );
}

function Testimonial({ name, text }: { name: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-card p-6">
      <div className="text-sm font-semibold text-zinc-200">{name}</div>
      <p className="mt-3 text-sm text-zinc-400">“{text}”</p>
    </div>
  );
}

function Accordion({ q, a }: { q: string; a: string }) {
  return (
    <details className="rounded-xl border border-white/10 bg-card p-4">
      <summary className="cursor-pointer select-none list-none font-medium text-zinc-200">
        {q}
      </summary>
      <p className="mt-2 text-sm text-zinc-400">{a}</p>
    </details>
  );
}

/* ---------------- Icons ---------------- */
function SparkleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2l2.2 5.4L20 9l-5.8 1.6L12 16l-2.2-5.4L4 9l5.8-1.6L12 2z" />
    </svg>
  );
}
function BoltIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}
function EyeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 5C6 5 2 12 2 12s4 7 10 7 10-7 10-7-4-7-10-7zm0 11a4 4 0 110-8 4 4 0 010 8z" />
    </svg>
  );
}
function FlashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M7 2h10l-5 9h5l-8 11 2-8H6l1-12z" />
    </svg>
  );
}
function CheckDot(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <circle cx="10" cy="10" r="10" />
    </svg>
  );
}
function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M7 10a4 4 0 118 0 4 4 0 01-8 0zm-4 9a7 7 0 0116 0H3z" />
    </svg>
  );
}
function BagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M6 7V6a6 6 0 1112 0v1h3v14H3V7h3zm2 0h8V6a4 4 0 10-8 0v1z" />
    </svg>
  );
}
function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 3l9 8h-3v10H6V11H3l9-8z" />
    </svg>
  );
}
function UploadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 3l5 5h-3v6H10V8H7l5-5zM5 19h14v2H5v-2z" />
    </svg>
  );
}
function ShareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M14 9l-4 2 4 2v5l-10-5 10-5V4l8 6-8 6V9z" />
    </svg>
  );
}
function WhatsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.04 2C6.58 2 2.16 6.29 2.16 11.62c0 1.9.57 3.67 1.56 5.16L2 22l5.4-1.47a10.3 10.3 0 004.64 1.1c5.46 0 9.88-4.29 9.88-9.62C21.92 6.29 17.5 2 12.04 2zm5.47 13.8c-.23.66-1.16 1.1-1.87 1.25-.5.1-1.16.19-3.38-.7-2.83-1.17-4.65-4.02-4.79-4.21-.14-.19-1.15-1.54-1.15-2.94 0-1.4.73-2.08.99-2.36.27-.28.59-.35.79-.35.2 0 .39.01.56.01.18.01.42-.07.66.5.23.56.78 1.93.85 2.07.07.14.11.31.02.5-.09.19-.14.31-.27.48-.14.17-.28.38-.4.51-.13.14-.27.29-.12.56.14.28.62 1.04 1.33 1.68.91.81 1.68 1.07 1.96 1.2.28.14.44.12.61-.07.18-.2.7-.81.89-1.09.19-.28.38-.23.63-.14.25.1 1.58.74 1.86.87.27.14.46.2.53.31.06.11.06.65-.17 1.31z" />
    </svg>
  );
}
