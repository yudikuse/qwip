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
  imageUrl: string | null; // coluna usada nas APIs
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

// -------- Metadados (Open Graph / Twitter) para o "Compartilhar" mostrar o thumb do anúncio
export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;
  const url = `${base}/anuncio/${id}`;

  const ad = await fetchAd(base, id);

  if (!ad) {
    const title = "Anúncio não encontrado – Qwip";
    const description = "Este anúncio pode ter expirado ou sido removido.";
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        title,
        description,
        url,
        siteName: "Qwip — Venda HOJE",
        type: "article",
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
    };
  }

  const title = ad.title || "Anúncio";
  const description = ad.description?.slice(0, 160) || "Confira detalhes do anúncio.";
  const image = ad.imageUrl || `${base}/file.svg`;

  return {
    title: `${title} — ${formatPrice(ad.priceCents)}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} — ${formatPrice(ad.priceCents)}`,
      description,
      url,
      siteName: "Qwip — Venda HOJE",
      type: "product",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${formatPrice(ad.priceCents)}`,
      description,
      images: [image],
    },
  };
}

// -------- Página
export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  // headers() é assíncrono no Next 15
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;
  const selfUrl = `${base}/anuncio/${id}`;

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

  // Mensagem pré-pronta para WhatsApp
  const waText = encodeURIComponent(
    [
      `Olá! Vi seu anúncio no Qwip 👋`,
      `*${ad.title}* — ${formatPrice(ad.priceCents)}`,
      `${ad.city}${ad.uf ? `, ${ad.uf}` : ""}`,
      ``,
      `Ainda disponível?`,
      selfUrl,
    ].join("\n")
  );
  // Se você quiser enviar direto para um número específico, troque "send" por o número: /<DDD+numero>/?text=...
  const whatsappHref = `https://wa.me/?text=${waText}`;

  // JSON-LD (schema.org Product) — sem @ts-expect-error
  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: ad.title,
    description: ad.description,
    image: ad.imageUrl ?? undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: (ad.priceCents / 100).toFixed(2),
      availability: "https://schema.org/InStock",
      url: selfUrl,
    },
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* JSON-LD para melhorar snippet em apps/mensageiros que suportam */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{ad.title}</h1>
          <Link
            href="/vitrine"
            className="rounded-xl border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
          >
            Voltar
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* CARD ESQUERDO */}
          <article className="rounded-2xl border border-white/10 bg-card shadow-xl ring-1 ring-white/5">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-zinc-900">
              {ad.imageUrl ? (
                <Image
                  src={ad.imageUrl}
                  alt={ad.title}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                  (Sem imagem)
                </div>
              )}
              <div className="absolute left-4 top-4 rounded-full bg-emerald-500/90 px-3 py-1 text-sm font-semibold text-[#0F1115] shadow">
                {formatPrice(ad.priceCents)}
              </div>
            </div>

            <div className="grid gap-4 p-5">
              <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-400">
                <span className="rounded-full bg-white/5 px-2 py-0.5">
                  {ad.city}
                  {ad.uf ? `, ${ad.uf}` : ""}
                </span>
                <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-amber-300 ring-1 ring-amber-400/20">
                  Expira em 24h
                </span>
              </div>

              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-200">
                {ad.description}
              </p>

              <div className="mt-1 grid grid-cols-2 gap-3">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-[#0F1115] ring-1 ring-emerald-400/30 transition hover:bg-emerald-400"
                >
                  WhatsApp
                </a>

                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/5"
                  onClick={async () => {
                    const shareData = {
                      title: `${ad.title} — ${formatPrice(ad.priceCents)}`,
                      text: `${ad.description?.slice(0, 120) ?? ""}`,
                      url: selfUrl,
                    };
                    try {
                      if (navigator.share) {
                        await navigator.share(shareData);
                      } else {
                        await navigator.clipboard.writeText(selfUrl);
                        alert("Link copiado!");
                      }
                    } catch {
                      // ignorar cancelamentos
                    }
                  }}
                >
                  Compartilhar
                </button>
              </div>
            </div>
          </article>

          {/* CARD DIREITO (MAPA) */}
          <aside className="rounded-2xl border border-white/10 bg-card p-5 shadow-xl ring-1 ring-white/5">
            <div className="mb-3 text-sm font-medium text-zinc-300">Área do anúncio</div>
            <AdMap center={center} radiusKm={ad.radiusKm ?? 5} height={320} />
          </aside>
        </div>
      </div>
    </main>
  );
}
