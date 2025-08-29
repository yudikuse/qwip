// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

// Fonts do Figma (Geist)
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

export const metadata: Metadata = {
  title: "Qwip — Venda HOJE",
  description: "Anúncios rápidos. Link direto pro WhatsApp.",
  metadataBase: new URL("https://qwip.pro"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="font-sans antialiased bg-[#0C0E10] text-[#E6F4EF]">
        {children}
      </body>
    </html>
  );
}
