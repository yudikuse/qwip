// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

// fontes Geist (já instaladas no projeto)
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

export const metadata: Metadata = {
  title: "Qwip — Venda HOJE",
  description: "Anúncios rápidos. Link direto pro WhatsApp.",
  metadataBase: new URL("https://qwip.pro"),
  openGraph: {
    title: "Qwip — Venda HOJE",
    description: "Anúncios rápidos. Link direto pro WhatsApp.",
    url: "https://qwip.pro",
    siteName: "Qwip",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Qwip — Venda HOJE",
    description: "Anúncios rápidos. Link direto pro WhatsApp.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={[
          GeistSans.variable,
          GeistMono.variable,
          "font-sans bg-[#0b0f12] text-zinc-100 antialiased",
        ].join(" ")}
      >
        {children}
      </body>
    </html>
  );
}
