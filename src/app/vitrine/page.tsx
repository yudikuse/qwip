// src/app/vitrine/page.tsx
import Image from "next/image";

export default function VitrinePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="py-14">
        <div className="container mx-auto max-w-6xl px-6">
          <h1 className="text-center text-3xl font-bold">Vitrine de Anúncios</h1>
          <p className="mx-auto mt-2 max-w-2xl text-center text-zinc-400">
            Veja como ficam os anúncios publicados no Qwip.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
        </div>
      </section>
    </main>
  );
}

/* --- Componente local (mesmo visual da home) --- */
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

function WhatsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.04 2C6.58 2 2.16 6.29 2.16 11.62c0 1.9.57 3.67 1.56 5.16L2 22l5.4-1.47a10.3 10.3 0 004.64 1.1c5.46 0 9.88-4.29 9.88-9.62C21.92 6.29 17.5 2 12.04 2zm5.47 13.8c-.23.66-1.16 1.1-1.87 1.25-.5.1-1.16.19-3.38-.7-2.83-1.17-4.65-4.02-4.79-4.21-.14-.19-1.15-1.54-1.15-2.94 0-1.4.73-2.08.99-2.36.27-.28.59-.35.79-.35.2 0 .39.01.56.01.18.01.42-.07.66.5.23.56.78 1.93.85 2.07.07.14.11.31.02.5-.09.19-.14.31-.27.48-.14.17-.28.38-.4.51-.13.14-.27.29-.12.56.14.28.62 1.04 1.33 1.68.91.81 1.68 1.07 1.96 1.2.28.14.44.12.61-.07.18-.2.7-.81.89-1.09.19-.28.38-.23.63-.14.25.1 1.58.74 1.86.87.27.14.46.2.53.31.06.11.06.65-.17 1.31z" />
    </svg>
  );
}
