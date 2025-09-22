// src/app/verificar-sms/page.tsx
'use client';

// Impede SSG/ISR/SSR neste segmento
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';

export default function VerificarSmsAlias() {
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const next = sp.get('next') || '';
      // Fluxo antigo usa ?redirect=
      const target =
        '/verificar' + (next ? `?redirect=${encodeURIComponent(next)}` : '');
      window.location.replace(target);
    } catch {
      window.location.replace('/verificar');
    }
  }, []);

  return null; // ponte sem UI
}
