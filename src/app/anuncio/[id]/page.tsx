import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
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

/**
 * Next.js 15: em páginas com segmentação dinâmica, `params` é uma Promise.
 */
export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const h = await headers(); // headers agora é assíncrono no 15
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;

  const ad = await fetchAd(base, id);

  if (!ad) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto max-w-4xl px-4 py-10">
          <div className="rounded-xl border border-white/10 p-6">
            <h1 className="text-xl font-semibold">Anúncio não encontrado</h1>
            <p className="mt-2 text-sm text-zinc-400">
              O anúncio pode ter expirado ou sido removido.
            </p>
            <Link
              href="/vitrine"
              className="mt-4 inline-block rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
            >
              Voltar para a vitrine
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const center =
    (ad.centerLat != null && ad.centerLng != null && { lat: ad.centerLat, lng: ad.centerLng }) ||
    (ad.lat != null && ad.lng != null && { lat: ad.lat, lng: ad.lng }) ||
    null;

  const shareTitle = `${ad.title} - ${formatPrice(ad.priceCents)}`;
  const shareDesc =
    ad.description?.slice(0, 140).replace(/\s+/g, " ").trim() +
    (ad.description && ad.description.length > 140 ? "…" : "");
  const canonical = `${base}/anuncio/${ad.id}`;

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* SEO básico + social */}
      <head>
        <title>{shareTitle}</title>
        <meta name="description" content={shareDesc} />
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={shareDesc} />
        {ad.imageUrl && <meta property="og:image" content={ad.imageUrl} />}
        <meta property="og:url" content={canonical} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={canonical} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              name: ad.title,
              description: ad.description,
              offers: {
                "@type": "Offer",
                priceCurrency: "BRL",
                price: (ad.priceCents / 100).toFixed(2),
                availability: "https://schema.org/InStock",
              },
              image: ad.imageUrl || undefined,
              areaServed: ad.uf ? `BR-${ad.uf}` : undefined,
            }),
          }}
        />
      </head>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{ad.title}</h1>
          <Link
            href="/vitrine"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
          >
            Voltar
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* ESQUERDA: imagem + descrição */}
          <div className="rounded-2xl border border-white/10 bg-card">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-zinc-900">
              {ad.imageUrl ? (
                <Image
                  src={ad.imageUrl}
                  alt={ad.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 60vw, 100vw"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                  (Sem imagem)
                </div>
              )}
            </div>

            <div className="p-5">
              <div className="text-xl font-semibold">{formatPrice(ad.priceCents)}</div>
              <div className="mt-1 text-sm text-zinc-400">
                {ad.city}
                {ad.uf ? `, ${ad.uf}` : ""}
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                {ad.description}
              </p>
              <div className="mt-4">
                <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-amber-400/20">
                  Expira em 24h
                </span>
              </div>
            </div>
          </div>

          {/* DIREITA: mapa + ações */}
          <aside className="rounded-2xl border border-white/10 bg-card p-5">
            <div className="mb-2 text-xs font-medium text-zinc-400">Área do anúncio</div>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <AdMap center={center} radiusKm={ad.radiusKm ?? 5} height={260} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {/* WhatsApp — mensagem pré-pronta para o vendedor */}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `${shareTitle}\n${canonical}\n\nOlá! Tenho interesse neste anúncio.`
                )}`}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-[#0F1115] transition hover:bg-emerald-400"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>

              {/* Compartilhar nativo/Web Share API com fallback */}
              <button
                onClick={async () => {
                  const url = canonical;
                  const title = shareTitle;
                  const text = shareDesc;
                  try {
                    // @ts-ignore – web share disponível em mobile/alguns desktops
                    if (navigator.share) {
                      // @ts-ignore
                      await navigator.share({ title, text, url });
                    } else {
                      await navigator.clipboard.writeText(url);
                      alert("Link copiado!");
                    }
                  } catch {}
                }}
                className="inline-flex items-center justify-center rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/5"
              >
                Compartilhar
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
