"use client";

type Props = {
  text: string;
};

export default function SharePreviewButtons({ text }: Props) {
  const openWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Mensagem copiada!");
    } catch {
      alert("Não foi possível copiar. Se preferir, selecione e copie manualmente.");
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        onClick={openWhatsApp}
        className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        aria-label="Abrir no WhatsApp"
      >
        Abrir no WhatsApp
      </button>

      <button
        onClick={copyToClipboard}
        className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5"
        aria-label="Copiar mensagem"
      >
        Copiar mensagem
      </button>
    </div>
  );
}
