// src/components/MapPreview.tsx
'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

type Props = {
  center: [number, number]; // [lat, lng]
  radiusKm: number;         // raio em KM
};

// Ajusta o mapa quando monta/atualiza
function MapTuner({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    // Garante que o mapa use o centro e zoom desejados
    map.setView(center, zoom, { animate: false });
    // Corrige layout após render
    setTimeout(() => map.invalidateSize(), 50);
  }, [center, zoom, map]);

  return null;
}

export default function MapPreview({ center, radiusKm }: Props) {
  // Heurística simples de zoom pelo raio (ajuste fino se quiser)
  const zoom = useMemo(() => {
    if (radiusKm <= 2) return 14;
    if (radiusKm <= 5) return 13;
    if (radiusKm <= 10) return 12;
    if (radiusKm <= 20) return 11;
    return 10;
  }, [radiusKm]);

  const radiusMeters = Math.max(100, radiusKm * 1000);

  return (
    <div className="relative">
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={3}
        maxZoom={18}
        zoomControl={true}
        scrollWheelZoom={true}       // ✅ scroll do mouse
        touchZoom="center"           // ✅ pinch no centro (sem hack nas typings)
        style={{ height: 340, width: '100%', borderRadius: 12, overflow: 'hidden' }}
      >
        <TileLayer
          // Você pode trocar o estilo depois (Stadia, Carto, etc.)
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <MapTuner center={center} zoom={zoom} />
        <Circle
          center={center}
          radius={radiusMeters}
          pathOptions={{
            color: 'var(--accent)',              // contorno amarelo oficial
            weight: 2,
            fillColor: 'var(--accent)',
            fillOpacity: 0.15,                   // máscara suave
          }}
        />
      </MapContainer>

      {/* Chip de raio no canto do mapa (usa amarelo oficial) */}
      <div className="pointer-events-none absolute left-3 top-3 map-radius-chip">
        Raio: {radiusKm} km
      </div>
    </div>
  );
}
