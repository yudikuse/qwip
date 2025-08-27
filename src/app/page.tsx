// src/app/page.tsx
export default function Home() {
  return (
    <main className="min-h-screen grid place-items-center p-10">
      <div className="max-w-xl text-center">
        <h1 className="text-4xl font-extrabold">Qwip MVP online ✅</h1>
        <p className="mt-3 text-lg text-gray-600">
          Deploy funcionando na Vercel. Agora vamos plugar o layout do Figma e as rotas da vitrine.
        </p>

        <div className="mt-8 inline-flex gap-3">
          <a
            href="/dashboard"
            className="rounded-lg px-5 py-3 bg-black text-white hover:opacity-90"
          >
            Abrir Dashboard (placeholder)
          </a>
          <a
            href="/vitrine"
            className="rounded-lg px-5 py-3 border border-gray-300 hover:bg-gray-50"
          >
            Ver Vitrine (placeholder)
          </a>
        </div>
      </div>
    </main>
  );
}

