// src/app/verificar-sms/page.tsx
'use client';

import { useEffect } from 'react';

export default function VerificarSmsAlias() {
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const next = sp.get('next') || ''; // compatível com o que você usava ao testar
      const target =
        '/verificar' + (next ? `?redirect=${encodeURIComponent(next)}` : '');
      window.location.replace(target);
    } catch {
      window.location.replace('/verificar');
    }
  }, []);

  return null;
}
