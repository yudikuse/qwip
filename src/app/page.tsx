import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Qwip MVP online ✅</h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          Deploy funcionando na Vercel. Agora vamos plugar o layout do Figma e as rotas da vitrine.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="bg-black text-white px-4 py-2 rounded">
            Abrir Dashboard (placeholder)
          </Link>
          <Link href="/vitrine" className="border px-4 py-2 rounded">
            Ver Vitrine (placeholder)
          </Link>
        </div>
      </div>
    </main>
  );
}
