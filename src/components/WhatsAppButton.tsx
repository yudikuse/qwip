// src/components/WhatsAppButton.tsx
"use client";

import React, { useMemo } from "react";
import { buildWhatsAppUrl, toBrazilE164 } from "@/lib/whatsapp";

type Props = {
  sellerPhone: string | null | undefined; // telefone do vendedor (qualquer formato)
  title: string;                          // título do anúncio
  priceCents: number;                     // preço em centavos
  adUrl: string;                          // URL absoluta do anúncio
  className?: string;
};

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export default function WhatsAppButton({
  sellerPhone,
  title,
  priceCents,
  adUrl,
  className,
}: Props) {
  const { href, disabled } = useMemo(() => {
    const price = formatBRL(priceCents);
    const msg = `Olá! Tenho interesse no anúncio: ${title} - ${price}. Está disponível? ${adUrl}`;

    // aceita telefone "sujo" mas garante E.164 (55...) antes de montar a URL
    const normalized = toBrazilE164(sellerPhone ?? "");
    const link = normalized ? buildWhatsAppUrl(normalized, msg) : null;

    return {
      href: link ?? "",
      disabled: !link,
    };
  }, [sellerPhone, title, priceCents, adUrl]);

  return (
    <a
      href={disabled ? undefined : href}
      target={disabled ? undefined : "_blank"}
      rel={disabled ? undefined : "noopener noreferrer"}
      aria-disabled={disabled}
      className={
        className ??
        "inline-flex w-full items-center justify-center rounded-xl px-3 py-2 text-sm font-semibold " +
          (disabled
            ? "cursor-not-allowed bg-gray-400/40 text-gray-500"
            : "bg-emerald-400 text-[#0F1115] hover:bg-emerald-500")
      }
      onClick={(e) => {
        if (disabled) e.preventDefault();
      }}
      title={disabled ? "Telefone do vendedor não informado" : "Falar no WhatsApp"}
    >
      Falar no WhatsApp
    </a>
  );
}

