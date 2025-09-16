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

export default async function Page(props: { params: Promise<{ id: string }> }) {
  // Next 15: params é Promise
  const { id } = await props.params;

  // Next 15: headers() é assíncrono
  const h = await headers();
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

  // link de WhatsApp com mensagem pré-pronta
  const waMsg = encodeURIComponent(
    `Olá! Tenho interesse no seu anúncio "${ad.title}" (${formatPrice(ad.priceCents)}). Você pode me confirmar se ainda está disponível?`
  );
  const waLink = `https://wa.me/?text=${waMsg}`;

  // link de compartilhamento (usa a própria URL)
  const selfUrl = `${base}/anuncio/${ad.id}`;
  const shareText = encodeURIComponent(`${ad.title} - ${formatPrice(ad.priceCents)}\n${selfUrl}`);
  const shareLink = `https://wa.me/?text=${shareText}`;

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
                {ad.city}, {ad.uf}
              </div>
              <p className="prose prose-invert mt-4 text-sm leading-6 text-zinc-200">
                {ad.description}
              </p>
            </div>
          </div>

          {/* DIREITA: mapa + ações */}
          <aside className="rounded-2xl border border-white/10 bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-zinc-300">Área do anúncio</h2>
            <AdMap center={center} radiusKm={ad.radiusKm ?? 5} height={260} />
            <div className="mt-4 flex gap-3">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-center text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
              >
                WhatsApp
              </a>
              <a
                href={shareLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-lg border border-white/10 px-3 py-2 text-center text-sm hover:bg-white/5"
              >
                Compartilhar
              </a>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
