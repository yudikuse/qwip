// src/components/ShareButtons.tsx
"use client";

import { useCallback, useState } from "react";

type Props = {
  title: string;
  priceText: string;
  url: string;
};

export default function ShareButtons({ title, priceText, url }: Props) {
  const [copied, setCopied] = useState(false);

  const onShare = useCallback(async () => {
    const text = `${title} - ${priceText}\n${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        /* usuário cancelou */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert("Copie este link:\n" + text);
    }
  }, [title, priceText, url]);

  return (
    <button
      onClick={onShare}
      className="mt-2 inline-flex w-full items-center justify-center rounded-md border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
    >
      {copied ? "Copiado!" : "Compartilhar"}
    </button>
  );
}
