// src/content/legal-pt.tsx
import type { ReactNode } from 'react';

export const termsTitle = 'Termos de Uso – Qwip';
export const privacyTitle = 'Aviso de Privacidade – Qwip';

export const TermsBody: ReactNode = (
  <div className="prose prose-invert max-w-none">
    <h2>1. Objetivo</h2>
    <p>
      Estes Termos disciplinam o uso do Qwip para envio e validação de códigos de
      verificação (OTP).
    </p>

    <h2>2. Cadastro e verificação</h2>
    <p>
      Ao informar seu número, você autoriza o envio de um OTP para fins de validação.
      Você declara que é o titular desse número.
    </p>

    <h2>3. Uso permitido</h2>
    <ul>
      <li>Concluir cadastro/identificação;</li>
      <li>Proteger sua conta;</li>
      <li>Prevenir fraudes e uso indevido da plataforma.</li>
    </ul>

    <h2>4. Base legal (LGPD)</h2>
    <p>
      Utilizamos a base legal do <strong>consentimento</strong> (art. 7º, I) para enviar e
      validar o código. O consentimento pode ser revogado a qualquer momento.
    </p>

    <h2>5. Compartilhamento</h2>
    <p>
      Para envio do código, usamos <em>providers</em> de comunicação (ex.: Twilio).
      Esses operadores tratam apenas o necessário para entrega do OTP.
    </p>

    <h2>6. Retenção</h2>
    <p>
      Mantemos registros de verificação pelo tempo necessário à auditoria e segurança,
      enquanto houver obrigação legal.
    </p>

    <h2>7. Seus direitos</h2>
    <p>
      Você pode solicitar acesso, correção, exclusão, portabilidade e informações sobre
      compartilhamentos, além de revogar o consentimento. Contato do DPO:{' '}
      <a href="mailto:privacidade@qwip.pro">privacidade@qwip.pro</a>.
    </p>

    <h2>8. Segurança</h2>
    <p>
      Adotamos medidas técnicas e organizacionais adequadas. Em caso de incidente,
      seguiremos os procedimentos legais.
    </p>

    <h2>9. Alterações</h2>
    <p>
      Podemos atualizar estes Termos. Indicaremos a data de vigência no topo do
      documento.
    </p>
  </div>
);

export const PrivacyBody: ReactNode = (
  <div className="prose prose-invert max-w-none">
    <h2>1. Controladora e contato</h2>
    <p>
      Qwip (controladora de dados). DPO:{' '}
      <a href="mailto:privacidade@qwip.pro">privacidade@qwip.pro</a>.
    </p>

    <h2>2. Dados tratados</h2>
    <ul>
      <li>Número de WhatsApp informado;</li>
      <li>Metadados técnicos de envio/validação do OTP;</li>
      <li>Logs de auditoria e segurança.</li>
    </ul>

    <h2>3. Finalidades</h2>
    <ul>
      <li>Enviar e validar o OTP;</li>
      <li>Garantir a segurança da conta;</li>
      <li>Prevenir fraudes.</li>
    </ul>

    <h2>4. Base legal</h2>
    <p>Consentimento (art. 7º, I da LGPD) e, quando cabível, legítimo interesse.</p>

    <h2>5. Compartilhamento</h2>
    <p>
      Operadores de comunicação (ex.: Twilio) exclusivamente para entrega do OTP,
      sob contrato e com obrigações de segurança.
    </p>

    <h2>6. Retenção</h2>
    <p>Somente pelo prazo necessário às finalidades e obrigações legais.</p>

    <h2>7. Direitos do titular</h2>
    <p>
      Acesso, correção, eliminação, portabilidade, informação sobre uso e
      compartilhamento, e revogação do consentimento.
    </p>

    <h2>8. Segurança</h2>
    <p>Medidas técnicas e organizacionais razoáveis contra acessos não autorizados.</p>

    <h2>9. Cookies</h2>
    <p>
      Podemos usar cookies estritamente necessários para autenticação, segurança e
      medição básica. Veja o banner/centro de preferências quando disponível.
    </p>

    <h2>10. Alterações</h2>
    <p>Atualizaremos este Aviso quando necessário e indicaremos a nova data.</p>
  </div>
);
