'use client';

import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import type { Map } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Para o marker funcionar bonitinho no Next (sem ícone quebrado),
// você já deve estar usando o default fix em outro ponto do app.
// Se precisar, me avisa que mando o fix do ícone também.

type Props = {
  center: [number, number]; // [lat, lng]
  radiusKm: number;         // raio em km
  height?: number;          // opcional (px), default 340
};

export default function MapPreview({ center, radiusKm, height = 340 }: Props) {
  const radiusMeters = Math.max(100, radiusKm * 1000); // mínimo 100m para visual

  function handleCreated(map: Map) {
    // Habilita scroll do mouse
    map.scrollWheelZoom.enable();

    // Ajusta sensibilidade do scroll (opção do Leaflet 1.9), mas os tipos não expõem:
    // @ts-expect-error - propriedade existe no Leaflet, não nas typings do react-leaflet
    map.options.wheelPxPerZoom = 80;

    // Zoom/touch mais confortáveis
    // @ts-expect-error - também não mapeado nas typings
    map.options.touchZoom = 'center';

    // Garantir que o mapa renderize com o center correto
    map.setView(center);
  }

  return (
    <div className="w-full rounded-xl overflow-hidden border border-white/10">
      <MapContainer
        center={center}
        zoom={13}
        minZoom={3}
        maxZoom={19}
        zoomControl={true}
        scrollWheelZoom={true}
        whenCreated={handleCreated}
        style={{ height, width: '100%' }}
      >
        <TileLayer
          // OSM default
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap"
        />
        <Marker position={center} />
        <Circle
          center={center}
          radius={radiusMeters}
          pathOptions={{
            color: '#25d366',         // borda
            weight: 2,
            fillColor: '#25d366',     // fill
            fillOpacity: 0.18,        // máscara verde clara
          }}
        />
      </MapContainer>
    </div>
  );
}
