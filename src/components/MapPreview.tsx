'use client';

import { MapContainer, TileLayer, Circle, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useMemo } from 'react';

// Fix do ícone default do Leaflet em Next
const markerIcon = new L.Icon({
  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type Props = {
  center: [number, number]; // [lat, lng]
  radiusKm: number;
  className?: string;
};

export default function MapPreview({ center, radiusKm, className }: Props) {
  const radiusMeters = useMemo(() => Math.max(200, radiusKm * 1000), [radiusKm]);

  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={13}
        minZoom={3}
        maxZoom={18}
        zoomControl={true}
        scrollWheelZoom={true}          // << mouse wheel habilitado
        wheelPxPerZoom={80}
        touchZoom={'center'}
        style={{ height: 340, width: '100%', borderRadius: 12, overflow: 'hidden' }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={center} icon={markerIcon} />
        <Circle
          center={center}
          radius={radiusMeters}
          pathOptions={{
            color: 'rgba(37, 211, 102, 1)',     // borda verde marca
            weight: 2,
            fillColor: 'rgba(37, 211, 102, 0.25)',
            fillOpacity: 0.35,
          }}
        />
      </MapContainer>
    </div>
  );
}
