// src/app/anuncio/novo/page.tsx
import { redirect } from 'next/navigation';

export default function Page() {
  redirect('/anunciar'); // garante o fallback mesmo sem os redirects do Next
}
