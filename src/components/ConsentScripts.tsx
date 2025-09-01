'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

type Consent = { essential: true; analytics: boolean; marketing: boolean };

const COOKIE_NAME = 'qwip_consent';

function readConsent(): Consent | null {
  const match = document.cookie.split('; ').find(c => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split('=')[1])) as Consent;
  } catch {
    return null;
  }
}

export default function ConsentScripts() {
  const [analyticsOn, setAnalyticsOn] = useState(false);
  const [marketingOn, setMarketingOn] = useState(false);

  useEffect(() => {
    const c = readConsent();
    if (c) {
      setAnalyticsOn(!!c.analytics);
      setMarketingOn(!!c.marketing);
    }
    const onChange = () => {
      const c2 = readConsent();
      setAnalyticsOn(!!c2?.analytics);
      setMarketingOn(!!c2?.marketing);
    };
    window.addEventListener('qwip-consent-changed', onChange);
    return () => window.removeEventListener('qwip-consent-changed', onChange);
  }, []);

  const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
  const FB_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <>
      {/* Google Analytics (analytics) */}
      {analyticsOn && GA_ID && (
        <>
          <Script
            id="ga-src"
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}</Script>
        </>
      )}

      {/* Meta Pixel (marketing) */}
      {marketingOn && FB_ID && (
        <Script id="fb-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${FB_ID}');
          fbq('track', 'PageView');
        `}</Script>
      )}
    </>
  );
}
