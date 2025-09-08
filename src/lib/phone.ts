export function toE164BR(raw: string) {
  const digits = (raw || "").replace(/\D+/g, "");
  if (digits.length < 10) return null;
  return `+55${digits}`;
}
