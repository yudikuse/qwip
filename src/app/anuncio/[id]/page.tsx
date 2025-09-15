// src/app/anuncio/[id]/page.tsx
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import dynamic from "next/dynamic";

// Carrega o mapa só no client
const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

type Ad = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  city: string;
  uf: string;
  lat: number;
  lng: number;
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number;
  imageUrl: string | null;
  imageMime: string | null;
  imageSha256: string | null;
  createdAt: string;
  updatedAt: string;
  sellerId: string | null;
};

function formatPriceBRL(cents: number) {
  const v = Math.max(0, Math.floor(cents || 0)) / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function AdPage({
  params,
}: {
  // Next 15: params é uma Promise
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Monta URL absoluta da própria app (importante no Vercel)
  const h = await headers(); // Next 15: precisa await
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;

  // Busca o anúncio pela rota interna (SSR, sem cache)
  const res = await fetch(`${base}/api/ads/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    // 404 → notFound(); outros erros → tenta exibir 404 também
    notFound();
  }

  const data: { ad?: Ad } = await res.json();
  const ad = data.ad;
  if (!ad) {
    notFound();
  }

  const price = formatPriceBRL(ad.priceCents);
  const center = {
    lat: ad.centerLat ?? ad.lat,
    lng: ad.centerLng ?? ad.lng,
  };

  // Link/CTA de WhatsApp — placeholder: sem número por enquanto
  // Quando houver telefone do anunciante, montar wa.me/55NUMERO?text=...
  const waHref = `https://wa.me/?text=${encodeURIComponent(
    `Olá! Vi seu anúncio no QWIP: ${ad.title} — ${base}/anuncio/${ad.id}`
  )}`;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <a
            href="/"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
          >
            ← Voltar
          </a>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Imagem + informações */}
          <div className="rounded-2xl border border-white/10 bg-card overflow-hidden">
            <div className="h-72 w-full bg-zinc-900">
              {ad.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  className="h-72 w-full object-cover"
                />
              ) : (
                <div className="flex h-72 items-center justify-center text-xs text-zinc-500">
                  (Anúncio sem imagem)
                </div>
              )}
            </div>

            <div className="p-5">
              <h1 className="text-xl font-semibold">{ad.title}</h1>
              <div className="mt-1 text-sm text-zinc-400">
                {ad.city}
                {ad.uf ? `, ${ad.uf}` : ""}
              </div>

              <div className="mt-3 text-lg font-bold text-emerald-400">
                {price}
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-200">
                {ad.description}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-[#0F1115] transition hover:bg-emerald-400"
                >
                  WhatsApp
                </a>
                <button
                  onClick={() => {
                    try {
                      navigator.share
                        ? navigator.share({
                            title: ad.title,
                            text: `Veja este anúncio no QWIP: ${ad.title}`,
                            url: `${base}/anuncio/${ad.id}`,
                          })
                        : window.open(
                            `https://wa.me/?text=${encodeURIComponent(
                              `${ad.title} — ${base}/anuncio/${ad.id}`
                            )}`,
                            "_blank"
                          );
                    } catch {
                      window.open(
                        `https://wa.me/?text=${encodeURIComponent(
                          `${ad.title} — ${base}/anuncio/${ad.id}`
                        )}`,
                        "_blank"
                      );
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/5"
                >
                  Compartilhar
                </button>
              </div>
            </div>
          </div>

          {/* Mapa */}
          <aside className="rounded-2xl border border-white/10 bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Localização</h2>
              <div className="text-xs text-zinc-400">
                Raio:{" "}
                <span className="font-medium text-zinc-200">
                  {ad.radiusKm} km
                </span>
              </div>
            </div>

            <GeoMap
              center={{ lat: center.lat, lng: center.lng }}
              radiusKm={ad.radiusKm}
              onLocationChange={() => {}}
              height={320}
            />
            <p className="mt-2 text-xs text-zinc-500">
              Área aproximada informada pelo anunciante.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
