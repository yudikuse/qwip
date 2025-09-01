import "./globals.css";
import type { Metadata } from "next";

// fontes Geist (já instaladas no projeto)
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

export const metadata: Metadata = {
  title: "Qwip — Venda HOJE",
  description: "Anúncios rápidos. Link direto pro WhatsApp.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={[
          GeistSans.variable,
          GeistMono.variable,
          "font-sans bg-page text-zinc-200 antialiased selection:bg-brand/30",
        ].join(" ")}
      >
        {children}

      // src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
// ... seus imports atuais
import CookieBanner from "@/components/CookieBanner";

export const metadata: Metadata = {
  title: "Qwip — Verificação",
  description: "Envio e verificação de código via WhatsApp/SMS.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#0b0f12] text-zinc-100">
        {children}
        {/* Banner de Cookies */}
        <CookieBanner />
      </body>
    </html>
  );
}

      
      </body>
    </html>
  );
}
