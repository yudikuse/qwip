import type { Metadata } from "next";
import "./globals.css";

// Substitua pelo seu ID do Google Ads / GA4
const GTAG_ID = process.env.NEXT_PUBLIC_GTAG_ID ?? "";

export const metadata: Metadata = {
  title: "Qwip — Do caos ao controle, rápido.",
  description:
    "Ferramentas sob medida para varejo e serviços. Automatize, organize e tenha visibilidade do seu negócio em semanas.",
  openGraph: {
    title: "Qwip — Do caos ao controle, rápido.",
    description:
      "Ferramentas sob medida para varejo e serviços. Automatize, organize e tenha visibilidade do seu negócio em semanas.",
    url: "https://qwip.pro",
    siteName: "Qwip",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        {GTAG_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GTAG_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GTAG_ID}', { page_path: window.location.pathname });
                `,
              }}
            />
          </>
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
