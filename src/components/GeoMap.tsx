"use client";

import { MapContainer, TileLayer, Circle, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useMemo } from "react";
import L from "leaflet";

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export type LatLng = { lat: number; lng: number };

type Props = {
  center: LatLng | null;
  radiusKm: number;
  cep?: string;
  className?: string;
};

export default function GeoMap({ center, radiusKm, cep, className }: Props) {
  const effectiveCenter = useMemo<LatLng>(
    () => center ?? { lat: -23.55052, lng: -46.633308 },
    [center]
  );
  const radiusMeters = Math.max(0, radiusKm) * 1000;

  return (
    <div className={className ?? "h-72 rounded-xl overflow-hidden border border-white/10"}>
      <MapContainer
        center={[effectiveCenter.lat, effectiveCenter.lng]}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[effectiveCenter.lat, effectiveCenter.lng]} />
        {radiusMeters > 0 && (
          <Circle
            center={[effectiveCenter.lat, effectiveCenter.lng]}
            radius={radiusMeters}
            pathOptions={{ color: "#22c55e", fillColor: "#22c55e", fillOpacity: 0.15 }}
          />
        )}
      </MapContainer>
    </div>
  );
}
