// src/app/page.tsx
import Link from "next/link";
import Pricing from "@/components/Pricing";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* HERO simples (placeholder) */}
      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight">Qwip MVP online ✅</h1>
        <p className="mt-3 text-gray-600">
          Deploy funcionando na Vercel. Agora vamos plugar o layout do Figma e as rotas da vitrine.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl border border-black px-4 py-2 text-sm font-medium hover:bg-black hover:text-white transition"
          >
            Abrir Dashboard (placeholder)
          </Link>
          <Link
            href="/vitrine"
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 transition"
          >
            Ver Vitrine (placeholder)
          </Link>
        </div>
      </section>

      {/* PRICING com os planos */}
      <Pricing />
    </main>
  );
}
