/**
 * FDN-007 RED tests: source-reference fixture semantics.
 * These MUST fail against the current quote-based fixture and type definitions,
 * then pass once the source-reference migration is complete.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadJson(name: string) {
  return JSON.parse(readFileSync(resolve(__dirname, "../../data", name), "utf-8"));
}

const sourceClaims = loadJson("source_claims.json");

describe("FDN-007 source-reference fixture (RED phase)", () => {
  it("source claims contain no quoteMs or quoteEn fields", () => {
    for (const sc of sourceClaims) {
      const keys = Object.keys(sc);
      expect(keys).not.toContain("quoteMs");
      expect(keys).not.toContain("quoteEn");
    }
  });

  it("source claims contain boundaryNote field", () => {
    for (const sc of sourceClaims) {
      expect(sc.boundaryNote).toBeTruthy();
      expect(typeof sc.boundaryNote).toBe("string");
    }
  });

  it("source claims have required reference fields: id, category, document, documentUrl, page, retrievedDate, boundaryNote, notes", () => {
    for (const sc of sourceClaims) {
      expect(sc.id).toBeTruthy();
      expect(sc.category).toBeTruthy();
      expect(sc.document).toBeTruthy();
      expect(sc.documentUrl).toBeTruthy();
      expect(typeof sc.page).toBe("number");
      expect(sc.retrievedDate).toBeTruthy();
      expect(sc.boundaryNote).toBeTruthy();
      expect(sc.notes).toBeTruthy();
    }
  });

  it("source claims do not contain misleading 'our research' or 'independent research' wording", () => {
    for (const sc of sourceClaims) {
      const text = `${sc.boundaryNote ?? ""} ${sc.notes ?? ""}`.toLowerCase();
      expect(text).not.toContain("our research found");
      expect(text).not.toContain("independent research");
    }
  });
});
