// src/lib/phone.ts
export function toE164BR(input: string): string | null {
  if (!input) return null;
  const only = input.replace(/\D/g, "");

  // +55XXXXXXXXXXX
  if (input.trim().startsWith("+55")) {
    const rest = input.trim().replace(/\D/g, "").slice(2);
    if (rest.length < 10 || rest.length > 11) return null;
    return `+55${rest}`;
  }

  // 55XXXXXXXXXXX
  if (only.startsWith("55")) {
    const national = only.slice(2);
    if (national.length < 10 || national.length > 11) return null;
    return `+55${national}`;
  }

  // DDD + número
  if (only.length >= 10 && only.length <= 11) {
    return `+55${only}`;
  }

  return null;
}
