// src/components/CookieBanner.tsx
export default function CookieBanner() {
  return (
    <div
      className="
        fixed bottom-4 right-4 left-4 md:left-auto md:right-6 md:bottom-6
        z-[9999]                       /* <- garante que fica acima do mapa */
        rounded-xl border border-white/10 bg-card/95 backdrop-blur
        shadow-xl p-4 text-sm
      "
      role="dialog" aria-live="polite"
    >
      {/* ...conteúdo... */}
    </div>
  );
}
