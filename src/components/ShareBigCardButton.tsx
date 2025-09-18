"use client";

type Props = {
  imageUrl: string;   // use /anuncio/[id]/opengraph-image
  caption: string;    // legenda (inclua o link do anúncio)
  className?: string;
};

export default function ShareBigCardButton({ imageUrl, caption, className = "" }: Props) {
  const handleClick = async () => {
    // Fallback simples: abre wa.me só com o texto
    const openWaTextOnly = () =>
      window.open(`https://wa.me/?text=${encodeURIComponent(caption)}`, "_blank");

    try {
      // checa suporte à Web Share API
      const navAny: any = typeof navigator !== "undefined" ? (navigator as any) : undefined;
      const hasShareAPI = !!navAny?.share;

      if (!hasShareAPI) return openWaTextOnly();

      // baixa a imagem OG e prepara arquivo
      const res = await fetch(imageUrl, { cache: "no-store" });
      if (!res.ok) return openWaTextOnly();

      const blob = await res.blob();
      const file = new File([blob], "anuncio.png", { type: blob.type || "image/png" });

      // Se o navegador suporta compartilhar arquivos, envia imagem + legenda
      const canShareFiles =
        typeof navAny.canShare === "function" && navAny.canShare({ files: [file] });

      if (canShareFiles) {
        await navAny.share({ files: [file], text: caption });
        return;
      }

      // Caso só suporte texto/URL, tenta share(text) e cai no fallback se falhar
      try {
        await navAny.share({ text: caption });
      } catch {
        openWaTextOnly();
      }
    } catch {
      openWaTextOnly();
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
