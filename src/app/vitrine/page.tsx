// src/app/vitrine/page.tsx
import Link from "next/link";

export default function VitrinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-4">Vitrine (placeholder)</h1>
      <p className="text-gray-600 mb-6">Aqui vai o grid de anúncios da vitrine.</p>
      <Link href="/" className="underline">
        ← Voltar para a Home
      </Link>
    </main>
  );
}
