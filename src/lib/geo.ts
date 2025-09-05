// src/lib/geo.ts
export type GeoPoint = { lat: number; lng: number; accuracy?: number };

export function getPrecisePosition(opts?: { timeoutMs?: number }): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      return reject(new Error("geoloc indisponível"));
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        resolve({ lat: latitude, lng: longitude, accuracy });
      },
      (err) => reject(err),
      {
        enableHighAccuracy: true,        // pede GPS/Wi-Fi quando possível
        timeout: opts?.timeoutMs ?? 10000,
        maximumAge: 0,
      }
    );
  });
}
