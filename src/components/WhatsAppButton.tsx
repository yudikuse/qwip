"use client";

import React, { useMemo } from "react";

type Props = {
  // Se você tiver o campo no banco, passe aqui.
  // Pode ser "5599999999999" (com DDI e DDD) sem +, só dígitos.
  sellerPhone?: string | null;

  // Mensagem/URL do anúncio para montar o texto
  shareUrl: string;
  title: string;
  cityUf?: string;
  className?: string;
};

function onlyDigits(s?: string | null) {
  return (s ?? "").replace(/\D+/g, "");
}

export default function WhatsAppButton({
  sellerPhone,
  shareUrl,
  title,
  cityUf,
  className,
}: Props) {
  const href = useMemo(() => {
    const texto = `Olá! Tenho interesse no anúncio: ${title}${cityUf ? " (" + cityUf + ")" : ""}\n${shareUrl}`;
    const msg = encodeURIComponent(texto);

    const phone = onlyDigits(sellerPhone);
    // Se há telefone do vendedor => direto no vendedor
    if (phone) {
      return `https://wa.me/${phone}?text=${msg}`;
    }
    // Senão, abre o "compartilhar no WhatsApp" com o texto pronto
    return `https://wa.me/?text=${msg}`;
  }, [sellerPhone, shareUrl, title, cityUf]);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? "px-4 py-2 rounded-xl bg-green-600 text-white font-medium inline-flex items-center justify-center"}
    >
      WhatsApp
    </a>
  );
}
