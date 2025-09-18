"use client";

type Props = {
  sellerPhone: string | null;
  title: string;
  priceCents: number;
  adUrl: string;
  /** Quando true, envia apenas o link (necessário para preview grande do WhatsApp) */
  linkOnly?: boolean;
  className?: string;
};

function formatPriceBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

function onlyDigits(s: string) {
  return s.replace(/\D+/g, "");
}

export default function WhatsAppButton({
  sellerPhone,
  title,
  priceCents,
  adUrl,
  linkOnly = false,
  className = "",
}: Props) {
  const phone = sellerPhone ? onlyDigits(sellerPhone) : null;

  const defaultMsg =
    `Olá! Tenho interesse no anúncio: ${title} - ${formatPriceBRL(priceCents)}.` +
    ` Está disponível?\n${adUrl}`;

  // Para o preview grande, a mensagem precisa conter apenas o link
  const text = linkOnly ? adUrl : defaultMsg;

  const href = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        "inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 " +
        className
      }
    >
      Falar no WhatsApp
    </a>
  );
}
