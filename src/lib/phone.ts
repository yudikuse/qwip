// Padronização de telefone BR para E.164
export function toE164BR(raw: string): string | null {
  const digits = (raw || "").replace(/\D+/g, "");
  // Aceita 10 ou 11 dígitos (com/sem 9)
  if (digits.length < 10 || digits.length > 11) return null;
  return `+55${digits}`;
}

// Exibe telefone mascarado para UI
export function maskPhoneE164(e164?: string | null): string {
  if (!e164) return "";
  const d = e164.replace(/\D+/g, "").slice(-11);
  if (d.length < 10) return e164;
  const dd = d.slice(0, 2);
  const resto = d.slice(2);
  return `+55 ${dd} ${resto.slice(0, resto.length - 4)}-${resto.slice(-4)}`;
}
