"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef } from "react";
import L, { LatLngExpression, Map as LMap } from "leaflet";

export type LatLng = { lat: number; lng: number };

type Props = {
  /** Centro do mapa; se null, o componente tenta geolocalizar no client */
  center: LatLng | null;
  /** Raio em KM */
  radiusKm: number;
  /** Notifica o container quando conseguimos obter localização (geoloc/CEP) */
  onLocationChange?: (coords: LatLng) => void;
  /** Altura do mapa */
  height?: number;
};

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function GeoMap({
  center,
  radiusKm,
  onLocationChange,
  height = 300,
}: Props) {
  const mapRef = useRef<LMap | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const containerId = useMemo(
    () => `leaflet-${Math.random().toString(36).slice(2, 9)}`,
    []
  );

  // cria mapa
  useEffect(() => {
    if (mapRef.current) return;

    const initial: LatLngExpression = center
      ? [center.lat, center.lng]
      : [-14.235, -51.9253]; // fallback Brasil

    mapRef.current = L.map(containerId, {
      center: initial,
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(mapRef.current);

    // se já veio centro
    if (center) {
      markerRef.current = L.marker(initial, { icon: DefaultIcon }).addTo(
        mapRef.current
      );
      circleRef.current = L.circle(initial, {
        radius: radiusKm * 1000,
        color: "#22c55e",
        fillColor: "#22c55e",
        fillOpacity: 0.15,
      }).addTo(mapRef.current);
    }

    // se não veio, tenta geolocalizar
    if (!center && typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          onLocationChange?.(coords);
          if (!mapRef.current) return;
          const ll: LatLngExpression = [coords.lat, coords.lng];
          mapRef.current.setView(ll, 15);
          markerRef.current = L.marker(ll, { icon: DefaultIcon }).addTo(
            mapRef.current
          );
          circleRef.current = L.circle(ll, {
            radius: radiusKm * 1000,
            color: "#22c55e",
            fillColor: "#22c55e",
            fillOpacity: 0.15,
          }).addTo(mapRef.current);
        },
        () => {
          // usuário negou — o container mostra campo de CEP
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerId]);

  // atualiza posição/raio quando props mudam
  useEffect(() => {
    if (!mapRef.current) return;

    if (center) {
      const ll: LatLngExpression = [center.lat, center.lng];

      if (!markerRef.current) {
        markerRef.current = L.marker(ll, { icon: DefaultIcon }).addTo(
          mapRef.current
        );
      } else {
        markerRef.current.setLatLng(ll);
      }

      if (!circleRef.current) {
        circleRef.current = L.circle(ll, {
          radius: radiusKm * 1000,
          color: "#22c55e",
          fillColor: "#22c55e",
          fillOpacity: 0.15,
        }).addTo(mapRef.current);
      } else {
        circleRef.current.setLatLng(ll);
        circleRef.current.setRadius(radiusKm * 1000);
      }

      mapRef.current.setView(ll);
    } else {
      // sem center: ainda permite mudar apenas o raio
      if (circleRef.current) circleRef.current.setRadius(radiusKm * 1000);
    }
  }, [center, radiusKm]);

  return (
    <div
      id={containerId}
      style={{ width: "100%", height, borderRadius: 12, overflow: "hidden" }}
      className="border border-white/10"
    />
  );
}
