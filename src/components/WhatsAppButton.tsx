// src/components/WhatsAppButton.tsx
"use client";

import React, { useMemo } from "react";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type Props = {
  /** Telefone do vendedor como foi salvo (com ou sem máscara). */
  sellerPhone?: string | null;
  /** Título do anúncio. */
  title: string;
  /** URL absoluta da página do anúncio. */
  adUrl: string;
  /** Classe opcional para estilização. */
  className?: string;
};

export default function WhatsAppButton({
  sellerPhone,
  title,
  adUrl,
  className,
}: Props) {
  const href = useMemo(() => {
    return buildWhatsAppUrl({
      phoneRaw: sellerPhone ?? null,
      title,
      adUrl,
    });
  }, [sellerPhone, title, adUrl]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-3 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
      }
    >
      Falar no WhatsApp
    </a>
  );
}
