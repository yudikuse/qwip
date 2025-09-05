// src/lib/moderation.ts
// Moderação de texto PT-BR simples (blocklist/regex). Evita custo externo.
// Servidor continua em controle; ajuste as listas conforme seu caso.

const BAD_WORDS = [
  // palavrões comuns (amostra — expanda conforme precisar)
  "porra", "caralho", "merda", "puta", "fdp", "pqp",
  // apelos ilegais claros (exemplos)
  "droga", "maconha", "cocaína", "anabolizante", "arma", "pistola",
];

const BAD_PATTERNS: RegExp[] = [
  // WhatsApp/links pra fora (incentiva chat dentro da plataforma)
  /\bwa\.me\/\d+/i,
  /\bwhats(app)?\.com\/(d|channel|invite)/i,
  /\bhttps?:\/\/[^\s]+/i,
  // Dados sensíveis óbvios
  /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/,      // CPF
  /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/, // CNPJ
  // Telefones (E.164, BR locais com/sem DDD)
  /\+?\d[\d\s().-]{8,}\d/,
];

export type ModResult = { ok: true } | { ok: false; reason: string; match?: string };

export function moderateTextPTBR(title: string, description: string): ModResult {
  const text = `${title}\n${description}`.toLowerCase();

  // palavrões
  for (const w of BAD_WORDS) {
    if (text.includes(w)) return { ok: false, reason: "linguagem inadequada", match: w };
  }
  // padrões
  for (const rx of BAD_PATTERNS) {
    const m = text.match(rx);
    if (m) return { ok: false, reason: "conteúdo proibido", match: m[0] };
  }
  // limites triviais
  if (title.trim().length < 3) return { ok: false, reason: "título muito curto" };
  if (description.length > 1000) return { ok: false, reason: "descrição muito longa" };

  return { ok: true };
}
