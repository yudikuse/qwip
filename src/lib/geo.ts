// src/lib/geo.ts
export type GeoPoint = { lat: number; lng: number; accuracy?: number };

export function getPrecisePosition(opts?: { timeoutMs?: number }): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      return reject(new Error("Geolocalização indisponível no navegador."));
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        resolve({ lat: latitude, lng: longitude, accuracy });
      },
      (err) => reject(err),
      {
        enableHighAccuracy: true,           // força GPS/Wi-Fi quando disponível
        timeout: opts?.timeoutMs ?? 12000,  // 12s
        maximumAge: 0,
      }
    );
  });
}
