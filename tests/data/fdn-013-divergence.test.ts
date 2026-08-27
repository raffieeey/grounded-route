import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

type Coordinate = [number, number];
type Segment = {
  geometry: { coordinates: Coordinate[] };
  properties: { id: string; osmWayIds: string[]; tags: string[] };
};

function loadJson(name: string) {
  return JSON.parse(readFileSync(resolve(__dirname, "../../data", name), "utf-8"));
}

const segments = (loadJson("route_segments.geojson").features as Segment[]);
const profiles = loadJson("route_profiles.json") as Array<{ id: string; routeSegmentIds: string[] }>;
const byId = new Map(segments.map((segment) => [segment.properties.id, segment]));

function routeCoordinates(profileId: string): Coordinate[] {
  const profile = profiles.find((candidate) => candidate.id === profileId)!;
  return profile.routeSegmentIds.flatMap((id) => byId.get(id)!.geometry.coordinates);
}

function haversineMeters(a: Coordinate, b: Coordinate): number {
  const rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad;
  const dLng = (b[0] - a[0]) * rad;
  const lat1 = a[1] * rad;
  const lat2 = b[1] * rad;
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(sinLat ** 2 + Math.cos(lat1) * Math.cos(lat2) * sinLng ** 2), Math.sqrt(1 - (sinLat ** 2 + Math.cos(lat1) * Math.cos(lat2) * sinLng ** 2)));
}

function bearingRadians(a: Coordinate, b: Coordinate): number {
  const rad = Math.PI / 180;
  const lngDelta = (b[0] - a[0]) * rad;
  const lat1 = a[1] * rad;
  const lat2 = b[1] * rad;
  return Math.atan2(Math.sin(lngDelta) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lngDelta));
}

// Great-circle point-to-segment distance: Haversine angular distance plus
// cross-track distance, falling back to the closest endpoint outside a segment.
function pointToSegmentMeters(point: Coordinate, start: Coordinate, end: Coordinate): number {
  const radius = 6_371_000;
  const segmentAngle = haversineMeters(start, end) / radius;
  if (segmentAngle === 0) return haversineMeters(point, start);
  const startToPoint = haversineMeters(start, point) / radius;
  const crossTrack = Math.asin(Math.sin(startToPoint) * Math.sin(bearingRadians(start, point) - bearingRadians(start, end)));
  const alongTrack = Math.acos(Math.min(1, Math.max(-1, Math.cos(startToPoint) / Math.cos(crossTrack))));
  if (alongTrack > segmentAngle) return Math.min(haversineMeters(point, start), haversineMeters(point, end));
  return Math.abs(crossTrack) * radius;
}

function maxPointToPolylineMeters(points: Coordinate[], polyline: Coordinate[]): number {
  return Math.max(...points.map((point) => Math.min(...polyline.slice(0, -1).map((start, index) => pointToSegmentMeters(point, start, polyline[index + 1])))));
}

describe("FDN-013 divergent real-route fixture", () => {
  it("records OSM way IDs, routes a non-wheelchair profile on real steps, and keeps wheelchair step-free", () => {
    for (const segment of segments) {
      expect(segment.properties.osmWayIds.length, segment.properties.id).toBeGreaterThan(0);
    }
    const wheelchair = profiles.find((profile) => profile.id === "profile-wheelchair")!;
    expect(wheelchair.routeSegmentIds.some((id) => byId.get(id)!.properties.tags.includes("steps"))).toBe(false);
    expect(profiles.filter((profile) => profile.id !== "profile-wheelchair").some((profile) =>
      profile.routeSegmentIds.some((id) => byId.get(id)!.properties.tags.includes("steps")),
    )).toBe(true);
  });

  it("keeps wheelchair and cyclist geometry physically divergent in both directions", () => {
    const wheelchair = routeCoordinates("profile-wheelchair");
    const cyclist = routeCoordinates("profile-cyclist");
    const wheelchairToCyclist = maxPointToPolylineMeters(wheelchair, cyclist);
    const cyclistToWheelchair = maxPointToPolylineMeters(cyclist, wheelchair);
    expect(wheelchairToCyclist).toBeGreaterThanOrEqual(150);
    expect(cyclistToWheelchair).toBeGreaterThanOrEqual(150);
  });
});
