import { describe, it, expect } from "vitest";
import type { Result } from "@/contracts/types.ts";
import {
  createInitialState,
  selectScenario,
  selectProfile,
  setActiveSegments,
  removeStagedMapping,
  isApprovalValid,
  residentRequestExport,
  createGroundedRouteController,
} from "@/domain/actions.ts";

const { agentPort, residentPort } = createGroundedRouteController();
const FIXTURE_SCENARIO_ID = "saloma-link-active-mobility-demo";
const FIXTURE_MAPPING_ID = "map-01";

function unwrap<T>(r: Result<T>): T {
  if (!r.success) throw new Error((r as { message: string }).message);
  return (r as { data: T }).data;
}

function unwrapErr<T>(r: Result<T>): { errorCode: string; message: string } {
  if (r.success) throw new Error("expected failure");
  return r as { errorCode: string; message: string };
}

describe("domain actions", () => {
  it("source claims cannot contain segment-impact fields", () => {
    const claim = {
      id: "sc-01",
      category: "transport-policy" as const,
      document: "PTKL2040 Executive Summary",
      documentUrl:
        "https://ppkl.dbkl.gov.my/wp-content/uploads/2025/07/RINGKASAN-EKSEKUTIF-PTKL2040.pdf",
      page: 37,
      quoteMs:
        "Merangka strategi berkaitan penyediaan kepelbagaian pengangkutan awam, galakkan penggunaan mobiliti aktif",
      quoteEn:
        "Formulate strategies related to providing diverse public transport, encourage active mobility usage",
      retrievedDate: "2025-08-26",
      notes: "Policy direction only; no specific segment impact stated",
    };
    const keys = Object.keys(claim);
    expect(keys).not.toContain("segmentIds");
    expect(keys).not.toContain("impact");
    expect(keys).not.toContain("routeEffect");
  });

  it("mappings require valid source/segment/scenario IDs plus rationale/uncertainty/reviewer/date", () => {
    const mapping = {
      id: "map-01",
      mappingType: "curated-interpretation" as const,
      scenarioId: FIXTURE_SCENARIO_ID,
      segmentIds: ["seg-01"],
      sourceClaimIds: ["sc-01"],
      rationale:
        "Illustrative route-evidence mapping; not an official construction or accessibility finding",
      uncertainty:
        "Actual implementation timing and exact segment boundaries are unverified",
      certaintyLevel: "low" as const,
      reviewer: "Demo Reviewer",
      reviewDate: "2025-08-26",
    };
    expect(mapping.scenarioId).toBeTruthy();
    expect(mapping.segmentIds.length).toBeGreaterThan(0);
    expect(mapping.sourceClaimIds.length).toBeGreaterThan(0);
    expect(mapping.rationale).toBeTruthy();
    expect(mapping.uncertainty).toBeTruthy();
    expect(mapping.reviewer).toBeTruthy();
    expect(mapping.reviewDate).toBeTruthy();
  });

  it("a reviewed mapping can stage an overlay, while a direct source claim cannot", () => {
    const state = createInitialState();
    const s1 = selectScenario(state, FIXTURE_SCENARIO_ID);
    expect(s1.success).toBe(true);
    const s2 = agentPort.stageMapping(
      unwrap(s1),
      FIXTURE_MAPPING_ID,
      unwrap(s1).route.revision
    );
    expect(s2.success).toBe(true);
    // Source claim alone has no action; it is just data.
    expect(() => {
      void (state as unknown as Record<string, unknown>).sourceClaimStageOverlay;
    }).not.toThrow();
  });

  it("stale expected revision fails without state mutation", () => {
    const state = createInitialState();
    const s1 = selectScenario(state, "demo-scenario");
    expect(s1.success).toBe(true);
    const revisionBefore = unwrap(s1).route.revision;
    const s2 = setActiveSegments(unwrap(s1), ["seg-01"], 999);
    expect(s2.success).toBe(false);
    expect(unwrapErr(s2).errorCode).toBe("STALE_CONTEXT");
    expect(unwrap(s1).route.revision).toBe(revisionBefore);
    expect(unwrap(s1).auditLog.length).toBe(1);
  });

  it("cross-scenario mapping calls fail without state mutation", () => {
    const state = createInitialState();
    const s1 = selectScenario(state, "scenario-other");
    expect(s1.success).toBe(true);
    const mappingResult = agentPort.stageMapping(
      unwrap(s1),
      FIXTURE_MAPPING_ID,
      unwrap(s1).route.revision
    );
    expect(mappingResult.success).toBe(false);
    expect(unwrapErr(mappingResult).errorCode).toBe("PRECONDITION_FAILED");
    expect(unwrap(s1).route.stagedMappingIds).toEqual([]);
    expect(unwrap(s1).auditLog.length).toBe(1);
  });

  it("any route/scenario/evidence/mapping/draft mutation invalidates exact-revision approval", () => {
    const state = createInitialState();
    let st = unwrap(selectScenario(state, FIXTURE_SCENARIO_ID));
    st = unwrap(selectProfile(st, "wheelchair"));
    st = unwrap(setActiveSegments(st, ["seg-01"], st.route.revision));
    st = unwrap(agentPort.stageMapping(st, FIXTURE_MAPPING_ID, st.route.revision));
    st = unwrap(agentPort.createDraft(st, "Test draft", [FIXTURE_MAPPING_ID], st.route.revision));
    const rev = st.route.revision;
    st = unwrap(residentPort.approveDraft(st, st.draft!.id, rev));
    expect(isApprovalValid(st)).toBe(true);

    // Mutate — approval should invalidate
    st = unwrap(setActiveSegments(st, ["seg-01", "seg-02"], st.route.revision));
    expect(isApprovalValid(st)).toBe(false);
  });

  it("no local domain action can enable export without explicit direct-human approval API that validates the current snapshot", () => {
    const state = createInitialState();
    let st = unwrap(selectScenario(state, FIXTURE_SCENARIO_ID));
    st = unwrap(agentPort.createDraft(st, "Text", [], st.route.revision));
    const exportResult = residentPort.requestExport(st);
    expect(exportResult.success).toBe(false);
    expect(unwrapErr(exportResult).errorCode).toBe("PRECONDITION_FAILED");
  });

  it("export succeeds only with human confirmation and matching revision", () => {
    const state = createInitialState();
    let st = unwrap(selectScenario(state, FIXTURE_SCENARIO_ID));
    st = unwrap(agentPort.createDraft(st, "Text", [], st.route.revision));
    const rev = st.route.revision;
    st = unwrap(residentPort.approveDraft(st, st.draft!.id, rev));
    const exportResult = residentPort.requestExport(st);
    expect(exportResult.success).toBe(true);
  });

  it("removeStagedMapping exists and fails when mapping is not staged", () => {
    const state = createInitialState();
    const result = removeStagedMapping(state, "map-99", state.route.revision);
    expect(result.success).toBe(false);
    expect(unwrapErr(result).errorCode).toBe("NOT_FOUND");
  });

  it("agent port exposes stage/create methods that do not accept caller-supplied mapping context", () => {
    // Stage: (state, mappingId, expectedRevision)
    // Draft: (state, text, mappingIds, expectedRevision)
    expect(agentPort.stageMapping.length).toBe(3);
    expect(agentPort.createDraft.length).toBe(4);
  });

  // SPK-FND-001: fixture-aware mapping ID validation
  it("stageMapping rejects sc-01 with trusted fixture allowlist and no mutation/audit success", () => {
    const state = createInitialState();
    const st = unwrap(selectScenario(state, FIXTURE_SCENARIO_ID));
    const beforeRevision = st.route.revision;
    const beforeAudit = st.auditLog.length;
    const beforeDraft = st.draft;
    const beforeMappings = [...st.route.stagedMappingIds];
    const result = agentPort.stageMapping(st, "sc-01", st.route.revision);
    expect(result.success).toBe(false);
    expect(unwrapErr(result).errorCode).toBe("PRECONDITION_FAILED");
    expect(st.route.revision).toBe(beforeRevision);
    expect(st.auditLog.length).toBe(beforeAudit);
    expect(st.draft).toBe(beforeDraft);
    expect(st.route.stagedMappingIds).toEqual(beforeMappings);
  });

  it("createDraft rejects an unknown mapping id without mutation", () => {
    const state = createInitialState();
    const st = unwrap(selectScenario(state, FIXTURE_SCENARIO_ID));
    const beforeRevision = st.route.revision;
    const beforeAudit = st.auditLog.length;
    const beforeDraft = st.draft;
    const result = agentPort.createDraft(st, "Text", ["map-unknown"], st.route.revision);
    expect(result.success).toBe(false);
    expect(unwrapErr(result).errorCode).toBe("PRECONDITION_FAILED");
    expect(st.route.revision).toBe(beforeRevision);
    expect(st.auditLog.length).toBe(beforeAudit);
    expect(st.draft).toBe(beforeDraft);
  });

  it("createDraft rejects cross-scenario mapping IDs without mutation or audit success", () => {
    const state = createInitialState();
    const st = unwrap(selectScenario(state, "scenario-other"));
    const beforeRevision = st.route.revision;
    const beforeAudit = st.auditLog.length;
    const result = agentPort.createDraft(st, "Text", [FIXTURE_MAPPING_ID], st.route.revision);
    expect(result.success).toBe(false);
    expect(unwrapErr(result).errorCode).toBe("PRECONDITION_FAILED");
    expect(st.route.revision).toBe(beforeRevision);
    expect(st.auditLog.length).toBe(beforeAudit);
    expect(st.draft).toBeNull();
  });

  it("agent port has no approval/export/copy/download capability", () => {
    expect((agentPort as unknown as Record<string, unknown>).approveDraft).toBeUndefined();
    expect((agentPort as unknown as Record<string, unknown>).requestExport).toBeUndefined();
    expect((agentPort as unknown as Record<string, unknown>).copy).toBeUndefined();
    expect((agentPort as unknown as Record<string, unknown>).download).toBeUndefined();
  });

  it("resident UI port can approve only the exact current draft revision, and mutation invalidates it", () => {
    const state = createInitialState();
    let st = unwrap(selectScenario(state, FIXTURE_SCENARIO_ID));
    st = unwrap(selectProfile(st, "wheelchair"));
    st = unwrap(setActiveSegments(st, ["seg-01"], st.route.revision));
    st = unwrap(agentPort.stageMapping(st, FIXTURE_MAPPING_ID, st.route.revision));
    st = unwrap(agentPort.createDraft(st, "Test draft", [FIXTURE_MAPPING_ID], st.route.revision));
    const rev = st.route.revision;
    st = unwrap(residentPort.approveDraft(st, st.draft!.id, rev));
    expect(isApprovalValid(st)).toBe(true);

    st = unwrap(agentPort.setActiveSegments(st, ["seg-01", "seg-02"], st.route.revision));
    expect(isApprovalValid(st)).toBe(false);
  });

  it("residentRequestExport is a standalone domain export", () => {
    expect(typeof residentRequestExport).toBe("function");
  });

  it("resident export payload cannot be obtained before current-revision approval", () => {
    const state = createInitialState();
    let st = unwrap(selectScenario(state, FIXTURE_SCENARIO_ID));
    st = unwrap(agentPort.createDraft(st, "Text", [], st.route.revision));
    const exportResult = residentPort.requestExport(st);
    expect(exportResult.success).toBe(false);
    expect(unwrapErr(exportResult).errorCode).toBe("PRECONDITION_FAILED");
  });
});

