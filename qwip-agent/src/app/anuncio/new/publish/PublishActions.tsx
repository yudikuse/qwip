// src/app/anuncio/new/publish/PublishActions.tsx
"use client";

import { useRouter } from "next/navigation";

type Props = {
  adId: string;
  shareUrl: string;      // URL pública do anúncio
  title: string;
  priceCents: number;
  imageUrl?: string | null;
};

export default function PublishActions({ adId, shareUrl, title, priceCents, imageUrl }: Props) {
  const router = useRouter();
  const price = (priceCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const whatsText = encodeURIComponent(
    `Olá! Tenho interesse neste anúncio:
${title} — ${price}
${shareUrl}`
  );

  return (
    <div className="flex gap-3">
      <button
        onClick={() => router.push(`/anuncio/${adId}`)}
        className="rounded-lg bg-white text-black px-4 py-2 font-medium hover:opacity-90"
      >
        Ver anúncio
      </button>

      <a
        href={`https://wa.me/?text=${whatsText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-white/20 px-4 py-2 hover:bg-white/10"
      >
        Enviar no WhatsApp
      </a>

      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(shareUrl);
            alert("Link copiado!");
          } catch {
            window.open(shareUrl, "_blank");
          }
        }}
        className="rounded-lg border border-white/20 px-4 py-2 hover:bg-white/10"
      >
        Copiar link
      </button>
    </div>
  );
}
