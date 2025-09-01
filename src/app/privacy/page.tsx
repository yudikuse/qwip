// src/app/privacy/page.tsx
import type { Metadata } from 'next';
import { privacyTitle, PrivacyBody } from '@/content/legal-pt';

export const metadata: Metadata = {
  title: privacyTitle,
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      <section className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold mb-6">{privacyTitle}</h1>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-6 shadow-xl">
          {PrivacyBody}
        </div>
      </section>
    </main>
  );
}
