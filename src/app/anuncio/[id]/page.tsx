// src/app/anuncio/[id]/page.tsx
import Link from "next/link";

type AdDetailResp = {
  ok: boolean;
  ad?: {
    id: string;
    title: string;
    description: string;
    price: number;
    city: string;
    uf: string;
    imageUrl: string;
    lat: number;
    lng: number;
    centerLat: number | null;
    centerLng: number | null;
    radiusKm: number | null;
    expiresAt: string;
  };
  error?: string;
};

async function getAd(id: string): Promise<AdDetailResp> {
  const r = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/ads/${id}`, {
    cache: "no-store",
  }).catch(() => null);
  if (!r) return { ok: false, error: "Falha na requisição." };
  return r.json();
}

export default async function AdPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const data = await getAd(id);

  if (!data.ok || !data.ad) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto max-w-3xl px-4 py-10">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Anúncio</h1>
            <Link href="/vitrine" className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5">
              Vitrine
            </Link>
          </div>
          <div className="rounded-xl border border-white/10 bg-card p-6">
            <div className="text-sm text-zinc-400">{data.error || "Anúncio não encontrado."}</div>
          </div>
        </div>
      </main>
    );
  }

  const ad = data.ad;
  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/anuncio/${ad.id}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(`${ad.title} – R$ ${ad.price.toLocaleString("pt-BR",{minimumFractionDigits:2})}\n${shareUrl}`)}`;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Anúncio</h1>
          <Link href="/vitrine" className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5">
            Vitrine
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Imagem + dados */}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0B0E12]">
            <div className="h-80 w-full bg-zinc-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ad.imageUrl} alt={ad.title} className="h-80 w-full object-cover" />
            </div>
            <div className="p-4">
              <div className="text-xl font-semibold">{ad.title}</div>
              <div className="mt-1 text-sm text-zinc-400">{ad.city}{ad.uf ? `, ${ad.uf}` : ""}</div>
              <div className="mt-2 text-lg font-bold">
                R$ {ad.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </div>
              <div className="mt-4 whitespace-pre-wrap text-sm text-zinc-300">
                {ad.description}
              </div>
              <div className="mt-4 inline-flex items-center rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-amber-400/20">
                expira em 24h
              </div>
            </div>
          </div>

          {/* Ações + mapa simples por link */}
          <div className="rounded-xl border border-white/10 bg-card p-4">
            <div className="grid gap-3">
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
              >
                Enviar no WhatsApp
              </a>

              <a
                href={`https://www.google.com/maps?q=${(ad.centerLat ?? ad.lat)},${(ad.centerLng ?? ad.lng)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
              >
                Ver no mapa
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
