// Substitua todo o conteúdo do componente/botão do WhatsApp por este

type Props = {
  sellerPhone: string;        // ex: "34987654321" ou "(34) 98765-4321"
  title: string;              // ex: "diagram"
  priceBRL: number;           // ex: 456
  adUrl: string;              // ex: "https://qwip.pro/anuncio/cmfo7u7l30000b284rj4jmfj5"
  className?: string;
};

function buildWhatsappUrl(rawPhone: string, message: string) {
  // Mantém só dígitos
  const digits = (rawPhone || "").replace(/\D/g, "");
  // Garante DDI 55 (Brasil)
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  // Para api.whatsapp.com, pode manter somente dígitos
  const text = encodeURIComponent(message);
  return `https://api.whatsapp.com/send?phone=${withCountry}&text=${text}`;
}

export default function WhatsAppButton({ sellerPhone, title, priceBRL, adUrl, className }: Props) {
  const msg = `${title} - R$ ${priceBRL.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ${adUrl}`;
  const href = buildWhatsappUrl(sellerPhone, msg);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? "inline-flex items-center justify-center rounded-md px-4 py-2"}
    >
      Enviar pelo WhatsApp
    </a>
  );
}
