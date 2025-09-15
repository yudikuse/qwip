// src/app/anuncio/[id]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

type Ad = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  city: string;
  uf: string;
  imageUrl: string | null;
  imageMime?: string | null;
  lat: number;
  lng: number;
  radiusKm?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

function formatBRL(cents: number) {
  const v = (cents ?? 0) / 100;
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Opcional: evitar cache em produção
export const revalidate = 0;

async function fetchAd(id: string): Promise<Ad | null> {
  // Monta URL absoluta para chamar a API interna
  const h = headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https"; // Vercel costuma vir como https
  const base = `${proto}://${host}`;

  const res = await fetch(`${base}/api/ads/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Falha ao carregar anúncio ${id}`);
  return (await res.json()) as Ad;
}

export default async function Page({
  params,
}: {
  // <<< IMPORTANTE: params é Promise no Next 15 (PPR)
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const ad = await fetchAd(id);
  if (!ad) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">Detalhe do anúncio</h1>
          <Link
            href="/vitrine"
            className="rounded-md border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
          >
            Voltar para a vitrine
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Imagem */}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0B0E12]">
            <div className="relative h-80 w-full">
              {ad.imageUrl ? (
                <Image
                  src={ad.imageUrl}
                  alt={ad.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 640px"
                  priority
                />
              ) : (
                <div className="flex h-80 items-center justify-center text-sm text-zinc-500">
                  (Sem imagem)
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="text-lg font-bold">{ad.title}</div>
              <div className="mt-1 text-sm text-zinc-400">
                {ad.city}
                {ad.uf ? `, ${ad.uf}` : ""}
              </div>
              <div className="mt-2 text-base font-semibold text-emerald-400">
                {formatBRL(ad.priceCents)}
              </div>
            </div>
          </div>

          {/* Info */}
          <aside className="rounded-xl border border-white/10 bg-card p-4">
            <div>
              <div className="mb-1 text-sm font-medium">Descrição</div>
              <p className="whitespace-pre-wrap text-sm text-zinc-300">
                {ad.description}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-white/10 p-3">
                <div className="text-xs text-zinc-400">Localização</div>
                <div className="font-medium">
                  {ad.city}
                  {ad.uf ? `, ${ad.uf}` : ""}
                </div>
              </div>
              <div className="rounded-md border border-white/10 p-3">
                <div className="text-xs text-zinc-400">Raio</div>
                <div className="font-medium">
                  {ad.radiusKm ? `${ad.radiusKm} km` : "—"}
                </div>
              </div>
            </div>

            {/* Ações rápidas */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Olá! Vi seu anúncio no Qwip: "${ad.title}" por ${formatBRL(
                    ad.priceCents
                  )}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-[#0F1115] transition hover:bg-emerald-400"
              >
                WhatsApp
              </a>
              <button
                onClick={async () => {
                  // este botão não roda no servidor; só pra manter layout
                }}
                className="inline-flex items-center justify-center rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/5"
              >
                Compartilhar
              </button>
            </div>
          </aside>
        </div>

        {/* Placeholder para mapa (client component pode ser adicionado depois) */}
        <section className="mt-8 rounded-xl border border-white/10 bg-card p-4">
          <div className="mb-2 text-sm font-medium">Mapa</div>
          <div className="h-64 w-full rounded-md border border-white/10 bg-[#0B0E12] p-3 text-xs text-zinc-400">
            Mapa interativo será adicionado depois (lat: {ad.lat.toFixed(5)}, lng:{" "}
            {ad.lng.toFixed(5)}).
          </div>
        </section>
      </div>
    </main>
  );
}
