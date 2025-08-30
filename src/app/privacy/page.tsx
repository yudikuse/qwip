'use client';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-neutral-900 text-neutral-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold">Aviso de Privacidade — Qwip</h1>
          <p className="text-neutral-300 mt-2">
            Última atualização: 30/08/2025 • Versão: v1
          </p>
        </header>

        <article className="prose prose-invert prose-neutral max-w-none">
          <p>
            Este Aviso de Privacidade (“<strong>Aviso</strong>”) explica como o Qwip
            (“<strong>Qwip</strong>”, “<strong>nós</strong>”, “<strong>nosso</strong>”) coleta,
            usa, compartilha e protege dados pessoais, em conformidade com a Lei Geral de
            Proteção de Dados — <strong>LGPD</strong> (Lei 13.709/2018).
          </p>

          <h2>1. Quem somos (Controlador) e contato do DPO</h2>
          <p>
            O Qwip é o <strong>controlador</strong> dos dados pessoais tratados nesta plataforma.
            Para dúvidas, solicitações de direitos do titular ou questões de privacidade, fale com
            nosso DPO (Encarregado de Dados):{' '}
            <a href="mailto:privacidade@qwip.pro">privacidade@qwip.pro</a>.
          </p>

          <h2>2. Quais dados coletamos</h2>
          <ul>
            <li>
              <strong>Dados de conta/identificação:</strong> número de celular/WhatsApp,
              nome/apelido (se informado), e eventuais credenciais.
            </li>
            <li>
              <strong>Dados de verificação (OTP):</strong> número informado, status da verificação,
              código de validação (apenas para processamento momentâneo), logs de sucesso/erro.
            </li>
            <li>
              <strong>Dados técnicos e de uso:</strong> IP, user agent, data/hora, páginas
              acessadas, eventos básicos de produto para segurança, antifraude e métricas operacionais.
            </li>
            <li>
              <strong>Conteúdo fornecido pelo usuário:</strong> textos/imagens de anúncios/links,
              descrições, rótulos e metadados criados por você.
            </li>
            <li>
              <strong>Cookies & tecnologias semelhantes:</strong> apenas os essenciais para
              funcionamento. Cookies analíticos/marketing só serão usados com consentimento,
              se ativados (ver item 10).
            </li>
          </ul>

          <h2>3. Para que usamos seus dados (finalidades) e bases legais</h2>
          <ul>
            <li>
              <strong>Prestação do serviço e verificação da conta (OTP):</strong> executar as
              funcionalidades do Qwip e confirmar a titularidade do número.
              <em> Base legal:</em> execução de contrato (art. 7º, V) e legítimo interesse
              (art. 7º, IX) para prevenção a fraude e segurança.
            </li>
            <li>
              <strong>Segurança, prevenção a abusos e spam:</strong> detecção, investigação e
              mitigação de uso indevido.
              <em> Base legal:</em> legítimo interesse (art. 7º, IX) e cumprimento de obrigação
              legal quando aplicável.
            </li>
            <li>
              <strong>Comunicações operacionais:</strong> avisos sobre verificação, mudanças
              de termos, incidentes ou funcionamento.
              <em> Base legal:</em> execução de contrato e cumprimento de obrigação legal.
            </li>
            <li>
              <strong>Melhoria do produto e métricas essenciais:</strong> estatísticas de operação
              sem identificação direta do usuário, quando possível.
              <em> Base legal:</em> legítimo interesse (art. 7º, IX).
            </li>
            <li>
              <strong>Cookies analíticos/marketing (opcionais):</strong> somente com
              <em> consentimento</em> (art. 7º, I).
            </li>
          </ul>

          <h2>4. Com quem compartilhamos</h2>
          <p>Compartilhamos apenas o necessário com <strong>operadores</strong> que nos ajudam a prestar o serviço:</p>
          <ul>
            <li>
              <strong>Twilio Inc.</strong> — envio/gerência de mensagens e verificação via WhatsApp/SMS.
              Dados envolvidos: número, metadados de mensagens/OTP, status. <em>Possui data centers fora do Brasil.</em>
            </li>
            <li>
              <strong>Vercel Inc.</strong> — hospedagem e entrega do aplicativo (frontend e rotas serverless).
              Dados envolvidos: logs técnicos, IP, user agent e tráfego necessário à prestação do serviço.
            </li>
          </ul>
          <p>
            Também poderemos compartilhar com autoridades quando exigido por lei ou para proteger
            direitos, segurança do Qwip, usuários e terceiros.
          </p>

          <h2>5. Transferências internacionais</h2>
          <p>
            Alguns fornecedores podem processar dados fora do Brasil. Adotamos salvaguardas adequadas
            (contratuais e técnicas) para cumprir a LGPD, incluindo cláusulas contratuais padrão
            e avaliações de risco.
          </p>

          <h2>6. Retenção e eliminação</h2>
          <ul>
            <li>
              <strong>Dados de verificação (OTP):</strong> mantidos pelo tempo necessário para concluir
              a checagem e cumprir hipóteses legais ou antifraude.
            </li>
            <li>
              <strong>Logs técnicos e segurança:</strong> prazos compatíveis com a finalidade de
              segurança/diagnóstico e requisitos legais.
            </li>
            <li>
              <strong>Conteúdo e conta:</strong> enquanto a conta estiver ativa e/ou conforme exigências legais/contratuais.
            </li>
          </ul>

          <h2>7. Segurança da informação</h2>
          <p>
            Utilizamos medidas técnicas e organizacionais para proteger dados contra acessos
            não autorizados, perda, alteração ou destruição. Nenhum sistema é 100% seguro; caso
            identifique risco, entre em contato com o DPO.
          </p>

          <h2>8. Seus direitos (LGPD)</h2>
          <p>Você pode exercer, a qualquer momento:</p>
          <ul>
            <li>Confirmação da existência de tratamento e acesso aos dados;</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários/excessivos;</li>
            <li>Portabilidade, quando aplicável;</li>
            <li>Informações sobre compartilhamentos e sobre a possibilidade de não consentir;</li>
            <li>Revogação do consentimento, quando essa for a base legal;</li>
            <li>Eliminação dos dados tratados com consentimento, observadas as hipóteses legais de retenção.</li>
          </ul>
          <p>
            Para exercer seus direitos, envie e-mail para{' '}
            <a href="mailto:privacidade@qwip.pro">privacidade@qwip.pro</a>. Podemos verificar sua identidade
            para segurança.
          </p>

          <h2>9. Crianças e adolescentes</h2>
          <p>
            O Qwip não se destina a menores de 18 anos. Se você for responsável legal e acreditar
            que houve tratamento indevido de dados de um menor, contate o DPO.
          </p>

          <h2>10. Cookies</h2>
          <ul>
            <li>
              <strong>Essenciais:</strong> necessários para login, segurança e funcionamento — não dependem de consentimento.
            </li>
            <li>
              <strong>Analíticos/marketing (opcionais):</strong> só usamos se você aceitar no banner
              de cookies, quando ativado.
            </li>
          </ul>
          <p>
            Você pode gerenciar preferências pelo navegador e, quando disponível, pelo nosso banner de cookies.
          </p>

          <h2>11. Links externos e terceiros</h2>
          <p>
            O Qwip pode conter links para sites de terceiros. Não nos responsabilizamos pelas práticas de
            privacidade desses sites. Recomendamos a leitura dos respectivos avisos de privacidade.
          </p>

          <h2>12. Incidentes de segurança</h2>
          <p>
            Em caso de incidente com risco relevante aos titulares, seguiremos os procedimentos da LGPD,
            incluindo comunicação aos afetados e à ANPD, quando exigido.
          </p>

          <h2>13. Alterações deste Aviso</h2>
          <p>
            Podemos atualizar este Aviso periodicamente. A versão vigente e a data de atualização
            constam no topo. Mudanças relevantes poderão ser comunicadas por canais razoáveis.
          </p>

          <h2>14. Relação com os Termos de Uso</h2>
          <p>
            Este Aviso complementa os nossos <a href="/terms">Termos de Uso</a>. Em caso de conflito,
            prevalecerá o que melhor atenda às exigências legais de proteção de dados.
          </p>

          <hr />
          <p className="text-xs text-neutral-400">
            Este documento é um modelo-base e não constitui aconselhamento jurídico. Recomenda-se revisão por
            profissional habilitado considerando o cenário específico do Qwip.
          </p>
        </article>
      </div>
    </main>
  );
}
