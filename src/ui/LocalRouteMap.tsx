import { useMemo } from "react";
import type { RouteSegmentFeature, ScenarioImpactMapping } from "@/contracts/types.ts";
import segmentsGeoRaw from "../../data/route_segments.geojson?raw";
import placesGeoRaw from "../../data/places.geojson?raw";

const segmentsGeo = JSON.parse(segmentsGeoRaw) as { features: RouteSegmentFeature[] };
const placesGeo = JSON.parse(placesGeoRaw) as {
  features: Array<{
    type: string;
    geometry: { type: string; coordinates: number[] };
    properties: { id: string; name: string; placeType: string };
  }>;
};

interface LocalRouteMapProps {
  defaultSegmentIds: string[];
  stagedMappingIds: string[];
  mappings: ScenarioImpactMapping[];
}

export default function LocalRouteMap({
  defaultSegmentIds,
  stagedMappingIds,
  mappings,
}: LocalRouteMapProps) {
  const { paths, places } = useMemo(() => {
    const features = segmentsGeo.features;
    const allCoords = features.flatMap((f) => f.geometry.coordinates as number[][]);
    const lngs = allCoords.map((c) => c[0]);
    const lats = allCoords.map((c) => c[1]);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);

    const pad = 0.0005;
    const viewMinLng = minLng - pad;
    const viewMaxLng = maxLng + pad;
    const viewMinLat = minLat - pad;
    const viewMaxLat = maxLat + pad;

    const scaleX = (lng: number) =>
      ((lng - viewMinLng) / (viewMaxLng - viewMinLng)) * 800;
    const scaleY = (lat: number) =>
      800 - ((lat - viewMinLat) / (viewMaxLat - viewMinLat)) * 800;

    const segmentPaths = features.map((f) => {
      const coords = f.geometry.coordinates as number[][];
      const d = coords
        .map((c, i) => `${i === 0 ? "M" : "L"}${scaleX(c[0]).toFixed(1)},${scaleY(c[1]).toFixed(1)}`)
        .join(" ");
      const isDefault = defaultSegmentIds.includes(f.properties.id);
      const segMappings = mappings.filter((m) =>
        m.segmentIds.includes(f.properties.id)
      );
      const isStaged = segMappings.some((m) => stagedMappingIds.includes(m.id));
      const midIdx = Math.floor(coords.length / 2);
      const midLng = coords[midIdx][0];
      const midLat = coords[midIdx][1];
      return {
        id: f.properties.id,
        d,
        isDefault,
        isStaged,
        labelX: scaleX(midLng),
        labelY: scaleY(midLat),
        name: f.properties.segmentName,
      };
    });

    const placeLabels = placesGeo.features.map((p) => ({
      x: scaleX(p.geometry.coordinates[0]),
      y: scaleY(p.geometry.coordinates[1]),
      name: p.properties.name,
      placeType: p.properties.placeType,
    }));

    return { paths: segmentPaths, places: placeLabels };
  }, [defaultSegmentIds, stagedMappingIds, mappings]);

  const stagedCount = stagedMappingIds.length;

  return (
    <section aria-label="Local route map">
      <div className="map-header">
        <span className="map-disclaimer">
          Illustrative local route diagram — not navigation
        </span>
        {stagedCount > 0 && (
          <span className="map-staged-badge">Staged: {stagedCount}</span>
        )}
      </div>
      <svg
        role="img"
        aria-label="Illustrative local route diagram"
        viewBox="0 0 800 800"
        className="local-route-map"
      >
        <rect x="0" y="0" width="800" height="800" fill="#f6f5f4" />
        {/* Grid lines for reference */}
        {[0, 200, 400, 600, 800].map((n) => (
          <g key={n}>
            <line x1={n} y1={0} x2={n} y2={800} stroke="rgba(0,0,0,0.05)" strokeWidth={1} />
            <line x1={0} y1={n} x2={800} y2={n} stroke="rgba(0,0,0,0.05)" strokeWidth={1} />
          </g>
        ))}
        {paths.map((p) => (
          <g key={p.id}>
            <path
              d={p.d}
              fill="none"
              stroke={p.isStaged ? "#0075de" : p.isDefault ? "#1a1a1a" : "#999"}
              strokeWidth={p.isStaged ? 4 : p.isDefault ? 2.5 : 1.5}
              strokeDasharray={p.isDefault ? undefined : "4 4"}
              opacity={p.isDefault ? 1 : 0.6}
            />
            <text
              x={p.labelX}
              y={p.labelY - 6}
              fontSize={10}
              fill="#333"
              textAnchor="middle"
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              {p.name}
            </text>
          </g>
        ))}
        {places.map((pl) => (
          <g key={pl.name}>
            <circle
              cx={pl.x}
              cy={pl.y}
              r={6}
              fill={pl.placeType === "origin" ? "#0075de" : pl.placeType === "destination" ? "#0075de" : "#666"}
              stroke="#fff"
              strokeWidth={2}
            />
            <text
              x={pl.x}
              y={pl.y - 10}
              fontSize={11}
              fill="#1a1a1a"
              textAnchor="middle"
              fontWeight={600}
              style={{ fontFamily: "Inter, system-ui, sans-serif" }}
            >
              {pl.name}
            </text>
          </g>
        ))}
      </svg>
    </section>
  );
}
