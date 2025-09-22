// src/app/auth/phone/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';

export default function AuthPhoneBridge() {
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
