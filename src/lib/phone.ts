// src/lib/phone.ts

/**
 * Normalização bem simples:
 * - aceita formatos com/sem +55
 * - remove tudo que não é dígito
 * - força +55 se não tiver código do país
 * - valida tamanho 10~13 dígitos após o +55
 */
export function toE164BR(input: string): string | null {
  if (!input) return null;
  const only = (input || "").replace(/\D/g, "");

  // Se já começa com 55 (sem +)
  if (only.startsWith("55")) {
    const national = only.slice(2);
    if (national.length < 10 || national.length > 11) return null;
    return `+55${national}`;
  }

  // Se veio completo com +55
  if (input.trim().startsWith("+55")) {
    const rest = input.trim().replace(/\D/g, "").slice(2);
    if (rest.length < 10 || rest.length > 11) return null;
    return `+55${rest}`;
  }

  // Se veio só DDD+numero
  if (only.length >= 10 && only.length <= 11) {
    return `+55${only}`;
  }

  return null;
}
