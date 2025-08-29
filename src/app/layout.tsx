// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Inter, JetBrains_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Qwip — Venda HOJE",
  description:
    "Anúncios rápidos com link direto para o WhatsApp. Publique em 60s e venda hoje com o Qwip.",
  metadataBase: new URL("https://qwip.pro"),
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-[#0B0F0D] text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}

/**
 * OPCIONAL (se quiser usar a fonte Geist do Figma):
 * 1) npm i geist
 * 2) Troque as imports acima por:
 *
 *    import { Geist as GeistSans, Geist_Mono as GeistMono } from "geist/font";
 *    const inter = GeistSans({ variable: "--font-sans" });
 *    const mono  = GeistMono({ variable: "--font-mono" });
 */
