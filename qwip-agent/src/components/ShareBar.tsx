"use client";

import { useCallback, useMemo } from "react";

export default function ShareBar(props: {
  adId: string;
  title: string;
  priceText: string;
}) {
  const { adId, title, priceText } = props;

  const url = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/anuncio/${adId}`;
  }, [adId]);

  const waHref = useMemo(() => {
    const txt = `${title} - ${priceText}\n${url}`;
    return `https://wa.me/?text=${encodeURIComponent(txt)}`;
  }, [title, priceText, url]);

  const onShare = useCallback(async () => {
    try {
      const shareData = { title, text: `${title} - ${priceText}`, url };
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        alert("Link copiado para a área de transferência.");
      }
    } catch (err) {
      console.error("navigator.share falhou", err);
    }
  }, [title, priceText, url]);

  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
      >
        WhatsApp
      </a>
      <button
        onClick={onShare}
        className="inline-flex w-full items-center justify-center rounded-md border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5"
      >
        Compartilhar
      </button>
    </div>
  );
}
