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
  try {
    const r = await fetch(`${base}/api/ads/${id}`, { cache: "no-store" });
    if (!r.ok) return null;
    const data = await r.json();
    return (data?.ad ?? null) as Ad | null;
  } catch {
    return null;
  }
}

// ✅ Next 15: params é Promise; headers() é assíncrono (mesmo padrão já usado) :contentReference[oaicite:1]{index=1}
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const h = await headers(); // async no Next 15
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

  const price = formatPrice(ad.priceCents);

  // Deep link do WhatsApp com mensagem completa
  const waText = encodeURIComponent(
    `Olá! Tenho interesse no seu anúncio:\n\n${ad.title}\n${price}\n${ad.city}${ad.uf ? ", " + ad.uf : ""}\n\nLink: ${base}/anuncio/${ad.id}`
  );
  const waHref = `https://wa.me/?text=${waText}`;

  // Link “compartilhar” nativo + fallback
  const shareHref = `${base}/anuncio/${ad.id}`;

  return (
    <main className="min-h-screen bg-background text-foreground">
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
                // Usa <Image> com fill e object-cover
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
              <div className="text-xl font-semibold">{price}</div>
              <div className="mt-1 text-sm text-zinc-400">
                {ad.city}
                {ad.uf ? `, ${ad.uf}` : ""}
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                {ad.description}
              </p>
              <div className="mt-5 flex gap-3">
                <a
                  href={waHref}
                  className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#0F1115] transition hover:bg-emerald-400"
                >
                  WhatsApp
                </a>

                {/* Share API nativo (quando disponível) com fallback para o link */}
                <button
                  className="inline-flex items-center justify-center rounded-md border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/5"
                  onClick={async () => {
                    try {
                      if (typeof navigator !== "undefined" && (navigator as any).share) {
                        await (navigator as any).share({
                          title: ad.title,
                          text: `${ad.title} — ${price}`,
                          url: shareHref,
                        });
                      } else {
                        window.open(shareHref, "_blank");
                      }
                    } catch {}
                  }}
                >
                  Compartilhar
                </button>
              </div>
            </div>
          </div>

          {/* DIREITA: mapa */} 
          {/* Componente isolado (dinâmico) – idêntico ao que você já tem (AdMap) :contentReference[oaicite:2]{index=2} */}
          <div className="rounded-2xl border border-white/10 bg-card p-5">
            <div className="mb-2 text-xs font-medium text-zinc-400">Área do anúncio</div>
            <AdMap center={center} radiusKm={ad.radiusKm ?? 5} height={280} />
          </div>
        </div>
      </div>
    </main>
  );
}
