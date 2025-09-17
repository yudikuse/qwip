"use client";

import React from "react";

type Props = {
  url: string;          // URL canônica do anúncio
  title: string;        // Título do anúncio
  text?: string;        // Texto curto opcional
  className?: string;
};

export default function ShareButton({ url, title, text, className }: Props) {
  const onClick = async () => {
    const payload = { title, text, url };
    try {
      // Mobile moderno (iOS/Android/Chrome)
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
      // Fallback: copia pro clipboard
      await navigator.clipboard.writeText(url);
      // feedback simples
      alert("Link copiado!");
    } catch {
      // usuário cancelou ou share não suportado; tenta copiar
      try {
        await navigator.clipboard.writeText(url);
        alert("Link copiado!");
      } catch {}
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={className ?? "px-4 py-2 rounded-xl bg-blue-600 text-white font-medium"}
    >
      Compartilhar
    </button>
  );
}
