// src/lib/ads.ts
export type Ad = {
  id: string;
  title: string;
  price: string;      // ex: "R$ 1.900"
  location: string;   // ex: "Florianópolis - SC"
  whatsapp: string;   // ex: "5548999999999"
  description?: string;
  images?: string[];
};

export const ADS: Ad[] = [
  { id: "1", title: "Geladeira Brastemp 375L", price: "R$ 1.900", location: "Florianópolis - SC", whatsapp: "5548999999999" },
  { id: "2", title: "Sofá 3 lugares",           price: "R$ 750",   location: "São José - SC",      whatsapp: "5548988888888" },
  { id: "3", title: "Notebook i5 8GB/256GB",    price: "R$ 1.650", location: "Palhoça - SC",       whatsapp: "5548977777777" },
  { id: "4", title: "Bicicleta aro 29",         price: "R$ 890",   location: "Florianópolis - SC", whatsapp: "5548966666666" },
  { id: "5", title: "Cadeira gamer",            price: "R$ 520",   location: "Biguaçu - SC",        whatsapp: "5548955555555" },
  { id: "6", title: "Mesa de jantar 6 cadeiras",price: "R$ 1.200", location: "Florianópolis - SC", whatsapp: "5548944444444" },
];

export function getAd(id: string) {
  return ADS.find(a => a.id === id) ?? null;
}
