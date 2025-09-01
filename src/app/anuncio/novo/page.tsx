// src/app/anuncio/novo/page.tsx
"use client";

import { useState } from "react";

type FormState = {
  titulo: string;
  preco: string;
  cidade: string;
  descricao: string;
  whatsapp: string;
  fotos: File[];
};

export default function NovoAnuncioPage() {
  const [form, setForm] = useState<FormState>({
    titulo: "",
    preco: "",
    cidade: "",
    descricao: "",
    whatsapp: "",
    fotos: [],
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onInput<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.titulo.trim()) e.titulo = "Informe um título.";
    if (!/^\d+(,\d{2})?$/.test(form.preco.trim()))
      e.preco = "Preço no formato 99,90";
    if (!form.cidade.trim()) e.cidade = "Informe a cidade.";
    if (form.descricao.trim().length < 10)
      e.descricao = "Descreva um pouco melhor (mín. 10 caracteres).";
    if (!/^\+?\d{10,15}$/.test(form.whatsapp.replace(/\s|[-()]/g, "")))
      e.whatsapp = "WhatsApp inválido (inclua DDD, ex.: +55...).";
    if (form.fotos.length === 0) e.fotos = "Envie pelo menos 1 foto.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    // Próximo passo: enviar para API (/api/anuncios) e receber o link curto
    // Por enquanto, só simulamos:
    await new Promise((r) => setTimeout(r, 800));
    alert("Anúncio salvo (preview). Próxima etapa: gerar link do WhatsApp + expiração.");
    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="py-12">
        <div className="container mx-auto max-w-3xl px-6">
          <h1 className="text-3xl font-bold">Criar Anúncio</h1>
          <p className="mt-2 text-zinc-400">
            Preencha os dados abaixo. Depois conectamos seu WhatsApp para gerar o link.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-6">
            {/* Fotos */}
            <div>
              <label className="block text-sm font-medium mb-2">Fotos</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(ev) =>
                  onInput(
                    "fotos",
                    Array.from(ev.target.files ?? []).slice(0, 8) // limite 8 p/ agora
                  )
                }
                className="block w-full cursor-pointer rounded-lg border border-white/10 bg-card p-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-emerald-500 file:px-3 file:py-2 file:font-semibold file:text-[#0F1115] hover:file:bg-emerald-400"
              />
              {errors.fotos && <p className="mt-1 text-sm text-rose-400">{errors.fotos}</p>}
              {form.fotos.length > 0 && (
                <p className="mt-2 text-xs text-zinc-400">{form.fotos.length} arquivo(s) selecionado(s)</p>
              )}
            </div>

            {/* Título e preço */}
            <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
              <div>
                <label className="block text-sm font-medium mb-1">Título</label>
                <input
                  value={form.titulo}
                  onChange={(e) => onInput("titulo", e.target.value)}
                  placeholder="Ex.: Marmita Caseira Completa"
                  className="w-full rounded-lg border border-white/10 bg-card px-3 py-2 text-sm outline-none focus:border-emerald-500/60"
                />
                {errors.titulo && <p className="mt-1 text-sm text-rose-400">{errors.titulo}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preço</label>
                <input
                  value={form.preco}
                  onChange={(e) =>
                    onInput("preco", e.target.value.replace(/[^\d,]/g, ""))
                  }
                  placeholder="99,90"
                  className="w-full rounded-lg border border-white/10 bg-card px-3 py-2 text-sm outline-none focus:border-emerald-500/60"
                />
                {errors.preco && <p className="mt-1 text-sm text-rose-400">{errors.preco}</p>}
              </div>
            </div>

            {/* Cidade */}
            <div>
              <label className="block text-sm font-medium mb-1">Cidade</label>
              <input
                value={form.cidade}
                onChange={(e) => onInput("cidade", e.target.value)}
                placeholder="Ex.: Vila Olímpia, SP"
                className="w-full rounded-lg border border-white/10 bg-card px-3 py-2 text-sm outline-none focus:border-emerald-500/60"
              />
              {errors.cidade && <p className="mt-1 text-sm text-rose-400">{errors.cidade}</p>}
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium mb-1">Descrição</label>
              <textarea
                value={form.descricao}
                onChange={(e) => onInput("descricao", e.target.value)}
                rows={4}
                placeholder="Conte um pouco sobre o produto/serviço."
                className="w-full rounded-lg border border-white/10 bg-card px-3 py-2 text-sm outline-none focus:border-emerald-500/60"
              />
              {errors.descricao && (
                <p className="mt-1 text-sm text-rose-400">{errors.descricao}</p>
              )}
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-sm font-medium mb-1">
                WhatsApp (inclua o +55)
              </label>
              <input
                value={form.whatsapp}
                onChange={(e) => onInput("whatsapp", e.target.value)}
                placeholder="+55 11 90000-0000"
                className="w-full rounded-lg border border-white/10 bg-card px-3 py-2 text-sm outline-none focus:border-emerald-500/60"
              />
              {errors.whatsapp && (
                <p className="mt-1 text-sm text-rose-400">{errors.whatsapp}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="h-10 rounded-lg border border-white/10 px-4 text-sm font-semibold text-zinc-200 hover:bg-white/5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="h-10 rounded-lg bg-emerald-500 px-5 text-sm font-semibold text-[#0F1115] transition hover:bg-emerald-400 disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar e continuar"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
