import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  metadataBase: new URL("https://qwip.pro"),
  title: {
    default: "Qwip — Venda HOJE",
    template: "%s · Qwip",
  },
  description:
    "Anúncios rápidos e vitrines locais com CTR alto via WhatsApp. Publique, gere leads e venda hoje.",
  keywords: [
    "anúncios locais",
    "vitrine",
    "marketplace local",
    "WhatsApp",
    "Qwip",
    "leads",
  ],
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
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: { icon: "/favicon.ico" },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* GA4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-501795219"
          strategy="afterInteractive"
        />
        <Script id="ga4" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-501792219');
          `}
        </Script>
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
