// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import CookieBanner from "../components/CookieBanner"; // import RELATIVO (evita problema de path alias)

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
    type: "website"
  },
  icons: { icon: "/favicon.ico" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={[
          inter.variable,
          "font-sans",
          "bg-background text-foreground",
          "antialiased"
        ].join(" ")}
      >
        {children}
        {/* Client component, sem dynamic({ ssr:false }) */}
        <CookieBanner />
      </body>
    </html>
  );
}
