// src/components/SidebarCta.tsx
import Link from "next/link";
import ShareButton from "@/components/ShareButtons";
import WhatsAppButton from "@/components/WhatsAppButton";

type Props = {
  sellerPhone: string | null;
  title: string;
  priceCents: number;
  pageUrl: string;
  shareTitle: string;
  shareText: string;
  isExpired: boolean;
};

export default function SidebarCta({
  sellerPhone,
  title,
  priceCents,
  pageUrl,
  shareTitle,
  shareText,
  isExpired,
}: Props) {
  return (
    <aside className="rounded-2xl border border-white/10 p-4 md:sticky md:top-6">
      <div className="mb-3 text-sm font-semibold text-muted-foreground">
        Interessado?
      </div>

      <div className="grid grid-cols-2 gap-3">
        {isExpired ? (
          <button
            disabled
            className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-muted-foreground"
            title="Anúncio expirado"
          >
            Falar no WhatsApp
          </button>
        ) : (
          <WhatsAppButton
            sellerPhone={sellerPhone}
            title={title}
            priceCents={priceCents}
            adUrl={pageUrl}
          />
        )}

        <Link
          href="/"
          className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5"
        >
          Criar seu anúncio
        </Link>
      </div>

      <div className="mt-3">
        <ShareButton
          url={pageUrl}
          title={shareTitle}
          text={shareText}
          className="inline-flex w-full items-center justify-center rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5"
        />
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        Vendedor verificado por SMS • anúncio com validade de 24h
      </p>
    </aside>
  );
}
