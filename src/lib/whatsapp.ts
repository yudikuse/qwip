export function buildWhatsAppUrl(opts: {
  phoneE164: string;      // ex: "5548999999999"
  title: string;          // título do anúncio
  adUrl: string;          // URL absoluta do anúncio
}) {
  const msg = `Olá! Tenho interesse em: ${opts.title} ${opts.adUrl}`;
  const encoded = encodeURIComponent(msg);
  return `https://wa.me/${opts.phoneE164}?text=${encoded}`;
}