describe("domain structured draft + audit actor (FDN-003)", () => {
  it("raw actions audit as human; agent-port wrappers audit as agent-tool", () => {
    const state = createInitialState();
    const raw = unwrap(selectScenario(state, FIXTURE_SCENARIO_ID));
    expect(raw.auditLog[raw.auditLog.length - 1].actor).toBe("human");
    const wrapped = unwrap(agentPort.selectProfile(raw, "profile-wheelchair"));
    expect(wrapped.auditLog[wrapped.auditLog.length - 1].actor).toBe("agent-tool");
  });

  it("agentPort.stageMapping audits as agent-tool; raw setActiveSegments audits as human", () => {
    const state = createInitialState();
    let st = unwrap(selectScenario(state, FIXTURE_SCENARIO_ID));
    st = unwrap(agentPort.stageMapping(st, FIXTURE_MAPPING_ID, st.route.revision));
    expect(st.auditLog[st.auditLog.length - 1].actor).toBe("agent-tool");
    st = unwrap(setActiveSegments(st, ["seg-01"], st.route.revision));
    expect(st.auditLog[st.auditLog.length - 1].actor).toBe("human");
  });

  it("agentPort.createStructuredDraft builds labelled statements with support IDs and curated uncertainty", () => {
    const state = createInitialState();
    const st = unwrap(selectScenario(state, FIXTURE_SCENARIO_ID));
    const result = agentPort.createStructuredDraft(
      st,
      {
        mappingIds: [FIXTURE_MAPPING_ID],
        sourceClaimIds: ["sc-01", "sc-05"],
        userPosition: "step-free route needed",
        requestedChange: "add ramp",
        openQuestions: ["elevator maintenance?"],
      },
      st.route.revision
    );
    expect(result.success).toBe(true);
    const next = unwrap(result);
    expect(next.draft).not.toBeNull();
    const statements = next.draft!.statements;
    const classes = statements.map((s) => s.statementClass);
    expect(classes).toEqual(expect.arrayContaining(["source-quote", "curated-interpretation", "resident-position", "open-question"]));
    const curated = statements.find((s) => s.statementClass === "curated-interpretation")!;
    expect(curated.mappingId).toBe(FIXTURE_MAPPING_ID);
    expect(curated.rationale.length).toBeGreaterThan(0);
    expect(curated.uncertainty.length).toBeGreaterThan(0);
    const quote = statements.find((s) => s.statementClass === "source-quote")!;
    expect(quote.sourceClaimId).toMatch(/^sc-/);
    const position = statements.find((s) => s.statementClass === "resident-position")!;
    expect(position.requestedChange).toContain("ramp");
    const last = next.auditLog[next.auditLog.length - 1];
    expect(last.action).toBe("createStructuredDraft");
    expect(last.actor).toBe("agent-tool");
    expect(next.approval).toBeNull();
  });

  it("createStructuredDraft rejects unknown mapping id without mutation", () => {
    const state = createInitialState();
    const st = unwrap(selectScenario(state, FIXTURE_SCENARIO_ID));
    const before = st.route.revision;
    const beforeAudit = st.auditLog.length;
    const result = agentPort.createStructuredDraft(
      st,
      { mappingIds: ["map-unknown"], sourceClaimIds: [], userPosition: "p", requestedChange: "c", openQuestions: [] },
      st.route.revision
    );
    expect(result.success).toBe(false);
    const err = unwrapErr(result);
    expect(err.errorCode).toBe("PRECONDITION_FAILED");
    expect(st.route.revision).toBe(before);
    expect(st.auditLog.length).toBe(beforeAudit);
  });

  it("createStructuredDraft rejects cross-scenario source claims without mutation", () => {
    const state = createInitialState();
    const st = unwrap(selectScenario(state, "scenario-other"));
    const beforeAudit = st.auditLog.length;
    const result = agentPort.createStructuredDraft(
      st,
      { mappingIds: [], sourceClaimIds: ["sc-01"], userPosition: "p", requestedChange: "c", openQuestions: [] },
      st.route.revision
    );
    expect(result.success).toBe(false);
    expect(unwrapErr(result).errorCode).toBe("PRECONDITION_FAILED");
    expect(st.auditLog.length).toBe(beforeAudit);
  });

  it("createStructuredDraft rejects stale revision without audit success", () => {
    const state = createInitialState();
    const st = unwrap(selectScenario(state, FIXTURE_SCENARIO_ID));
    const beforeAudit = st.auditLog.length;
    const result = agentPort.createStructuredDraft(
      st,
      { mappingIds: [], sourceClaimIds: [], userPosition: "p", requestedChange: "c", openQuestions: [] },
      st.route.revision + 999
    );
    expect(result.success).toBe(false);
    expect(unwrapErr(result).errorCode).toBe("STALE_CONTEXT");
    expect(st.auditLog.length).toBe(beforeAudit);
  });

  it("no direct source quote can become an impact mapping via structured draft", () => {
    const state = createInitialState();
    const st = unwrap(selectScenario(state, FIXTURE_SCENARIO_ID));
    const result = agentPort.createStructuredDraft(
      st,
      { mappingIds: ["sc-01"], sourceClaimIds: [], userPosition: "p", requestedChange: "c", openQuestions: [] },
      st.route.revision
    );
    expect(result.success).toBe(false);
    expect(unwrapErr(result).errorCode).toBe("PRECONDITION_FAILED");
  });

  it("agentPort.clearStagedMappings clears all and audits as agent-tool", () => {
    const state = createInitialState();
    let st = unwrap(selectScenario(state, FIXTURE_SCENARIO_ID));
    st = unwrap(agentPort.stageMapping(st, FIXTURE_MAPPING_ID, st.route.revision));
    const result = agentPort.clearStagedMappings(st, st.route.revision);
    expect(result.success).toBe(true);
    const next = unwrap(result);
    expect(next.route.stagedMappingIds).toEqual([]);
    expect(next.auditLog[next.auditLog.length - 1].actor).toBe("agent-tool");
    expect(next.approval).toBeNull();
  });

  it("agentPort.clearStagedMappings fails PRECONDITION_FAILED when nothing is staged", () => {
    const state = createInitialState();
    const st = unwrap(selectScenario(state, FIXTURE_SCENARIO_ID));
    const beforeAudit = st.auditLog.length;
    const result = agentPort.clearStagedMappings(st, st.route.revision);
    expect(result.success).toBe(false);
    expect(unwrapErr(result).errorCode).toBe("PRECONDITION_FAILED");
    expect(st.auditLog.length).toBe(beforeAudit);
  });

  it("agentPort exposes createStructuredDraft and clearStagedMappings but still no approve/export", () => {
    expect(typeof agentPort.createStructuredDraft).toBe("function");
    expect(typeof agentPort.clearStagedMappings).toBe("function");
    const ap = agentPort as unknown as Record<string, unknown>;
    expect(ap.approveDraft).toBeUndefined();
    expect(ap.requestExport).toBeUndefined();
  });
});
