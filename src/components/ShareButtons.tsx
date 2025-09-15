"use client";

import { useCallback } from "react";

type Props = {
  title: string;
  priceLabel: string;
  url: string;
};

export default function ShareButtons({ title, priceLabel, url }: Props) {
  const handleShare = useCallback(async () => {
    const text = `${title} - ${priceLabel}\n${url}`;

    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({
          title,
          text,
          url,
        });
      } else if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        alert("Link do anúncio copiado!");
      } else {
        // fallback final
        const a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.click();
      }
    } catch {
      // usuário cancelou ou erro — não precisa fazer nada
    }
  }, [title, priceLabel, url]);

  return (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} - ${priceLabel}\n${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
      >
        WhatsApp
      </a>

      <button
        type="button"
        onClick={handleShare}
        className="inline-flex w-full items-center justify-center rounded-md border border-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/5"
      >
        Compartilhar
      </button>
    </div>
  );
}
