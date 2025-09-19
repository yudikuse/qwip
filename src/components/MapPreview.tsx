'use client';

import { MapContainer, TileLayer, Circle, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMemo } from 'react';

// marcador azul padrão (sem depender de assets externos)
const markerIcon = new L.DivIcon({
  className: 'leaflet-div-icon',
  html: `<div style="
    width:18px;height:18px;border-radius:9999px;
    background:#3b82f6;border:2px solid white;box-shadow:0 0 0 2px rgba(59,130,246,.25);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

type Props = {
  center: [number, number];
  radiusKm: number; // em km
};

export default function MapPreview({ center, radiusKm }: Props) {
  const radiusMeters = useMemo(() => Math.max(250, radiusKm * 1000), [radiusKm]);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/10 bg-black/20">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        className="h-72 md:h-80 w-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle
          center={center}
          radius={radiusMeters}
          pathOptions={{ color: '#25d366', fillColor: '#25d366', fillOpacity: 0.15, weight: 2 }}
        />
        <Marker position={center} icon={markerIcon} />
      </MapContainer>
    </div>
  );
}
