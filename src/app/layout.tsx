// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import CookieBanner from "@/components/CookieBanner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Qwip — Venda HOJE",
  description:
    "Crie anúncios que expiram sozinhos, compartilhe o link direto pro WhatsApp e venda mais rápido.",
  metadataBase: new URL("https://qwip.pro"),
  openGraph: {
    title: "Qwip — Venda HOJE",
    description:
      "Crie anúncios que expiram sozinhos, compartilhe o link direto pro WhatsApp e venda mais rápido.",
    url: "https://qwip.pro",
    siteName: "Qwip",
    type: "website",
  },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} font-sans bg-background text-foreground antialiased`}>
        <CookieBanner />
        {children}
      </body>
    </html>
  );
}

