// src/app/anuncio/[id]/page.tsx
import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import AdMap from "@/components/AdMap";
import WhatsAppButton from "@/components/WhatsAppButton";
import ShareButtons from "@/components/ShareButtons";

/**
 * Representa um anúncio retornado pela API. Incluímos o campo opcional
 * sellerPhone para que a interface possa gerar o link de WhatsApp
 * diretamente para o vendedor. O createdAt vem como string ISO.
 */
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
  sellerPhone?: string | null;
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

// Geramos dinamicamente os metadados da página do anúncio. Dessa forma,
// o link compartilhado no WhatsApp mostra uma imagem grande (thumb) e
// título personalizado. O Next 15 usa generateMetadata ao invés de
// tags <head> diretamente nos componentes.
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const id = params.id;
  // Base URL pública — no fallback usa o domínio padrão
  const base = process.env.NEXT_PUBLIC_BASE_URL || "";
  try {
    const res = await fetch(`${base}/api/ads/${id}`, { cache: "no-store" });
    const data = await res.json();
    const ad: Ad | null = data?.ad ?? null;
    if (!ad) return {};
    const title = `${ad.title} - ${formatPrice(ad.priceCents)}`;
    const description = ad.description?.slice(0, 160) ?? "";
    const image = ad.imageUrl || `${base}/og-image.png`;
    const url = `${base}/anuncio/${ad.id}`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      },
    } as Metadata;
  } catch {
    return {};
  }
}

// Next 15: Page props shape { params: { id: string } }
export default async function Page({ params }: { params: any }) {
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
  // Calcula centro para o mapa. Usa radius se existir, senão a coordenada base.
  const center =
    (ad.centerLat != null && ad.centerLng != null && { lat: ad.centerLat, lng: ad.centerLng }) ||
    (ad.lat != null && ad.lng != null && { lat: ad.lat, lng: ad.lng }) ||
    null;

  // Data de expiração: anúncios expiram 24 horas após a criação.
  const expires = (() => {
    try {
      const created = new Date(ad.createdAt);
      const expiry = new Date(created.getTime() + 24 * 60 * 60 * 1000);
      // Formata no padrão pt-BR (ex: "18:00 de 15/09")
      return expiry.toLocaleString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      });
    } catch {
      return null;
    }
  })();

  // Mensagem pré-preenchida para o WhatsApp. Se houver número do vendedor
  // (E.164), passamos para o componente WhatsAppButton. Caso contrário,
  // o botão usará o fallback definido em CONTACT.whatsappPhone.
  const waText = `Olá! Tenho interesse no seu anúncio "${ad.title}" (${formatPrice(ad.priceCents)}). Está disponível?`;

  const pageUrl = `${base}/anuncio/${ad.id}`;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-card shadow">
          {ad.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="h-64 w-full object-cover md:h-80"
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center text-zinc-500 md:h-80">
              (Sem imagem)
            </div>
          )}
          <div className="p-5">
            <h1 className="text-2xl font-bold md:text-3xl">{ad.title}</h1>
            <div className="mt-2 text-xl font-extrabold text-emerald-500 md:text-2xl">
              {formatPrice(ad.priceCents)}
            </div>
            {expires && (
              <div className="mt-1 text-xs uppercase tracking-wide text-red-500">
                Válido até {expires}
              </div>
            )}
            <p className="mt-4 whitespace-pre-line text-sm text-zinc-300 md:text-base">
              {ad.description}
            </p>
            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
              <WhatsAppButton
                text={waText}
                phone={ad.sellerPhone ?? undefined}
                className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
              >
                Chamar no WhatsApp
              </WhatsAppButton>
              <ShareButtons
                title={ad.title}
                priceText={formatPrice(ad.priceCents)}
                url={pageUrl}
              />
            </div>
          </div>
        </div>
        {center ? (
          <div className="mt-6">
            <AdMap center={center} markers={[{ id: ad.id, lat: center.lat, lng: center.lng }]} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
