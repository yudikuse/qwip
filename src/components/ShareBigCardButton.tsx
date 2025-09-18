"use client";

type Props = {
  imageUrl: string;   // URL da imagem (use a nossa /opengraph-image)
  caption: string;    // legenda (inclua o link do anúncio)
  className?: string;
};

export default function ShareBigCardButton({ imageUrl, caption, className = "" }: Props) {
  const handleClick = async () => {
    try {
      // Fallback simples: se Web Share c/ arquivos não existir, manda só o texto
      const goTextOnly = () =>
        window.open(`https://wa.me/?text=${encodeURIComponent(caption)}`, "_blank");

      // @ts-expect-error canShare não está no TS de todos os targets
      const canShare = typeof navigator !== "undefined" && navigator?.canShare;
      const canUseShare = typeof navigator !== "undefined" && "share" in navigator;

      if (!canUseShare || !canShare) {
        return goTextOnly();
      }

      // baixa a imagem e anexa como arquivo
      const res = await fetch(imageUrl, { cache: "no-store" });
      if (!res.ok) return goTextOnly();
      const blob = await res.blob();
      const file = new File([blob], "anuncio.png", { type: blob.type || "image/png" });

      // @ts-expect-error Web Share Level 2
      if (navigator.canShare?.({ files: [file] })) {
        // @ts-expect-error Web Share Level 2
        await navigator.share({ files: [file], text: caption });
        return;
      }

      return goTextOnly();
    } catch {
      // último fallback
      window.open(`https://wa.me/?text=${encodeURIComponent(caption)}`, "_blank");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        "inline-flex w-full items-center justify-center rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800 " +
        className
      }
    >
      WhatsApp (cartão grande)
    </button>
  );
}
