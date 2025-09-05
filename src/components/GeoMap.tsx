// src/components/GeoMap.tsx
"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker as LeafletMarker, Circle as LeafletCircle } from "leaflet";

type LatLng = { lat: number; lng: number };

export default function GeoMap({
  center,
  radiusKm,
  onLocationChange,
  height = 320,
}: {
  center: LatLng | null;
  radiusKm: number;
  onLocationChange?: (p: LatLng, meta?: { manual?: boolean }) => void;
  height?: number;
}) {
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const circleRef = useRef<LeafletCircle | null>(null);
  const programmaticRef = useRef(false);

  // init
  useEffect(() => {
    (async () => {
      if (mapRef.current) return;
      const L = await import("leaflet");

      // ícone padrão (corrige path quando usando bundlers)
      const DefaultIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });
      (L as any).Marker.prototype.options.icon = DefaultIcon;

      const map = L.map("qwip-geomap", {
        center: center ? [center.lat, center.lng] : [-15.7797, -47.9297], // Brasília fallback
        zoom: center ? 13 : 6,
        attributionControl: false,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      const m = L.marker(map.getCenter(), { draggable: true }).addTo(map);
      const c = L.circle(map.getCenter(), { radius: (radiusKm || 1) * 1000, color: "#10b981" }).addTo(map);

      // eventos manuais: clique e drag → manual:true
      map.on("click", (ev: any) => {
        const p = { lat: ev.latlng.lat, lng: ev.latlng.lng };
        programmaticRef.current = true;
        m.setLatLng(ev.latlng);
        c.setLatLng(ev.latlng);
        programmaticRef.current = false;
        onLocationChange?.(p, { manual: true });
      });

      m.on("dragend", () => {
        const ll = m.getLatLng();
        const p = { lat: ll.lat, lng: ll.lng };
        programmaticRef.current = true;
        c.setLatLng(ll);
        programmaticRef.current = false;
        onLocationChange?.(p, { manual: true });
      });

      mapRef.current = map;
      markerRef.current = m;
      circleRef.current = c;
    })();

    return () => {
      try {
        mapRef.current?.remove();
      } catch {}
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync center (programático)
  useEffect(() => {
    if (!center || !mapRef.current || !markerRef.current || !circleRef.current) return;
    const L = mapRef.current;
    const M = markerRef.current;
    const C = circleRef.current;
    programmaticRef.current = true;
    M.setLatLng([center.lat, center.lng]);
    C.setLatLng([center.lat, center.lng]);
    L.setView([center.lat, center.lng], Math.max(L.getZoom(), 13), { animate: true });
    programmaticRef.current = false;
  }, [center]);

  // sync radius
  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.setRadius((radiusKm || 1) * 1000);
  }, [radiusKm]);

  return (
    <div
      id="qwip-geomap"
      style={{ width: "100%", height }}
      className="overflow-hidden rounded-xl border border-white/10"
    />
  );
}
