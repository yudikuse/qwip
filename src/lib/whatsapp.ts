// src/lib/whatsapp.ts
/**
 * Mantém apenas dígitos.
 */
export function onlyDigits(s: string | null | undefined): string {
  return String(s ?? "").replace(/\D/g, "");
}

/**
 * Normaliza telefone BR para E.164 sem o símbolo "+" (WhatsApp aceita apenas dígitos).
 * Regras:
 *  - Remove tudo que não for dígito
 *  - Se não iniciar com 55, prefixa 55
 *  - Retorna null se ficar muito curto (< 12 dígitos: 55 + DDD(2) + número(8-9))
 */
export function toBrazilE164(raw: string | null | undefined): string | null {
  const digits = onlyDigits(raw);
  if (!digits) return null;

  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  if (withCountry.length < 12) return null; // evita links inválidos
  return withCountry;
}

/**
 * Monta URL para abrir conversa no WhatsApp com mensagem pré-preenchida.
 * Usa api.whatsapp.com, que é mais tolerante que wa.me em desktop/mobile.
 */
export function buildWhatsAppUrl(phoneRaw: string, message: string): string | null {
  const e164 = toBrazilE164(phoneRaw);
  if (!e164) return null;
  const text = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${e164}&text=${text}`;
}
