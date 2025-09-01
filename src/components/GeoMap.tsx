"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";

type Props =
  | {
      center: { lat: number; lng: number } | null;
      cep?: never;
      radiusKm: number;
    }
  | {
      center?: never;
      cep: string; // se vier CEP, você pode geocodificar no backend depois. Aqui só centralizamos no Brasil.
      radiusKm: number;
    };

// icone default do Leaflet (corrige issue de assets em bundlers)
const DefaultIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function FitOnCenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 13, { animate: true });
  }, [lat, lng, map]);
  return null;
}

export default function GeoMap(props: Props) {
  // fallback quando vem CEP (sem geocoder): centro aproximado do Brasil
  const fallback = { lat: -14.235, lng: -51.9253 };

  const center = "center" in props && props.center
    ? props.center
    : fallback;

  const radiusMeters = (props.radiusKm ?? 5) * 1000;

  return (
    <div className="relative h-44 overflow-hidden rounded-lg border border-white/10">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        {/* OSM tiles livres */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Circle
          center={[center.lat, center.lng]}
          radius={radiusMeters}
          pathOptions={{ color: "#34d399", fillOpacity: 0.15 }}
        />
        {"center" in props && props.center ? (
          <FitOnCenter lat={center.lat} lng={center.lng} />
        ) : null}
      </MapContainer>
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400" />
    </div>
  );
}
