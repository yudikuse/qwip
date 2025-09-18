import { headers } from "next/headers";
import type { Metadata } from "next";
import SharePreviewButtons from "@/components/SharePreviewButtons";

type Ad = {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  createdAt: string;
  expiresAt: string | null;
};

export const dynamic = "force-dynamic";

function formatPriceBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

async function getBaseFromHeaders() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

async function fetchAd(base: string, id: string): Promise<Ad | null> {
  const r = await fetch(`${base}/api/ads/${id}`, { cache: "no-store" });
  if (!r.ok) return null;
  const data = await r.json();
  return (data?.ad ?? null) as Ad | null;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? (await getBaseFromHeaders());
  const ad = await fetchAd(base, id);

  const title = ad ? `Compartilhar: ${ad.title}` : "Compartilhar anúncio";
  const description =
    ad?.description?.slice(0, 160) ?? "Pré-visualize e compartilhe este anúncio.";

  return {
    title,
    description,
    alternates: { canonical: `${base}/anuncio/${id}/compartilhar` },
  };
}

export default async function SharePreviewPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? (await getBaseFromHeaders());
  const ad = await fetchAd(base, id);

  if (!ad) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold">Anúncio não encontrado</h1>
          <p className="mt-2 text-muted-foreground">
            Verifique o link e tente novamente.
          </p>
        </div>
      </main>
    );
  }

  const pageUrl = `${base}/anuncio/${ad.id}`;
  const price = formatPriceBRL(ad.priceCents);

  // Mensagem padrão que usamos em WA
  const message = `Olá! Tenho interesse no anúncio: ${ad.title} — ${price}. Está disponível? ${pageUrl}`;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-xl font-semibold">Preview de compartilhamento</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Veja como a mensagem será enviada e compartilhe com um toque.
        </p>

        {/* Card que simula o “cartão” do WhatsApp */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
          {ad.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="aspect-[16/9] w-full object-cover"
            />
          ) : null}

          <div className="space-y-2 p-4">
            <div className="inline-flex rounded-md bg-emerald-600/15 px-2 py-1 text-xs font-semibold text-emerald-300">
              {price}
            </div>

            <div className="text-base font-semibold">{ad.title}</div>

            <div className="text-xs text-muted-foreground">qwip.pro</div>

            <div className="mt-2 rounded-lg bg-white/[0.03] p-3 text-sm leading-relaxed">
              {message}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="mt-6">
          <SharePreviewButtons text={message} />
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Dica: edite a mensagem acima se quiser personalizar antes de copiar/abrir.
        </p>
      </div>
    </main>
  );
}
