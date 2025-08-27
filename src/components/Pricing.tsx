// src/components/Pricing.tsx
import Link from "next/link";

const plans = [
  { name: "FREE", price: "R$0", features: ["Até 10 anúncios/mês", "Link do WhatsApp", "Vitrine básica"], cta: "Começar grátis" },
  { name: "LITE", price: "R$49,90/mês", features: ["Até 100 anúncios/mês", "Vitrine com filtros", "Suporte por email"], cta: "Assinar LITE" },
  { name: "PRO", price: "R$99,90/mês", features: ["Anúncios ilimitados", "Prioridade na vitrine", "Dashboard completo"], cta: "Assinar PRO" },
  { name: "BUSINESS", price: "R$199,90/mês", features: ["Equipe/multi-usuário", "Boosts e destaque", "Integrações avançadas"], cta: "Assinar BUSINESS" },
];

export default function Pricing() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-3xl font-bold text-center mb-2">Planos que cabem no bolso</h2>
      <p className="text-center text-gray-600 mb-10">
        Comece grátis e evolua quando fizer sentido. Cancele quando quiser.
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((p) => (
          <div key={p.name} className="rounded-2xl border border-gray-200 p-6 flex flex-col">
            <div className="mb-4">
              <h3 className="text-xl font-semibold">{p.name}</h3>
              <div className="text-2xl font-bold mt-1">{p.price}</div>
            </div>

            <ul className="text-sm text-gray-700 space-y-2 mb-6 flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-black" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl border border-black px-4 py-2 text-sm font-medium hover:bg-black hover:text-white transition"
            >
              {p.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
