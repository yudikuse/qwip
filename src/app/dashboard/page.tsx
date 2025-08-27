// src/app/dashboard/page.tsx
import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-2">Dashboard (placeholder)</h1>
      <p className="text-gray-600 mb-6">Próximo passo: puxar o layout do Figma e criar cards.</p>
      <Link href="/" className="underline">
        ← Voltar para a Home
      </Link>
    </main>
  );
}
