// src/app/anuncio/[id]/page.tsx
import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import AdMap from "@/components/AdMap";
import ShareButton from "@/components/ShareButtons";
import WhatsAppButton from "@/components/WhatsAppButton";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type Ad = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  city: string | null;
  uf: string | null;
  lat: number | null;
  lng: number | null;
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number | null;
  imageUrl: string | null;
  createdAt: string;      // ISO
  expiresAt?: string;     // ISO
  sellerPhone?: string | null; // telefone verificado salvo no servidor
};

function formatPriceBRL(v: number) {
  return (v / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

async function fetchAd(base: string, id: string): Promise<Ad | null> {
  const r = await fetch(`${base}/api/ads/${id}`, { cache: "no-store" });
  if (!r.ok) return null;
  const data = await r.json();
  return (data?.ad ?? null) as Ad | null;
}

async function getBaseFromHeaders() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const baseEnv = process.env.NEXT_PUBLIC_SITE_URL;
  const base = baseEnv ?? (await getBaseFromHeaders());
  const ad = await fetchAd(base, id);
  if (!ad) return { title: "Anúncio não encontrado" };

  const pageUrl = `${base}/anuncio/${ad.id}`;
  const shareTitle = `${ad.title} - ${formatPriceBRL(ad.priceCents)}`;

  return {
    title: shareTitle,
    openGraph: {
      title: shareTitle,
      url: pageUrl,
      images: ad.imageUrl ? [ad.imageUrl] : [],
    },
  };
}

export default async function AdPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const baseEnv = process.env.NEXT_PUBLIC_SITE_URL;
  const base = baseEnv ?? (await getBaseFromHeaders());
  const ad = await fetchAd(base, id);

  if (!ad) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold">Anúncio não encontrado</h1>
          <p className="mt-2 text-muted-foreground">
            O anúncio que você tentou acessar não existe ou expirou.
          </p>
          <div className="mt-6">
            <Link href="/" className="underline">← Voltar para a Home</Link>
          </div>
        </div>
      </main>
    );
  }

  const pageUrl = `${base}/anuncio/${ad.id}`;
  const shareTitle = `${ad.title} - ${formatPriceBRL(ad.priceCents)}`;
  const shareText = `${shareTitle}\n${pageUrl}`;

  const expiresDate = ad.expiresAt ? new Date(ad.expiresAt) : null;
  const expiresText = expiresDate
    ? `Expira às ${expiresDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} de ${expiresDate.toLocaleDateString("pt-BR")}`
    : null;

  // URL do WhatsApp (contato direto se houver telefone válido)
  const waHref = buildWhatsAppUrl({
    phoneRaw: ad.sellerPhone ?? null,
    title: ad.title,
    adUrl: pageUrl,
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Imagem destaque */}
          <div>
            <div className="overflow-hidden rounded-2xl border border-white/10">
              {ad.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  className="h-auto w-full object-cover"
                />
              ) : (
                <div className="aspect-video w-full bg-white/5" />
              )}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold leading-tight">{ad.title}</h1>
            <div className="text-emerald-400 text-2xl font-extrabold">
              {formatPriceBRL(ad.priceCents)}
            </div>

            {expiresText && (
              <div className="text-sm text-amber-400/90">⏳ {expiresText}</div>
            )}

            {ad.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {ad.description}
              </p>
            )}

            <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
              <WhatsAppButton
                sellerPhone={ad.sellerPhone ?? null}
                title={ad.title}
                adUrl={pageUrl}
              />

              <ShareButton
                url={pageUrl}
                title={shareTitle}
                text={shareText}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5"
              />
            </div>

            {ad.city && ad.uf && (
              <div className="pt-2 text-xs text-muted-foreground">
                {ad.city && ad.uf ? `${ad.city}/${ad.uf}` : null}
              </div>
            )}
          </div>
        </div>

        {/* Mapa */}
        {ad.centerLat && ad.centerLng && ad.radiusKm ? (
          <div className="mt-10">
            <AdMap
              center={{ lat: ad.centerLat, lng: ad.centerLng }}
              radiusKm={ad.radiusKm}
              marker={ad.lat && ad.lng ? { lat: ad.lat, lng: ad.lng } : null}
            />
          </div>
        ) : null}

        <div className="mt-8">
          <Link href="/" className="underline">← Voltar para a Home</Link>
        </div>
      </div>
    </main>
  );
}
