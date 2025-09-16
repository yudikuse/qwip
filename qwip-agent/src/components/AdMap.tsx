"use client";

import dynamic from "next/dynamic";
import type { FC } from "react";

type LatLng = { lat: number; lng: number };

const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

export const AdMap: FC<{
  center: LatLng | null;
  radiusKm: number;
  height?: number;
}> = ({ center, radiusKm, height = 320 }) => {
  return <GeoMap center={center} radiusKm={radiusKm} onLocationChange={() => {}} height={height} />;
};

export default AdMap;
