// src/app/anuncio/[id]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import AdMap from "@/components/AdMap";

type Ad = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  city: string;
  uf: string;
  lat: number | null;
  lng: number | null;
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number | null;
  imageUrl: string | null;
  phoneE164: string | null;
  createdAt: string;
};

function formatPrice(cents: number) {
  const v = Math.max(0, Math.trunc(cents || 0));
  const reais = Math.floor(v / 100);
  const cent = (v % 100).toString().padStart(2, "0");
  return `R$ ${reais.toLocaleString("pt-BR")},${cent}`;
}

async function fetchAd(base: string, id: string): Promise<Ad | null> {
  const r = await fetch(`${base}/api/ads/${id}`, { cache: "no-store" });
  if (!r.ok) return null;
  const data = await r.json();
  return (data?.ad ?? null) as Ad | null;
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;

  const ad = await fetchAd(base, params.id);

  if (!ad) {
    return {
      title: "Anúncio não encontrado — Qwip",
      alternates: { canonical: `/anuncio/${params.id}` },
    };
  }

  const title = `${ad.title} — ${formatPrice(ad.priceCents)}`;
  const description =
    (ad.description || "").slice(0, 180) ||
    `${ad.city}${ad.uf ? `, ${ad.uf}` : ""}`;

  return {
    title,
    description,
    alternates: { canonical: `/anuncio/${ad.id}` },
    openGraph: {
      title,
      description,
      url: `${base}/anuncio/${ad.id}`,
      type: "article",
      images: ad.imageUrl ? [{ url: ad.imageUrl, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ad.imageUrl ? [ad.imageUrl] : [],
    },
  };
}

export default async function Page({ params }: { params: { id: string } }) {
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;

  const ad = await fetchAd(base, params.id);
  if (!ad) return notFound();

  const center =
    (ad.centerLat != null && ad.centerLng != null && { lat: ad.centerLat, lng: ad.centerLng }) ||
    (ad.lat != null && ad.lng != null && { lat: ad.lat, lng: ad.lng }) ||
    null;

  // Mensagem pronta para o WhatsApp
  const msg =
    `Olá! Tenho interesse no anúncio “${ad.title}” por ${formatPrice(ad.priceCents)}.\n` +
    `Link: ${base}/anuncio/${ad.id}`;

  const waTo =
    ad.phoneE164
      ? `https://wa.me/${ad.phoneE164.replace(/^\+/, "")}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;

  const shareUrl = `${base}/anuncio/${ad.id}`;
  const shareTitle = `${ad.title} — ${formatPrice(ad.priceCents)}`;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* Cabeçalho */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{ad.title}</h1>
          <Link
            href="/vitrine"
            className="rounded-xl border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
          >
            Voltar
          </Link>
        </div>

        {/* Duas colunas: card do anúncio + card de ações/mapa */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Card principal */}
          <article className="rounded-2xl border border-white/10 bg-card overflow-hidden">
            <div className="relative aspect-[4/3] w-full bg-zinc-900">
              {ad.imageUrl ? (
                <Image
                  src={ad.imageUrl}
                  alt={ad.title}
                  fill
                  priority
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                  (Sem imagem)
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-semibold">{formatPrice(ad.priceCents)}</div>
                  <div className="mt-1 text-sm text-zinc-400">
                    {ad.city}{ad.uf ? `, ${ad.uf}` : ""}
                  </div>
                </div>

                <span className="rounded-full bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-300 ring-1 ring-amber-400/20">
                  Expira em 24h
                </span>
              </div>

              <p className="prose prose-invert mt-5 text-sm leading-relaxed text-zinc-200">
                {ad.description}
              </p>
            </div>
          </article>

          {/* Ações + mapa */}
          <aside className="rounded-2xl border border-white/10 bg-card p-5">
            <div className="text-sm font-medium mb-3">Área do anúncio</div>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <AdMap center={center} radiusKm={ad.radiusKm ?? 5} height={280} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {/* WhatsApp — abre conversa com o anunciante (se houver número) e sempre com mensagem pronta */}
              <a
                href={waTo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-[#0F1115] transition hover:bg-emerald-400"
              >
                WhatsApp
              </a>

              {/* Compartilhar — usa Web Share quando disponível; fallback: copiar link */}
              <a
                href={shareUrl}
                data-share
                data-title={shareTitle}
                data-url={shareUrl}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/5"
              >
                Compartilhar
              </a>
            </div>
          </aside>
        </div>
      </div>

      {/* Script leve para Web Share / copiar link (sem @ts-expect-error) */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
          (function () {
            document.addEventListener('click', function (e) {
              var t = e.target && e.target.closest && e.target.closest('[data-share]');
              if (!t) return;
              e.preventDefault();
              var url = t.getAttribute('data-url');
              var title = t.getAttribute('data-title') || document.title;
              if (navigator.share) {
                navigator.share({ title: title, url: url }).catch(function(){});
              } else if (navigator.clipboard) {
                navigator.clipboard.writeText(url).then(function(){
                  var prev = t.textContent;
                  t.textContent = 'Link copiado!';
                  setTimeout(function(){ t.textContent = prev; }, 1500);
                });
              } else {
                window.open(url, '_blank');
              }
            }, { passive: false });
          })();`,
        }}
      />
    </main>
  );
}
