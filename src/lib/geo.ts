// src/lib/geo.ts
export type GeoPoint = { lat: number; lng: number; accuracy?: number };

export function getPrecisePosition(opts?: { timeoutMs?: number }): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("Geolocalização indisponível."));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        resolve({ lat: latitude, lng: longitude, accuracy });
      },
      (err) => reject(err),
      { enableHighAccuracy: true, timeout: opts?.timeoutMs ?? 12000, maximumAge: 0 }
    );
  });
}

/**
 * Tenta melhorar a precisão: dispara getCurrentPosition e, em paralelo,
 * faz watchPosition por alguns segundos. Resolve cedo se accuracy <= alvo.
 */
export function bestEffortPrecisePosition(opts?: {
  targetAccuracyMeters?: number; // ex.: 150 m
  hardTimeoutMs?: number;        // ex.: 12000 ms
}): Promise<GeoPoint> {
  const target = opts?.targetAccuracyMeters ?? 150;
  const hardTimeout = opts?.hardTimeoutMs ?? 12000;

  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject(new Error("Geolocalização indisponível."));
    let best: GeoPoint | null = null;
    let settled = false;
    let watchId: number | null = null;
    const finish = (p: GeoPoint) => {
      if (settled) return;
      settled = true;
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      resolve(p);
    };

    // timeout duro
    const t = setTimeout(() => {
      if (best) finish(best);
      else reject(new Error("timeout"));
    }, hardTimeout);

    // 1) posição imediata
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: GeoPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        best = p;
        if ((p.accuracy ?? 1e9) <= target) {
          clearTimeout(t);
          finish(p);
        }
      },
      (err) => {
        clearTimeout(t);
        if (watchId != null) navigator.geolocation.clearWatch(watchId);
        reject(err);
      },
      { enableHighAccuracy: true, timeout: hardTimeout, maximumAge: 0 }
    );

    // 2) refino contínuo por alguns segundos
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const p: GeoPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        // guarda o melhor
        if (!best || ((p.accuracy ?? 1e9) < (best.accuracy ?? 1e9))) best = p;
        if ((p.accuracy ?? 1e9) <= target) {
          clearTimeout(t);
          finish(p);
        }
      },
      // se o watch falhar, seguimos com o que já temos
      () => {},
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  });
}
