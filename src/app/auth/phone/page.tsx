// src/app/auth/phone/page.tsx
'use client';

// Evita SSG/ISR/SSR para este segmento
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';

export default function AuthPhoneBridge() {
  useEffect(() => {
    try {
      // Lê ?next=... direto da URL (sem hooks do Next)
      const sp = new URLSearchParams(window.location.search);
      const next = sp.get('next') || '';

      // Seu fluxo antigo usa /verificar?redirect=...
      const target =
        '/verificar' + (next ? `?redirect=${encodeURIComponent(next)}` : '');

      // Redireciona para a tela de verificação
      window.location.replace(target);
    } catch {
      // Fallback defensivo
      window.location.replace('/verificar');
    }
  }, []);

  // Ponte sem UI
  return null;
}
