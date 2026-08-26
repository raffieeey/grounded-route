import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadJson(name: string) {
  return JSON.parse(readFileSync(resolve(__dirname, "../../data", name), "utf-8"));
}

const fixtureManifest = loadJson("fixture_manifest.json");
const sourceClaims = loadJson("source_claims.json");
const mappings = loadJson("scenario_impact_mappings.json");
const profiles = loadJson("route_profiles.json");
const segmentsGeo = loadJson("route_segments.geojson");
const placesGeo = loadJson("places.geojson");

describe("fixture manifest validation", () => {
  it("fixture manifest validates all cross-file IDs", () => {
    const segIds = new Set(
      (segmentsGeo.features as Array<{ properties: { id: string } }>).map((f) => f.properties.id)
    );
    const placeIds = new Set(
      (placesGeo.features as Array<{ properties: { id: string } }>).map((f) => f.properties.id)
    );
    const scIds = new Set(sourceClaims.map((s: { id: string }) => s.id));
    const mapIds = new Set(mappings.map((m: { id: string }) => m.id));
    const profIds = new Set(profiles.map((p: { id: string }) => p.id));

    for (const id of fixtureManifest.sourceClaimIds) {
      expect(scIds.has(id)).toBe(true);
    }
    for (const id of fixtureManifest.segmentIds) {
      expect(segIds.has(id)).toBe(true);
    }
    for (const id of fixtureManifest.mappingIds) {
      expect(mapIds.has(id)).toBe(true);
    }
    for (const id of fixtureManifest.profileIds) {
      expect(profIds.has(id)).toBe(true);
    }
    for (const id of fixtureManifest.placeIds) {
      expect(placeIds.has(id)).toBe(true);
    }
  });

  it("data-attribution records mark source data as excluded from public release until terms verified", () => {
    expect(fixtureManifest.publicReleaseStatus).toBe("excluded");
    expect(fixtureManifest.knownUncertainties.length).toBeGreaterThan(0);
    const attributionNote = fixtureManifest.knownUncertainties.some((u: string) =>
      u.toLowerCase().includes("public-release") || u.toLowerCase().includes("pending")
    );
    expect(attributionNote).toBe(true);
  });

  it("source claims do not contain segment-impact fields", () => {
    for (const sc of sourceClaims) {
      const keys = Object.keys(sc);
      expect(keys).not.toContain("segmentIds");
      expect(keys).not.toContain("impact");
      expect(keys).not.toContain("routeEffect");
      expect(keys).not.toContain("mappingIds");
    }
  });

  it("mappings contain required review fields", () => {
    for (const m of mappings) {
      expect(m.mappingType).toBe("curated-interpretation");
      expect(m.rationale).toBeTruthy();
      expect(m.uncertainty).toBeTruthy();
      expect(m.reviewer).toBeTruthy();
      expect(m.reviewDate).toBeTruthy();
      expect(m.sourceClaimIds.length).toBeGreaterThan(0);
      expect(m.segmentIds.length).toBeGreaterThan(0);
    }
  });
});
