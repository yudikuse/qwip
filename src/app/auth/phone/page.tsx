// src/app/auth/phone/page.tsx
'use client';

// Evita SSG/ISR e qualquer pré-render estático
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect } from 'react';

export default function AuthPhoneBridge() {
  useEffect(() => {
    try {
      // Lê ?next=... diretamente da URL (sem hooks do Next)
      const sp = new URLSearchParams(window.location.search);
      const next = sp.get('next') || '';

      // Fluxo original do backup usa /verificar?redirect=...
      const target =
        '/verificar' + (next ? `?redirect=${encodeURIComponent(next)}` : '');

      // Redireciona para a tela de verificação
      window.location.replace(target);
    } catch {
      // Fallback defensivo: vai para /verificar sem parâmetros
      window.location.replace('/verificar');
    }
  }, []);

  return null; // página-ponte, sem UI
}
