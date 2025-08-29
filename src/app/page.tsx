// src/app/layout.tsx
import "./globals.css";

// Geist (Next >= 14)
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

// Inter como fallback (e para alguns subtítulos)
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Qwip — Venda mais no WhatsApp",
  description:
    "Anúncios rápidos com link direto pro WhatsApp. Publique em 60s, gere urgência e mantenha sua vitrine sempre atual.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="scroll-smooth">
      <body
        className={[
          GeistSans.variable,
          GeistMono.variable,
          inter.variable,
          // base visual
          "bg-[var(--bg)] text-[var(--foreground)] antialiased",
        ].join(" ")}
      >
        {children}
      </body>
    </html>
  );
}
