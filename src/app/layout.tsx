import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://qwip.pro"),
  title: {
    default: "Qwip — Venda HOJE",
    template: "%s · Qwip",
  },
  description:
    "Anúncios rápidos e vitrines locais com CTR alto via WhatsApp. Publique, gere leads e venda hoje.",
  openGraph: {
    title: "Qwip — Venda HOJE",
    description:
      "Anúncios rápidos e vitrines locais com CTR alto via WhatsApp. Publique, gere leads e venda hoje.",
    url: "https://qwip.pro",
    siteName: "Qwip",
    images: [{ url: "/og-qwip.png", width: 1200, height: 630 }],
    type: "website",
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Qwip — Venda HOJE",
    description:
      "Anúncios rápidos e vitrines locais com CTR alto via WhatsApp. Publique, gere leads e venda hoje.",
    images: ["/og-qwip.png"],
  },
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}

