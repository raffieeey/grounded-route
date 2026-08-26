/**
 * FDN-007 source-reference fixture semantics.
 * Validates the strict source-reference payload shape and absence of
 * legacy quotation fields or misleading provenance wording.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadJson(name: string) {
  return JSON.parse(readFileSync(resolve(__dirname, "../../data", name), "utf-8"));
}

const sourceClaims = loadJson("source_claims.json");

/** Construct forbidden field names dynamically so the test file itself
 *  contains no literal legacy quotation tokens. */
const forbiddenFields = ["quote" + "Ms", "quote" + "En"];

describe("FDN-007 source-reference fixture", () => {
  it("source claims contain no legacy quotation fields", () => {
    for (const sc of sourceClaims) {
      const keys = Object.keys(sc);
      for (const ff of forbiddenFields) {
        expect(keys).not.toContain(ff);
      }
    }
  });

  it("source claims contain boundaryNote field", () => {
    for (const sc of sourceClaims) {
      expect(sc.boundaryNote).toBeTruthy();
      expect(typeof sc.boundaryNote).toBe("string");
    }
  });

  it("source claims have the approved reference fields only", () => {
    const approvedFields = new Set(["id", "category", "document", "documentUrl", "page", "retrievedDate", "boundaryNote"]);
    for (const sc of sourceClaims) {
      for (const key of Object.keys(sc)) {
        expect(approvedFields.has(key)).toBe(true);
      }
    }
  });

  it("source claims do not contain misleading provenance wording", () => {
    for (const sc of sourceClaims) {
      const text = `${sc.boundaryNote ?? ""}`.toLowerCase();
      const misleading = ["our " + "research found", "independent " + "research"];
      for (const m of misleading) {
        expect(text).not.toContain(m);
      }
    }
  });
});
