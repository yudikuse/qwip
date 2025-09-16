'use client';

import { CONTACT } from '@/lib/config';

type Props = {
  text: string;         // mensagem pré-preenchida
  phone?: string;       // opcional, sobrescreve o do env
  className?: string;
  children?: React.ReactNode;
};

export default function WhatsAppButton({
  text,
  phone,
  className,
  children,
}: Props) {
  const p = (phone || CONTACT.whatsappPhone).replace(/\D/g, '');
  const href = `https://wa.me/${p}?text=${encodeURIComponent(text)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? 'rounded-md border px-3 py-2 text-sm hover:bg-gray-50'}
    >
      {children ?? 'Chamar no WhatsApp'}
    </a>
  );
}
