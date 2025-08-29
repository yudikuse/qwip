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
      </body>
    </html>
  );
}
