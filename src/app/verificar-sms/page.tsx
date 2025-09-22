// src/app/verificar-sms/page.tsx
'use client';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { useEffect } from 'react';

export default function VerificarSmsAlias() {
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const next = sp.get('next') || '';
      const target =
        '/verificar' + (next ? `?redirect=${encodeURIComponent(next)}` : '');
      window.location.replace(target);
    } catch {
      window.location.replace('/verificar');
    }
  }, []);
  return null;
}
