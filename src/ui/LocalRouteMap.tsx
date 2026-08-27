import { useEffect, useMemo, useRef, useState } from "react";
import type { LatLngBoundsExpression, Polyline as LeafletPolyline } from "leaflet";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
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
  profileId?: string;
  defaultSegmentIds: string[];
  stagedMappingIds: string[];
  mappings: ScenarioImpactMapping[];
}

const PROFILE_ROUTE_DETAILS: Record<string, { label: string; color: string; note: string }> = {
  "profile-wheelchair": { label: "Wheelchair user", color: "#7c3aed", note: "avoids steps" },
  "profile-parent": { label: "School-pickup parent", color: "#d97706", note: "uses the north stair shortcut" },
  "profile-cyclist": { label: "Cyclist", color: "#059669", note: "uses a real road detour" },
};

const DEFAULT_PROFILE_ID = "profile-wheelchair";

interface RoutePath {
  id: string;
  name: string;
  coordinates: [number, number][];
  isDefault: boolean;
  isStaged: boolean;
  isDetour: boolean;
  profileId: string;
  profileColor: string;
}

function FitRouteBounds({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(bounds, { padding: [24, 24] });
  }, [bounds, map]);

  return null;
}

function RoutePolyline({ path, prefersReducedMotion }: { path: RoutePath; prefersReducedMotion: boolean }) {
  const ref = useRef<LeafletPolyline | null>(null);
  const glowRef = useRef<LeafletPolyline | null>(null);
  const stagedClass = path.isStaged
    ? prefersReducedMotion
      ? "segment-path--staged-reduced"
      : "segment-path--staged"
    : undefined;
  const routeClassNames = path.isStaged
    ? [stagedClass]
    : path.isDefault
      ? ["segment-path--own", `segment-path--${path.profileId}`]
      : ["segment-path--background"];
  const routeClassName = routeClassNames.filter(Boolean).join(" ");
  const detourLabelClass = path.isStaged
    ? "route-detour-label--staged"
    : `route-detour-label--${path.profileId}`;

  // Leaflet owns the SVG path, so add the semantic hook to its rendered element
  // after react-leaflet has created it. The class drives the 600 ms sweep in CSS.
  useEffect(() => {
    const element = ref.current?.getElement();
    if (!element) return;
    const currentClasses = routeClassName.split(" ").filter(Boolean);
    element.classList.remove(
      "segment-path--staged",
      "segment-path--staged-reduced",
      "segment-path--own",
      "segment-path--background",
      ...Object.keys(PROFILE_ROUTE_DETAILS).map((id) => `segment-path--${id}`),
    );
    element.classList.add(...currentClasses);
    element.setAttribute("data-segment-id", path.id);
    if (path.isStaged) {
      element.setAttribute("data-staged", "true");
    } else {
      element.removeAttribute("data-staged");
    }
  }, [path.id, path.isStaged, routeClassName]);

  // The glow polyline: Leaflet does not reliably attach pathOptions.className to
  // its SVG element, so tag the class on the rendered element ourselves.
  useEffect(() => {
    const glowEl = glowRef.current?.getElement();
    if (!glowEl) return;
    glowEl.classList.add("segment-path__glow");
  }, [path.isStaged]);

  return (
    <>
      {path.isStaged && (
        <Polyline
          ref={glowRef}
          positions={path.coordinates}
          pathOptions={{ color: "#0b8bff", weight: 14, opacity: 0.35 }}
          interactive={false}
          aria-hidden="true"
        />
      )}
      <Polyline
        ref={ref}
        positions={path.coordinates}
        pathOptions={{
          color: path.isStaged ? "#0075de" : path.isDefault ? path.profileColor : "#999",
          weight: path.isStaged ? 5 : path.isDefault ? 4 : 1,
          dashArray: path.isStaged || path.isDefault ? undefined : "4 4",
          opacity: path.isStaged || path.isDefault ? 1 : 0.25,
          className: routeClassName,
        }}
        // react-leaflet passes this to test doubles; the effect above guarantees
        // the attribute is also applied to Leaflet's actual SVG element.
        data-staged={path.isStaged ? "true" : undefined}
        data-segment-id={path.id}
      >
        {path.isDetour && (
          <Tooltip permanent direction="top" offset={[0, -8]} className={`route-detour-label ${detourLabelClass}`}>
            {path.name}
          </Tooltip>
        )}
      </Polyline>
    </>
  );
}

