// src/app/terms/page.tsx
import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(60%_60%_at_50%_-10%,rgba(32,209,119,0.25),transparent_60%)]" />
        <div className="container mx-auto px-4 pt-16 pb-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Link href="/" className="hover:underline">Início</Link>
              <span className="opacity-50">/</span>
              <span>Termos de Uso</span>
            </div>

            <h1 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight">
              Termos de Uso <span className="text-[var(--color-primary)]">Qwip</span>
            </h1>
            <p className="mt-3 text-zinc-400">
              Leia atentamente. Ao utilizar o Qwip, você concorda com estes termos.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 text-xs text-zinc-400">
              <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-primary)]" />
              Última atualização: 30/08/2025
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="container mx-auto px-4 pb-24">
        <div className="mx-auto max-w-3xl space-y-6">
          <article className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-lg/10">
            <h2 className="text-xl font-semibold">1. Sobre o Qwip</h2>
            <p className="mt-3 text-zinc-300">
              O Qwip é uma plataforma para criação de anúncios e vitrine com
              compartilhamento e verificação via WhatsApp. Prestamos serviços de
              disponibilização de interface, integração e hospedagem do conteúdo
              criado por você (“Usuário”).
            </p>
          </article>

          <article className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-lg/10">
            <h3 className="text-lg font-semibold">2. Cadastro e Verificação</h3>
            <ul className="mt-3 space-y-2 text-zinc-300">
              <li>• O uso pode exigir verificação do número via WhatsApp (OTP).</li>
              <li>• Você se responsabiliza pela veracidade dos dados informados.</li>
              <li>• Medidas antifraude podem ser aplicadas para proteger a plataforma.</li>
            </ul>
          </article>

          <article className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-lg/10">
            <h3 className="text-lg font-semibold">3. Uso Aceitável</h3>
            <ul className="mt-3 space-y-2 text-zinc-300">
              <li>• É proibido publicar conteúdo ilegal, ofensivo, fraudulento ou que viole direitos de terceiros.</li>
              <li>• É vedado burlar sistemas de segurança ou explorar falhas.</li>
              <li>• Podemos remover conteúdo e/ou suspender contas em caso de violação.</li>
            </ul>
          </article>

          <article className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-lg/10">
            <h3 className="text-lg font-semibold">4. Propriedade Intelectual</h3>
            <p className="mt-3 text-zinc-300">
              A marca, logo, layout, software e elementos da interface do Qwip
              pertencem ao Qwip ou a seus licenciantes. Você mantém a titularidade
              do conteúdo que criar, concedendo licença necessária para operação e
              exibição na plataforma.
            </p>
          </article>

          <article className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-lg/10">
            <h3 className="text-lg font-semibold">5. Planos, Pagamentos e Reembolsos</h3>
            <ul className="mt-3 space-y-2 text-zinc-300">
              <li>• Recursos podem variar conforme o plano contratado.</li>
              <li>• Cobranças recorrentes seguem a periodicidade do plano.</li>
              <li>• Tributos e taxas de terceiros (ex.: WhatsApp/Twilio) podem se aplicar.</li>
              <li>• Reembolsos seguem a legislação aplicável e políticas vigentes.</li>
            </ul>
          </article>

          <article className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-lg/10">
            <h3 className="text-lg font-semibold">6. Responsabilidades</h3>
            <ul className="mt-3 space-y-2 text-zinc-300">
              <li>• Você é responsável pelo conteúdo dos seus anúncios e comunicações.</li>
              <li>• O Qwip fornece a infraestrutura “como está”, sem garantias de disponibilidade ininterrupta.</li>
              <li>• Não nos responsabilizamos por indisponibilidade de serviços de terceiros.</li>
            </ul>
          </article>

          <article className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-lg/10">
            <h3 className="text-lg font-semibold">7. Privacidade e Dados</h3>
            <p className="mt-3 text-zinc-300">
              Tratamos dados pessoais conforme a <Link href="/privacy" className="text-[var(--color-primary)] underline underline-offset-4">Política de Privacidade</Link> e a <Link href="/cookies" className="text-[var(--color-primary)] underline underline-offset-4">Política de Cookies</Link>, em linha com a LGPD.
            </p>
          </article>

          <article className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-lg/10">
            <h3 className="text-lg font-semibold">8. Suspensão e Encerramento</h3>
            <p className="mt-3 text-zinc-300">
              Podemos suspender ou encerrar contas por violação destes termos,
              risco jurídico, ordem de autoridade competente ou motivos técnicos
              relevantes.
            </p>
          </article>

          <article className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-lg/10">
            <h3 className="text-lg font-semibold">9. Alterações</h3>
            <p className="mt-3 text-zinc-300">
              Estes termos podem ser atualizados com aviso prévio razoável quando
              exigido pela legislação. O uso contínuo após alterações representa
              concordância com a versão vigente.
            </p>
          </article>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4">
            <Link
              href="/privacy"
              className="inline-flex h-11 items-center justify-center rounded-xl px-5 font-medium bg-[var(--color-primary)] text-zinc-900 hover:opacity-90 transition"
            >
              Ver Política de Privacidade
            </Link>
            <Link
              href="/"
              className="text-sm text-zinc-400 hover:text-foreground transition underline underline-offset-4"
            >
              Voltar para a Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
