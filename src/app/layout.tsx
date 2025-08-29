import "./globals.css";
import type { Metadata } from "next";
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
          GeistSans.variable,    // --font-geist-sans
          GeistMono.variable,    // --font-geist-mono
          "font-sans bg-background text-foreground antialiased",
        ].join(" ")}
      >
        {children}
      </body>
    </html>
  );
}