function LocalRouteMapFallback({ paths }: { paths: RoutePath[] }) {
  const { svgPaths, places } = useMemo(() => {
    const allCoords = segmentsGeo.features.flatMap((feature) => feature.geometry.coordinates as number[][]);
    const lngs = allCoords.map((coordinate) => coordinate[0]);
    const lats = allCoords.map((coordinate) => coordinate[1]);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const padX = 0.0005;
    const padY = 0.0016;
    const viewMinLng = minLng - padX;
    const viewMaxLng = maxLng + padX;
    const viewMinLat = minLat - padY;
    const viewMaxLat = maxLat + padY;
    const rangeX = viewMaxLng - viewMinLng;
    const rangeY = viewMaxLat - viewMinLat;
    const scale = 800 / rangeX;
    const routeHeightPx = rangeY * scale;
    const offsetY = (1000 - routeHeightPx) / 2;
    const scaleX = (lng: number) => ((lng - viewMinLng) / rangeX) * 800;
    const scaleY = (lat: number) => offsetY + (1 - (lat - viewMinLat) / rangeY) * routeHeightPx;

    return {
      svgPaths: paths.map((path) => {
        const [labelLat, labelLng] = path.coordinates[Math.floor(path.coordinates.length / 2)];
        return {
          ...path,
          d: path.coordinates
            .map(([lat, lng], index) => `${index === 0 ? "M" : "L"}${scaleX(lng).toFixed(1)},${scaleY(lat).toFixed(1)}`)
            .join(" "),
          labelX: scaleX(labelLng),
          labelY: scaleY(labelLat) - 12,
        };
      }),
      places: placesGeo.features.map((place) => ({
        x: scaleX(place.geometry.coordinates[0]),
        y: scaleY(place.geometry.coordinates[1]),
        name: place.properties.name,
        placeType: place.properties.placeType,
      })),
    };
  }, [paths]);

  return (
    <svg
      data-testid="local-route-map-fallback"
      role="img"
      aria-label="Illustrative local route diagram (offline fallback)"
      viewBox="0 0 800 1000"
      className="local-route-map local-route-map--fallback"
    >
      <rect x="0" y="0" width="800" height="1000" fill="#f6f5f4" />
      {[0, 200, 400, 600, 800].map((n) => (
        <line key={`v${n}`} x1={n} y1={0} x2={n} y2={1000} stroke="rgba(0,0,0,0.05)" strokeWidth={1} />
      ))}
      {[0, 250, 500, 750, 1000].map((n) => (
        <line key={`h${n}`} x1={0} y1={n} x2={800} y2={n} stroke="rgba(0,0,0,0.05)" strokeWidth={1} />
      ))}
      {svgPaths.map((path) => (
        <g key={path.id}>
          {path.isStaged && (
            <path d={path.d} fill="none" stroke="#0075de" strokeWidth={9} opacity={0.2} className="segment-path__glow" aria-hidden="true" />
          )}
          <path
            d={path.d}
            fill="none"
            stroke={path.isStaged ? "#0075de" : path.isDefault ? path.profileColor : "#999"}
            strokeWidth={path.isStaged ? 5 : path.isDefault ? 4 : 1}
            strokeDasharray={path.isStaged || path.isDefault ? undefined : "4 4"}
            opacity={path.isStaged || path.isDefault ? 1 : 0.25}
            data-staged={path.isStaged || undefined}
            data-segment-id={path.id}
            className={path.isStaged ? "segment-path--staged-reduced" : path.isDefault ? `segment-path--own segment-path--${path.profileId}` : "segment-path--background"}
          />
          {path.isDetour && (
            <text x={path.labelX} y={path.labelY} className={`route-detour-label ${path.isStaged ? "route-detour-label--staged" : `route-detour-label--${path.profileId}`}`}>
              {path.name}
            </text>
          )}
        </g>
      ))}
      {places.map((place) => (
        <g key={place.name}>
          <circle
            cx={place.x}
            cy={place.y}
            r={6}
            fill={place.placeType === "origin" || place.placeType === "destination" ? "#0075de" : "#666"}
            stroke="#fff"
            strokeWidth={2}
          />
          <text x={place.x} y={place.y - 10} fontSize={11} fill="#1a1a1a" stroke="#ffffff" strokeWidth={3} paintOrder="stroke fill" textAnchor="middle" fontWeight={600}>
            {place.name}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function LocalRouteMap({ profileId = DEFAULT_PROFILE_ID, defaultSegmentIds, stagedMappingIds, mappings }: LocalRouteMapProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    () => typeof window !== "undefined" && (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false),
  );
  const [hasTileError, setHasTileError] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!mq) return;
    const onChange = (event: MediaQueryListEvent) => setPrefersReducedMotion(event.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  const { paths, bounds, stairsMarker } = useMemo(() => {
    const allCoords = segmentsGeo.features.flatMap((feature) => feature.geometry.coordinates as number[][]);
    const lngs = allCoords.map((coordinate) => coordinate[0]);
    const lats = allCoords.map((coordinate) => coordinate[1]);
    const stagedIds = new Set(stagedMappingIds);
    const profile = PROFILE_ROUTE_DETAILS[profileId] ?? PROFILE_ROUTE_DETAILS[DEFAULT_PROFILE_ID];
    return {
      paths: segmentsGeo.features.map((feature) => {
        const id = feature.properties.id;
        return {
          id,
          name: feature.properties.segmentName,
          coordinates: (feature.geometry.coordinates as number[][]).map(([lng, lat]) => [lat, lng]),
          isDefault: defaultSegmentIds.includes(id),
          isStaged: mappings.some((mapping) => stagedIds.has(mapping.id) && mapping.segmentIds.includes(id)),
          isDetour: defaultSegmentIds.includes(id) && /(?:alternate|detour|bypass)/i.test(feature.properties.segmentName),
          profileId,
          profileColor: profile.color,
        } as RoutePath;
      }),
      bounds: [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ] as LatLngBoundsExpression,
      stairsMarker: (() => {
        const stairs = segmentsGeo.features.find(
          (feature) => feature.properties.id === "seg-saloma-north-stairs",
        );
        if (!stairs) return null;
        const coords = stairs.geometry.coordinates as number[][];
        const mid = coords[Math.floor(coords.length / 2)];
        const [midLng, midLat] = mid;
        return {
          lat: midLat,
          lng: midLng,
          usedByThisProfile: defaultSegmentIds.includes("seg-saloma-north-stairs"),
          label: "Stair shortcut",
        };
      })(),
    };
  }, [defaultSegmentIds, mappings, profileId, stagedMappingIds]);

  const stagedCount = stagedMappingIds.length;
  const profile = PROFILE_ROUTE_DETAILS[profileId] ?? PROFILE_ROUTE_DETAILS[DEFAULT_PROFILE_ID];

  return (
    <section aria-label="Local route map">
      <div className="map-header">
        <span className="map-disclaimer">Illustrative local route diagram — not navigation</span>
        <span data-testid="profile-route-caption" className={`profile-route-caption profile-route-caption--${profileId}`} style={{ color: profile.color }}>
          Your route as a {profile.label} — {profile.note}
        </span>
        {stagedCount > 0 && (
          <span className="map-staged-chip" aria-label={`${stagedCount} staged plan ${stagedCount === 1 ? "overlay" : "overlays"} awaiting your review`}>
            <span className="map-staged-chip__dot" aria-hidden="true" />
            Staged — awaiting your review
          </span>
        )}
      </div>
      {hasTileError ? (
        <LocalRouteMapFallback paths={paths} />
      ) : (
        <MapContainer
          className="local-route-map"
          center={[3.14, 101.692]}
          zoom={15}
          scrollWheelZoom={false}
          aria-label="Real local route map of the Kampung Baru, Saloma Link, and KLCC Park corridor"
        >
          <FitRouteBounds bounds={bounds} />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
            eventHandlers={{ tileerror: () => setHasTileError(true) }}
          />
          {paths.map((path) => <RoutePolyline key={path.id} path={path} prefersReducedMotion={prefersReducedMotion} />)}
          {stairsMarker && (
            <CircleMarker
              center={[stairsMarker.lat, stairsMarker.lng]}
              radius={11}
              pathOptions={{
                color: stairsMarker.usedByThisProfile ? "#d97706" : "#dc2626",
                weight: 2,
                fillColor: "#fff7ed",
                fillOpacity: 1,
              }}
            >
              <Tooltip permanent direction="top" offset={[0, -6]} className="stairs-marker-label">
                🪜 {stairsMarker.label}
                {stairsMarker.usedByThisProfile
                  ? " — on your route"
                  : " — your route avoids this"}
              </Tooltip>
            </CircleMarker>
          )}
          {placesGeo.features.map((place) => {
            const [lng, lat] = place.geometry.coordinates;
            const isEndpoint = place.properties.placeType === "origin" || place.properties.placeType === "destination";
            return (
              <CircleMarker key={place.properties.id} center={[lat, lng]} radius={6} pathOptions={{ color: "#fff", weight: 2, fillColor: isEndpoint ? "#0075de" : "#666", fillOpacity: 1 }}>
                <Tooltip permanent direction="top" offset={[0, -7]}>{place.properties.name}</Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      )}
      <div className="map-attribution">
        <p className="map-attribution-text">
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>
          {" — "}
          Geometry and tags are illustrative local fixture context, not navigation or certified accessibility data.
        </p>
      </div>
    </section>
  );
}
