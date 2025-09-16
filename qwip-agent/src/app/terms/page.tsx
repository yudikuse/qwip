// src/app/terms/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso — Qwip",
  description:
    "Termos de Uso do Qwip para envio e validação de códigos de verificação (OTP) via WhatsApp/SMS.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0b0f12] text-zinc-100">
      <div className="mx-auto max-w-3xl px-5 py-10 md:py-16">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-xl backdrop-blur">
          <div className="px-6 pb-8 pt-6 md:px-10 md:pt-10">
            <header className="mb-6 md:mb-8">
              <h1 className="text-2xl font-semibold md:text-3xl">
                Termos de Uso — Qwip
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                Versão 1.0 • Última atualização: {new Date().toLocaleDateString("pt-BR")}
              </p>
            </header>

            <div className="space-y-8 leading-relaxed text-zinc-200">
              <section>
                <h2 className="text-xl font-semibold">1. Objetivo</h2>
                <p className="mt-2">
                  Estes Termos regulam o uso do <strong>Qwip</strong> (“Plataforma”)
                  para enviar e validar códigos de verificação de uso único
                  (<em>One-Time Password – OTP</em>) em fluxos de autenticação e
                  confirmação de ações do usuário.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">2. Definições</h2>
                <ul className="mt-2 list-disc space-y-2 pl-6">
                  <li>
                    <strong>Usuário</strong>: pessoa que informa o número e recebe o OTP.
                  </li>
                  <li>
                    <strong>Cliente</strong>: empresa/projeto que integra o Qwip em seus fluxos.
                  </li>
                  <li>
                    <strong>OTP</strong>: código de uso único enviado para comprovar controle do número.
                  </li>
                  <li>
                    <strong>Provedores</strong>: terceiros que prestam serviços técnicos (por ex., Twilio
                    para mensageria; Vercel para hospedagem).
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold">3. Cadastro e verificação</h2>
                <p className="mt-2">
                  Ao informar o número de WhatsApp/SMS, você autoriza o envio do OTP para
                  validação e declara ser o titular ou ter autorização para uso do número.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">4. Uso permitido</h2>
                <ul className="mt-2 list-disc space-y-2 pl-6">
                  <li>Concluir cadastro, login e/ou confirmar ações.</li>
                  <li>Proteger sua conta e reduzir fraudes.</li>
                  <li>Usos compatíveis com a finalidade de verificação.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold">5. Responsabilidades do Usuário</h2>
                <ul className="mt-2 list-disc space-y-2 pl-6">
                  <li>Informar número correto e manter sigilo do código.</li>
                  <li>Não compartilhar o OTP com terceiros.</li>
                  <li>Não utilizar a Plataforma para fins ilegais ou abusivos.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold">6. Base legal (LGPD)</h2>
                <p className="mt-2">
                  O tratamento de dados pessoais para envio e validação do OTP tem como
                  base legal <strong>o consentimento</strong> (art. 7º, I, LGPD) e/ou
                  <strong> a execução de contrato</strong> (art. 7º, V, LGPD), conforme o fluxo.
                  Você pode revogar o consentimento a qualquer momento — sujeito às
                  consequências de não concluir a verificação.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">7. Compartilhamento e subencarregados</h2>
                <p className="mt-2">
                  Para entregar o OTP e operar a Plataforma, utilizamos provedores técnicos,
                  que tratam os dados <em>estritamente</em> para prestação do serviço:
                </p>
                <ul className="mt-2 list-disc space-y-2 pl-6">
                  <li>
                    <strong>Twilio Inc.</strong> — mensageria (WhatsApp/SMS).
                  </li>
                  <li>
                    <strong>Vercel Inc.</strong> — hospedagem/infraestrutura do Qwip.
                  </li>
                </ul>
                <p className="mt-2">
                  Podem haver transferências internacionais de dados para países com grau
                  adequado de proteção ou mediante salvaguardas contratuais.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">8. Retenção</h2>
                <p className="mt-2">
                  Mantemos registros mínimos de verificação (logs, tentativas e status) pelo
                  tempo necessário à <strong>segurança, auditoria, prevenção a fraudes</strong> e
                  cumprimento de <strong>obrigações legais/regulatórias</strong>, descartando-os
                  quando não mais necessários.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">9. Segurança</h2>
                <p className="mt-2">
                  Adotamos medidas técnicas e organizacionais adequadas para proteger os dados.
                  Ainda assim, nenhum sistema é 100% seguro. Em caso de incidente, seguiremos
                  procedimentos legais e de resposta a incidentes.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">10. Direitos do titular</h2>
                <p className="mt-2">
                  Você pode solicitar confirmação de tratamento, acesso, correção, exclusão,
                  portabilidade, informações sobre compartilhamento e sobre a revogação do
                  consentimento. Contato do DPO:{" "}
                  <a href="mailto:privacidade@qwip.pro" className="text-emerald-400 underline">
                    privacidade@qwip.pro
                  </a>.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">11. Proibições</h2>
                <ul className="mt-2 list-disc space-y-2 pl-6">
                  <li>Uso para spam, assédio, fraude, phishing ou atividades ilícitas.</li>
                  <li>Engenharia reversa, exploração de vulnerabilidades, ou tentativas de burlar limites.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold">12. Propriedade intelectual</h2>
                <p className="mt-2">
                  O Qwip e seus componentes são protegidos por direitos de propriedade intelectual.
                  Estes Termos não concedem licença além do uso limitado da Plataforma conforme aqui previsto.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">13. Isenções e limitações</h2>
                <p className="mt-2">
                  O Qwip é fornecido “no estado em que se encontra”. Na máxima extensão permitida
                  em lei, não nos responsabilizamos por indisponibilidades de provedores, falhas
                  de rede/operadoras, atos de terceiros, nem por danos indiretos, incidentais ou
                  lucros cessantes. A responsabilidade total, se houver, limita-se ao montante
                  efetivamente pago pelo Cliente pelo período correspondente.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">14. Rescisão</h2>
                <p className="mt-2">
                  Podemos suspender ou encerrar o acesso em caso de violação destes Termos,
                  exigência legal ou risco à Plataforma/usuários.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">15. Alterações</h2>
                <p className="mt-2">
                  Poderemos atualizar estes Termos. Indicaremos a nova data de vigência.
                  Alterações materiais serão destacadas na interface ou por outro meio razoável.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">16. Contato</h2>
                <p className="mt-2">
                  Dúvidas? Fale com o DPO/encarregado:{" "}
                  <a href="mailto:privacidade@qwip.pro" className="text-emerald-400 underline">
                    privacidade@qwip.pro
                  </a>.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">17. Lei e foro</h2>
                <p className="mt-2">
                  Aplica-se a legislação brasileira. Fica eleito o foro da Comarca de São Paulo/SP,
                  com renúncia a qualquer outro, salvo competência legal diversa.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
