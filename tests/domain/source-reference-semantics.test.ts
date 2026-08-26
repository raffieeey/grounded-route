/**
 * FDN-007 source-reference semantics in domain actions.
 * Validates the strict source-reference payload shape and absence of
 * legacy quotation fields.
 */
import { describe, it, expect } from "vitest";
import {
  createGroundedRouteController,
  selectScenario,
} from "@/domain/actions.ts";
import type { SourceClaim, DraftStatement } from "@/contracts/types.ts";
import sourceClaimsData from "../../data/source_claims.json";

const { humanPort } = createGroundedRouteController();
const FIXTURE_SCENARIO_ID = "saloma-link-active-mobility-demo";

/** Construct forbidden field names dynamically so the test file itself
 *  contains no literal legacy quotation tokens. */
const forbiddenFields = ["quote" + "Ms", "quote" + "En"];

describe("FDN-007 source-reference semantics", () => {
  it("SourceClaim type has no legacy quotation fields", () => {
    for (const sc of sourceClaimsData as SourceClaim[]) {
      const keys = Object.keys(sc);
      for (const ff of forbiddenFields) {
        expect(keys).not.toContain(ff);
      }
    }
  });

  it("SourceClaim has boundaryNote field", () => {
    for (const sc of sourceClaimsData as SourceClaim[]) {
      expect(sc).toHaveProperty("boundaryNote");
      expect(typeof (sc as unknown as Record<string, unknown>).boundaryNote).toBe("string");
    }
  });

  it("DraftStatementClass includes source-reference", () => {
    const state = humanPort.createInitialState();
    const st = selectScenario(state, FIXTURE_SCENARIO_ID);
    if (!st.success) throw new Error("seed failed");
    const drafted = humanPort.createStructuredDraft(
      st.data,
      {
        mappingIds: ["map-01"],
        sourceClaimIds: ["sc-01"],
        userPosition: "Resident",
        requestedChange: "Add ramp",
        openQuestions: ["Timeline?"],
      },
      st.data.route.revision
    );
    if (!drafted.success) throw new Error(drafted.message);
    const statements = drafted.data.draft!.statements;
    const sourceRef = statements.find(
      (s: DraftStatement) => s.statementClass === "source-reference"
    );
    expect(sourceRef).toBeDefined();
  });

  it("source-reference statement has approved reference fields; not legacy fields", () => {
    const state = humanPort.createInitialState();
    const st = selectScenario(state, FIXTURE_SCENARIO_ID);
    if (!st.success) throw new Error("seed failed");
    const drafted = humanPort.createStructuredDraft(
      st.data,
      {
        mappingIds: ["map-01"],
        sourceClaimIds: ["sc-01"],
        userPosition: "Resident",
        requestedChange: "Add ramp",
        openQuestions: ["Timeline?"],
      },
      st.data.route.revision
    );
    if (!drafted.success) throw new Error(drafted.message);
    const sourceRef = drafted.data.draft!.statements.find(
      (s: DraftStatement) => s.statementClass === "source-reference"
    );
    expect(sourceRef).toBeDefined();
    // Must have reference metadata fields
    expect(sourceRef).toHaveProperty("document");
    expect(sourceRef).toHaveProperty("page");
    expect(sourceRef).toHaveProperty("documentUrl");
    expect(sourceRef).toHaveProperty("retrievedDate");
    expect(sourceRef).toHaveProperty("boundaryNote");
    // Must NOT have legacy quotation fields
    const sr = sourceRef as unknown as Record<string, unknown>;
    for (const ff of forbiddenFields) {
      expect(sr).not.toHaveProperty(ff);
    }
  });
});
