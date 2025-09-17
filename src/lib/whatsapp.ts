// src/lib/whatsapp.ts

/** Converte qualquer telefone BR em E.164 (somente dígitos, com DDI 55). */
export function toE164BR(rawPhone: string | null | undefined): string | null {
  const digits = String(rawPhone ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  // Regra mínima razoável: DDI(2) + DDD(2) + 9 dígitos = 13+ dígitos
  if (withCountry.length < 12) return null;
  return withCountry;
}

/** Monta a URL para abrir conversa direta com o número do vendedor (WhatsApp). */
export function buildWhatsAppUrl(opts: {
  phoneRaw: string | null | undefined; // telefone como foi salvo no banco (pode ter máscara)
  title: string;                        // título do anúncio
  adUrl: string;                        // URL absoluta do anúncio
}) {
  const phoneE164 = toE164BR(opts.phoneRaw);
  const message = `Olá! Tenho interesse em: ${opts.title} ${opts.adUrl}`;
  const encoded = encodeURIComponent(message);

  // Se tiver telefone válido -> conversa direta; senão cai no “share” (ainda abre WhatsApp)
  return phoneE164
    ? `https://api.whatsapp.com/send?phone=${phoneE164}&text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;
}
