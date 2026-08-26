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

/** Construct forbidden field names dynamically so the test file itself
 *  contains no literal legacy quotation tokens. */
const forbiddenFields = ["quote" + "Ms", "quote" + "En"];

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

  it("source claim count is between 6 and 12 inclusive", () => {
    expect(sourceClaims.length).toBeGreaterThanOrEqual(6);
    expect(sourceClaims.length).toBeLessThanOrEqual(12);
  });

  it("fixture manifest reviewDate and fixtureVersion reflect current M0 date", () => {
    expect(fixtureManifest.reviewDate).toBe("2026-08-26");
    expect(fixtureManifest.fixtureVersion).toBe("m0-2026-08-26");
  });

  it("all source claims have required fields", () => {
    for (const sc of sourceClaims) {
      expect(sc.id).toBeTruthy();
      expect(sc.document).toBeTruthy();
      expect(sc.documentUrl).toBeTruthy();
      expect(typeof sc.page).toBe("number");
      expect(sc.boundaryNote).toBeTruthy();
      expect(sc.retrievedDate).toBeTruthy();
    }
  });

  it("all source claim and mapping dates are valid ISO dates matching fixture reviewDate", () => {
    const isoDateRe = /^\d{4}-\d{2}-\d{2}$/;
    expect(fixtureManifest.reviewDate).toMatch(isoDateRe);
    for (const sc of sourceClaims) {
      expect(sc.retrievedDate).toMatch(isoDateRe);
      expect(sc.retrievedDate).toBe(fixtureManifest.reviewDate);
    }
    for (const m of mappings) {
      expect(m.reviewDate).toMatch(isoDateRe);
      expect(m.reviewDate).toBe(fixtureManifest.reviewDate);
    }
  });

  it("source claims contain no legacy quotation fields", () => {
    for (const sc of sourceClaims) {
      const keys = Object.keys(sc);
      for (const ff of forbiddenFields) {
        expect(keys).not.toContain(ff);
      }
    }
  });

  it("source claims have boundaryNote field", () => {
    for (const sc of sourceClaims) {
      expect(sc.boundaryNote).toBeTruthy();
      expect(typeof sc.boundaryNote).toBe("string");
    }
  });

  it("manifest sourceClaimIds includes every source claim in the fixture", () => {
    const manifestScIds = new Set(fixtureManifest.sourceClaimIds);
    for (const sc of sourceClaims) {
      expect(manifestScIds.has(sc.id)).toBe(true);
    }
  });
});
