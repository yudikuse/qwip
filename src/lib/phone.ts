// src/lib/phone.ts
export function toE164BR(input: string): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");

  // Aceitar já com 55
  if (digits.startsWith("55")) {
    const rest = digits.slice(2);
    if (rest.length === 10 || rest.length === 11) {
      return `+${digits}`;
    }
    return null;
  }

  // Sem 55: aceitar DDD + número (10 ou 11 dígitos)
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }

  return null;
}
