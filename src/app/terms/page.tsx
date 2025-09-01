// src/app/terms/page.tsx
import type { Metadata } from 'next';
import { termsTitle, TermsBody } from '@/content/legal-pt';

export const metadata: Metadata = {
  title: termsTitle,
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold mb-6">{termsTitle}</h1>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 shadow-xl">
          {TermsBody}
        </div>
      </section>
    </main>
  );
}
