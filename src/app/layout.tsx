// src/app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import dynamic from "next/dynamic";

const CookieBanner = dynamic(() => import("@/components/CookieBanner"), {
  ssr: false,
});

export const metadata: Metadata = {
  title: "Qwip — Venda HOJE",
  description:
    "Crie seu anúncio em 60s, compartilhe o link e receba respostas no WhatsApp. Simples, rápido e sem intermediação.",
  metadataBase: new URL("https://qwip.pro"),
  icons: [{ rel: "icon", url: "/favicon.ico" }],
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
          "bg-[#0b0e11] text-zinc-100 antialiased min-h-screen",
        ].join(" ")}
      >
        {children}
        {/* Renderiza apenas no client */}
        <CookieBanner />
      </body>
    </html>
  );
}
