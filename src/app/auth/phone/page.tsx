// src/app/auth/phone/page.tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AuthPhoneBridge() {
  const sp = useSearchParams();

  useEffect(() => {
    const next = sp.get('next') || '';
    const target =
      '/verificar' + (next ? `?redirect=${encodeURIComponent(next)}` : '');
    // redireciona sem envolver Suspense/SSR
    window.location.replace(target);
  }, [sp]);

  return null; // página-ponte, sem UI
}
