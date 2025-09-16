// src/app/anuncio/[id]/page.tsx
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

// Next 15: Page props shape { params: { id: string } }
export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id;

  const h = headers();
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

  // share / meta
  const shareTitle = `${ad.title} - ${formatPrice(ad.priceCents)}`;
  const shareDesc = ad.description?.slice(0, 160) ?? "";
  const shareImg = ad.imageUrl ?? `${base}/og-image.png`;
  const pageUrl = `${base}/anuncio/${ad.id}`;

  // WhatsApp prefilled
  const waMsg = encodeURIComponent(
    `Olá! Tenho interesse no seu anúncio "${ad.title}" (${formatPrice(ad.priceCents)}). Está disponível?`
  );
  // se quiser fixar número do anunciante, use wa.me/<phone>?text=...
  const waLink = `https://wa.me/?text=${waMsg}`;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <head>
        <title>{shareTitle}</title>
        <meta name="description" content={shareDesc} />
        <meta property="og:title" content={shareTitle} />
        <meta property="og:description" content={shareDesc} />
        <meta property="og:image" content={shareImg} />
        <meta property="og:url" content={pageUrl} />
      </head>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-2xl border border-white/10 bg-card p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <div className="overflow-hidden rounded-xl border border-white/6">
                {ad.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ad.imageUrl} alt={ad.title} className="h-80 w-full object-cover" />
                ) : (
                  <div className="flex h-80 items-center justify-center text-zinc-500">
                    (Sem imagem)
                  </div>
                )}
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-semibold">{ad.title}</h1>
              <div className="mt-2 text-lg font-bold">{formatPrice(ad.priceCents)}</div>
              <div className="mt-3 text-sm text-zinc-400">{ad.description}</div>

              <div className="mt-4 flex gap-3">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
                >
                  Entrar em contato (WhatsApp)
                </a>

                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator
                        .share({
                          title: shareTitle,
                          text: shareDesc,
                          url: pageUrl,
                        })
                        .catch(() => {});
                    } else {
                      // fallback: copia url
                      navigator.clipboard?.writeText(pageUrl);
                      alert("Link copiado para a área de transferência.");
                    }
                  }}
                  className="rounded-md border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                >
                  Compartilhar
                </button>
              </div>
            </div>
          </div>

          {center ? (
            <div className="mt-6">
              <AdMap center={center} markers={[{ id: ad.id, lat: center.lat, lng: center.lng }]} />
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
