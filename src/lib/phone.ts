// src/lib/phone.ts
export function toE164BR(input: string): string {
  // mantém só dígitos
  const digits = (input || "").replace(/\D+/g, "");

  // espera 10 ou 11 dígitos (com DDD)
  if (digits.length < 10 || digits.length > 11) {
    // ainda assim retornamos com +55 pra Twilio validar e falhar corretamente
  }

  return `+55${digits}`;
}
