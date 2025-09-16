// src/lib/config.ts
export const SITE = {
  name: 'Qwip',
  url: 'https://qwip.pro',
  defaultCity: 'Florianópolis',
  defaultState: 'SC',
};

export const CONTACT = {
  // use NEXT_PUBLIC_WHATSAPP_PHONE no .env, senão cai no fallback
  whatsappPhone: process.env.NEXT_PUBLIC_WHATSAPP_PHONE || '5599999999999',
};
