// src/app/privacy/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — Qwip",
  description:
    "Como o Qwip coleta, usa, compartilha e protege dados pessoais em fluxos de envio de OTP.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0b0f12] text-zinc-100">
      <div className="mx-auto max-w-3xl px-5 py-10 md:py-16">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 shadow-xl backdrop-blur">
          <div className="px-6 pb-8 pt-6 md:px-10 md:pt-10">
            <header className="mb-6 md:mb-8">
              <h1 className="text-2xl font-semibold md:text-3xl">
                Política de Privacidade — Qwip
              </h1>
              <p className="mt-2 text-sm text-zinc-400">
                Versão 1.0 • Última atualização: {new Date().toLocaleDateString("pt-BR")}
              </p>
            </header>

            <div className="space-y-8 leading-relaxed text-zinc-200">
              <section>
                <h2 className="text-xl font-semibold">1. Escopo</h2>
                <p className="mt-2">
                  Esta Política descreve como o <strong>Qwip</strong> coleta, utiliza, compartilha,
                  armazena e protege dados pessoais quando você informa seu número e recebe um
                  <em> OTP</em> para verificação. Em caso de conflito com termos específicos de um
                  Cliente, prevalecerá a política/contrato mais protetivo ao titular.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">2. Dados que tratamos</h2>
                <ul className="mt-2 list-disc space-y-2 pl-6">
                  <li>
                    <strong>Número de telefone</strong> (WhatsApp/SMS) informado para envio do OTP.
                  </li>
                  <li>
                    <strong>Metadados de verificação</strong> (status do envio, tentativas, hora, canal).
                  </li>
                  <li>
                    <strong>Dados técnicos</strong> (endereço IP, identificadores de dispositivo/navegador,
                    logs de aplicação e segurança).
                  </li>
                  <li>
                    <strong>Cookies/armazenamento local</strong> para lembrar preferências e cumprir
                    obrigações (ex.: banner de cookies, consentimento).
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold">3. Finalidades</h2>
                <ul className="mt-2 list-disc space-y-2 pl-6">
                  <li>Enviar e validar o OTP para verificação/autenticação.</li>
                  <li>Prevenir fraudes e proteger contas/fluxos.</li>
                  <li>Gerar logs de auditoria e cumprir obrigações legais.</li>
                  <li>Melhorar estabilidade, segurança e desempenho da Plataforma.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold">4. Bases legais (LGPD)</h2>
                <p className="mt-2">
                  Tratamos dados com base em <strong>consentimento</strong> (art. 7º, I),
                  <strong> execução de contrato</strong> (art. 7º, V) e{" "}
                  <strong>legítimo interesse</strong> (art. 7º, IX) para segurança e prevenção a fraudes,
                  quando aplicável e com testes de balanceamento. Sempre que necessário, você poderá
                  revogar o consentimento, ciente de que isso pode impedir a conclusão da verificação.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">5. Compartilhamento</h2>
                <p className="mt-2">
                  Compartilhamos dados estritamente necessários com <strong>suboperadores</strong>:
                </p>
                <ul className="mt-2 list-disc space-y-2 pl-6">
                  <li>
                    <strong>Twilio Inc.</strong> — entrega de mensagens (WhatsApp/SMS).
                  </li>
                  <li>
                    <strong>Vercel Inc.</strong> — hospedagem/infra do Qwip.
                  </li>
                </ul>
                <p className="mt-2">
                  Poderá haver transferência internacional de dados. Utilizamos mecanismos
                  reconhecidos (cláusulas padrão/compromissos e práticas de segurança) para
                  garantir nível adequado de proteção.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">6. Retenção e descarte</h2>
                <p className="mt-2">
                  Mantemos registros de verificação e logs pelo tempo necessário às finalidades
                  descritas e a exigências legais/regulatórias. Após esse período, descartamos
                  ou anonimizamos os dados de forma segura.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">7. Segurança</h2>
                <p className="mt-2">
                  Adotamos controles de segurança (criptografia em trânsito, gestão de acessos,
                  monitoramento e registros). Ainda que nos esforcemos, nenhum ambiente é imune
                  a riscos. Em incidentes, seguiremos as normas aplicáveis e notificaremos quando exigido.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">8. Seus direitos</h2>
                <p className="mt-2">
                  Conforme a LGPD, você pode solicitar: confirmação, acesso, correção, portabilidade,
                  anonimização, bloqueio ou eliminação, informação sobre compartilhamento e sobre a
                  possibilidade de não consentir/revogar. Para exercer:
                </p>
                <p className="mt-2">
                  <a href="mailto:privacidade@qwip.pro" className="text-emerald-400 underline">
                    privacidade@qwip.pro
                  </a>
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">9. Crianças e adolescentes</h2>
                <p className="mt-2">
                  O Qwip não se destina a menores de 18 anos sem consentimento dos responsáveis
                  e base legal apropriada. Caso identifiquemos tratamento inadequado, removeremos os
                  dados conforme a lei.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">10. Cookies</h2>
                <p className="mt-2">
                  Utilizamos cookies/armazenamento local para funções essenciais (ex.: lembrar
                  que você aceitou termos/cookies) e, quando houver, para métricas essenciais de
                  estabilidade. Não utilizamos rastreamento publicitário.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">11. Alterações</h2>
                <p className="mt-2">
                  Podemos atualizar esta Política e indicaremos a nova data. Mudanças relevantes
                  serão comunicadas de forma destacada.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">12. Contato do DPO</h2>
                <p className="mt-2">
                  Encarregado/DPO:{" "}
                  <a href="mailto:privacidade@qwip.pro" className="text-emerald-400 underline">
                    privacidade@qwip.pro
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
