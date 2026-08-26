/**
 * FDN-007 RED tests: source-reference semantics in domain actions and WebMCP.
 * These MUST fail until the type system and domain logic are migrated.
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

describe("FDN-007 source-reference semantics (RED phase)", () => {
  it("SourceClaim type has no quoteMs or quoteEn fields", () => {
    for (const sc of sourceClaimsData as SourceClaim[]) {
      const keys = Object.keys(sc);
      expect(keys).not.toContain("quoteMs");
      expect(keys).not.toContain("quoteEn");
    }
  });

  it("SourceClaim has boundaryNote field", () => {
    for (const sc of sourceClaimsData as SourceClaim[]) {
      expect(sc).toHaveProperty("boundaryNote");
      expect(typeof (sc as unknown as Record<string, unknown>).boundaryNote).toBe("string");
    }
  });

  it("DraftStatementClass includes source-reference, not source-quote", () => {
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
    // source-quote class must not exist in the type system (guaranteed by DraftStatementClass union)
  });

  it("source-reference statement has document, page, documentUrl, retrievedDate, boundaryNote; not quoteMs/quoteEn", () => {
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
    // Must NOT have quote fields
    const sr = sourceRef as unknown as Record<string, unknown>;
    expect(sr).not.toHaveProperty("quoteMs");
    expect(sr).not.toHaveProperty("quoteEn");
    expect(sr).not.toHaveProperty("sourceClaimQuote");
  });
});
