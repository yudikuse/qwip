"use client";

import { useCallback, useState } from "react";

export default function ShareButtons({
  url,
  title,
  text,
}: {
  url: string;
  title: string;
  text?: string;
}) {
  const [copied, setCopied] = useState(false);

  const doShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({ url, title, text });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* usuário cancelou */
    }
  }, [url, title, text]);

  return (
    <button
      onClick={doShare}
      className="mt-2 inline-flex w-full items-center justify-center rounded-md border border-white/10 bg-card px-3 py-2 text-sm hover:bg-white/5"
    >
      {copied ? "Link copiado!" : "Compartilhar"}
    </button>
  );
}
