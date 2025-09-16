import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import AdMap from "@/components/AdMap";

/** Campos retornados pelo /api/ads/[id]  */
type Ad = {
  id: string;
  title: string;
  description: string;
  priceCents: number;
  city: string;
  uf: string;
  // localização
  lat: number | null;
  lng: number | null;
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number | null;
  // imagem e contato
  imageUrl: string | null;
  // o backend pode devolver um destes campos — tratamos todos:
  phoneE164?: string | null;
  whatsappE164?: string | null;
  contactPhone?: string | null;
  // datas
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

/* ===================== Open Graph / Share preview ===================== */
export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${host}`;

  const ad = await fetchAd(base, id);
  if (!ad) {
    return {
      title: "Anúncio não encontrado",
      description: "O anúncio pode ter expirado ou sido removido.",
      openGraph: {
        title: "Anúncio não encontrado",
        description: "O anúncio pode ter expirado ou sido removido.",
        url: `${base}/anuncio/${id}`,
        images: [],
      },
    };
  }

  const title = `${ad.title} — ${formatPrice(ad.priceCents)}`;
  const description =
    ad.description?.slice(0, 160) ||
    `${ad.city}${ad.uf ? `, ${ad.uf}` : ""} • ${formatPrice(ad.priceCents)}`;

  return {
    title,
    description,
    alternates: { canonical: `${base}/anuncio/${ad.id}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${base}/anuncio/${ad.id}`,
      images: ad.imageUrl ? [{ url: ad.imageUrl, width: 1200, height: 630, alt: ad.title }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ad.imageUrl ? [ad.imageUrl] : [],
    },
  };
}

/* ========================= Página do anúncio ========================= */
export default async function Page(props: { params: Promise<{ id: string }> }) {
  // Next.js 15: params é Promise
  const { id } = await props.params;

  // headers() também é assíncrono no 15
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

  // centro do círculo no mapa
  const center =
    (ad.centerLat != null && ad.centerLng != null && { lat: ad.centerLat, lng: ad.centerLng }) ||
    (ad.lat != null && ad.lng != null && { lat: ad.lat, lng: ad.lng }) ||
    null;

  // link do próprio anúncio
  const adUrl = `${base}/anuncio/${ad.id}`;

  // telefone em E.164 (usa o que o backend enviar)
  const phone =
    ad.whatsappE164 || ad.phoneE164 || ad.contactPhone || ""; // tolerante a diferentes nomes

  // mensagem pronta para o comprador
  const msg = [
    `Olá! Vi este anúncio no Qwip e me interessei 👇`,
    ``,
    `${ad.title} — ${formatPrice(ad.priceCents)}`,
    `${ad.city}${ad.uf ? `, ${ad.uf}` : ""}`,
    adUrl,
  ].join("\n");

  // link WhatsApp (se não houver telefone, cai no Web WhatsApp em branco com a mensagem)
  const waHref = phone
    ? `https://wa.me/${encodeURIComponent(phone)}?text=${encodeURIComponent(msg)}`
    : `https://wa.me/?text=${encodeURIComponent(msg)}`;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {/* cabeçalho */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="truncate text-2xl font-bold">{ad.title}</h1>
          <Link
            href="/vitrine"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
          >
            Voltar
          </Link>
        </div>

        {/* grade principal */}
        <div className="grid items-start gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          {/* esquerda: mídia + descrição */}
          <article className="overflow-hidden rounded-2xl border border-white/10 bg-card">
            <div className="relative aspect-[4/3] w-full bg-zinc-900">
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
            </div>

            <div className="grid gap-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-semibold">{formatPrice(ad.priceCents)}</div>
                  <div className="text-sm text-zinc-400">
                    {ad.city}
                    {ad.uf ? `, ${ad.uf}` : ""}
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-amber-400/20">
                  Expira em 24h
                </span>
              </div>

              <p className="whitespace-pre-wrap leading-relaxed text-zinc-200">{ad.description}</p>

              {/* ações (mobile) */}
              <div className="mt-1 grid grid-cols-2 gap-3 sm:hidden">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-[#0F1115] transition hover:bg-emerald-400"
                >
                  WhatsApp
                </a>

                <a
                  href={adUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/5"
                >
                  Compartilhar
                </a>
              </div>
            </div>
          </article>

          {/* direita: mapa + ações */}
          <aside className="sticky top-6 grid gap-4 rounded-2xl border border-white/10 bg-card p-5">
            <div className="text-sm font-semibold">Área do anúncio</div>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <AdMap center={center} radiusKm={ad.radiusKm ?? 5} height={260} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-[#0F1115] transition hover:bg-emerald-400"
              >
                WhatsApp
              </a>
              <a
                href={adUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/5"
              >
                Compartilhar
              </a>
            </div>

            <p className="mt-1 text-xs text-zinc-500">
              O link de compartilhar já inclui *thumb*, título e descrição do seu anúncio (Open
              Graph). Ao enviar no WhatsApp ou redes sociais, a prévia sai com a foto do anúncio.
            </p>
          </aside>
        </div>
      </div>

      {/* JSON-LD para enriquecer o preview/SEO */}
      <script
        type="application/ld+json"
        // @ts-expect-error – JSON dentro do dangerouslySetInnerHTML
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: ad.title,
            description: ad.description,
            image: ad.imageUrl ? [ad.imageUrl] : undefined,
            offers: {
              "@type": "Offer",
              priceCurrency: "BRL",
              price: (ad.priceCents / 100).toFixed(2),
              availability: "https://schema.org/InStock",
              url: adUrl,
            },
          }),
        }}
      />
    </main>
  );
}
