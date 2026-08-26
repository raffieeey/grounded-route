import { describe, it, expect } from "vitest";
import {
  registerWebMcpTools,
  WEBMCP_TOOL_NAMES,
  type RegisteredTool,
  type RegistrationResult,
  type DocumentLike,
} from "@/webmcp/index.ts";
import { createMemoryBridge, type MemoryBridge } from "@/webmcp/workspace-bridge.ts";
import { createGroundedRouteController, selectScenario } from "@/domain/actions.ts";

const { agentPort, residentPort } = createGroundedRouteController();
const FIXTURE_SCENARIO_ID = "saloma-link-active-mobility-demo";
const FIXTURE_MAPPING_ID = "map-01";
const FIXTURE_MAPPING_ID_2 = "map-02";
const FIXTURE_SOURCE_CLAIM_ID = "sc-01";

function parse(out: string): Record<string, unknown> {
  return JSON.parse(out) as Record<string, unknown>;
}

function makeFakeDocument(): { document: DocumentLike; tools: RegisteredTool[] } {
  const tools: RegisteredTool[] = [];
  const modelContext = {
    registerTool: async (tool: RegisteredTool) => {
      tools.push(tool);
      return { registeredTool: tool };
    },
    executeTool: async (tool: RegisteredTool, args: Record<string, unknown>) =>
      tool.execute(args, { signal: new AbortController().signal }),
  };
  return { document: { modelContext } as DocumentLike, tools };
}

function seededBridge(): MemoryBridge {
  const initial = agentPort.createInitialState();
  const seeded = selectScenario(initial, FIXTURE_SCENARIO_ID);
  if (!seeded.success) throw new Error("seed failed");
  return createMemoryBridge(seeded.data);
}

function toolByName(tools: RegisteredTool[], name: string): RegisteredTool {
  const t = tools.find((x) => x.name === name);
  if (!t) throw new Error(`tool not registered: ${name}`);
  return t;
}

async function run(tool: RegisteredTool, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  return parse(await tool.execute(input, { signal: new AbortController().signal }));
}

describe("WebMCP adapter — absent API", () => {
  it("returns structured unavailable results and never throws or mutates", async () => {
    const bridge = seededBridge();
    const before = bridge.getState().route.revision;
    const results = await registerWebMcpTools({} as DocumentLike, bridge);
    expect(results).toHaveLength(6);
    for (const r of results) {
      expect((r as RegistrationResult).unavailable).toBe(true);
    }
    expect(bridge.replaceStateCalls).toBe(0);
    expect(bridge.getState().route.revision).toBe(before);
  });
});

describe("WebMCP adapter — tool inventory", () => {
  it("registers exactly the six required tools and no human-authority/publication tool", async () => {
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, createMemoryBridge(agentPort.createInitialState()));
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([...WEBMCP_TOOL_NAMES].sort());
    const forbidden = ["approve", "export", "publish", "copy", "download", "chat", "run", "selectScenario"];
    for (const name of names) {
      for (const bad of forbidden) {
        expect(name.toLowerCase()).not.toContain(bad.toLowerCase());
      }
    }
  });

  it("exposes no approve/export capability via the agent port used by the adapter", () => {
    const ap = agentPort as unknown as Record<string, unknown>;
    expect(ap.approveDraft).toBeUndefined();
    expect(ap.requestExport).toBeUndefined();
    expect(ap.copy).toBeUndefined();
    expect(ap.download).toBeUndefined();
    expect(ap.publish).toBeUndefined();
  });

  it("schemas are object schemas with required arrays and annotations; no exposedTo", async () => {
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, createMemoryBridge(agentPort.createInitialState()));
    for (const t of tools) {
      expect(t.inputSchema.type).toBe("object");
      expect(Array.isArray(t.inputSchema.required)).toBe(true);
      expect("exposedTo" in t).toBe(false);
    }
    const ro = toolByName(tools, "get_route_context");
    expect(ro.annotations.readOnlyHint).toBe(true);
    const ev = toolByName(tools, "find_plan_evidence");
    expect(ev.annotations.readOnlyHint).toBe(true);
    expect(ev.annotations.untrustedContentHint).toBe(true);
    const status = toolByName(tools, "get_review_status");
    expect(status.annotations.readOnlyHint).toBe(true);
    const stage = toolByName(tools, "stage_impact_overlay");
    expect(stage.annotations.readOnlyHint).toBeUndefined();
    const clear = toolByName(tools, "clear_staged_overlay");
    expect(clear.annotations.readOnlyHint).toBeUndefined();
    const draft = toolByName(tools, "draft_public_comment");
    expect(draft.annotations.readOnlyHint).toBeUndefined();
  });
});

describe("WebMCP adapter — stage / clear / draft mutations", () => {
  it("valid stage produces exactly one bridge replacement and an agent-tool audit", async () => {
    const bridge = seededBridge();
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const stage = toolByName(tools, "stage_impact_overlay");
    const rev = bridge.getState().route.revision;
    const out = await run(stage, { mappingId: FIXTURE_MAPPING_ID, expectedRevision: rev });
    expect(out.success).toBe(true);
    expect(bridge.replaceStateCalls).toBe(1);
    const state = bridge.getState();
    expect(state.route.stagedMappingIds).toEqual([FIXTURE_MAPPING_ID]);
    const last = state.auditLog[state.auditLog.length - 1];
    expect(last.action).toBe("stageMapping");
    expect(last.actor).toBe("agent-tool");
    expect(last.revisionAfter).toBe(rev + 1);
  });

  it("unknown mapping id returns INVALID_INPUT with no bridge replacement", async () => {
    const bridge = seededBridge();
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const stage = toolByName(tools, "stage_impact_overlay");
    const rev = bridge.getState().route.revision;
    const out = await run(stage, { mappingId: "map-unknown", expectedRevision: rev });
    expect(out.success).toBe(false);
    expect(out.errorCode).toBe("INVALID_INPUT");
    expect(bridge.replaceStateCalls).toBe(0);
    expect(bridge.getState().route.revision).toBe(rev);
  });

  it("source-claim id used as mapping id returns INVALID_INPUT (no direct source quote becomes a mapping)", async () => {
    const bridge = seededBridge();
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const stage = toolByName(tools, "stage_impact_overlay");
    const rev = bridge.getState().route.revision;
    const out = await run(stage, { mappingId: FIXTURE_SOURCE_CLAIM_ID, expectedRevision: rev });
    expect(out.success).toBe(false);
    expect(out.errorCode).toBe("INVALID_INPUT");
    expect(bridge.replaceStateCalls).toBe(0);
  });

  it("stale expected revision returns STALE_CONTEXT with no bridge replacement or audit success", async () => {
    const bridge = seededBridge();
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const stage = toolByName(tools, "stage_impact_overlay");
    const rev = bridge.getState().route.revision;
    const beforeAudit = bridge.getState().auditLog.length;
    const out = await run(stage, { mappingId: FIXTURE_MAPPING_ID, expectedRevision: rev + 999 });
    expect(out.success).toBe(false);
    expect(out.errorCode).toBe("STALE_CONTEXT");
    expect(bridge.replaceStateCalls).toBe(0);
    expect(bridge.getState().route.revision).toBe(rev);
    expect(bridge.getState().auditLog.length).toBe(beforeAudit);
  });

  it("duplicate stage returns PRECONDITION_FAILED with no bridge replacement", async () => {
    const bridge = seededBridge();
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const stage = toolByName(tools, "stage_impact_overlay");
    const rev = bridge.getState().route.revision;
    await run(stage, { mappingId: FIXTURE_MAPPING_ID, expectedRevision: rev });
    const rev2 = bridge.getState().route.revision;
    const out = await run(stage, { mappingId: FIXTURE_MAPPING_ID, expectedRevision: rev2 });
    expect(out.success).toBe(false);
    expect(out.errorCode).toBe("PRECONDITION_FAILED");
    expect(bridge.replaceStateCalls).toBe(1);
  });

  it("cross-scenario context rejects staging a fixture mapping via STALE/PRECONDITION without mutation", async () => {
    const initial = agentPort.createInitialState();
    const other = agentPort.selectScenario(initial, "scenario-other");
    if (!other.success) throw new Error("seed failed");
    const bridge = createMemoryBridge(other.data);
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const stage = toolByName(tools, "stage_impact_overlay");
    const rev = bridge.getState().route.revision;
    const beforeAudit = bridge.getState().auditLog.length;
    const out = await run(stage, { mappingId: FIXTURE_MAPPING_ID, expectedRevision: rev });
    expect(out.success).toBe(false);
    expect(out.errorCode).toBe("PRECONDITION_FAILED");
    expect(bridge.replaceStateCalls).toBe(0);
    expect(bridge.getState().auditLog.length).toBe(beforeAudit);
  });

  it("clear_staged_overlay produces one bridge replacement and agent-tool audit", async () => {
    const bridge = seededBridge();
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const stage = toolByName(tools, "stage_impact_overlay");
    const clear = toolByName(tools, "clear_staged_overlay");
    let rev = bridge.getState().route.revision;
    await run(stage, { mappingId: FIXTURE_MAPPING_ID, expectedRevision: rev });
    await run(stage, { mappingId: FIXTURE_MAPPING_ID_2, expectedRevision: bridge.getState().route.revision });
    expect(bridge.getState().route.stagedMappingIds).toEqual([FIXTURE_MAPPING_ID, FIXTURE_MAPPING_ID_2]);
    rev = bridge.getState().route.revision;
    const callsBefore = bridge.replaceStateCalls;
    const out = await run(clear, { expectedRevision: rev });
    expect(out.success).toBe(true);
    expect(bridge.replaceStateCalls).toBe(callsBefore + 1);
    expect(bridge.getState().route.stagedMappingIds).toEqual([]);
    const last = bridge.getState().auditLog[bridge.getState().auditLog.length - 1];
    expect(last.actor).toBe("agent-tool");
  });

  it("clear_staged_overlay with nothing staged fails PRECONDITION_FAILED with no replacement", async () => {
    const bridge = seededBridge();
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const clear = toolByName(tools, "clear_staged_overlay");
    const rev = bridge.getState().route.revision;
    const out = await run(clear, { expectedRevision: rev });
    expect(out.success).toBe(false);
    expect(out.errorCode).toBe("PRECONDITION_FAILED");
    expect(bridge.replaceStateCalls).toBe(0);
  });

  it("draft_public_comment writes structured labelled statements and one agent-tool audit", async () => {
    const bridge = seededBridge();
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const draft = toolByName(tools, "draft_public_comment");
    const rev = bridge.getState().route.revision;
    const out = await run(draft, {
      mappingIds: [FIXTURE_MAPPING_ID],
      sourceClaimIds: ["sc-01", "sc-05"],
      userPosition: "I need a step-free route to the school.",
      requestedChange: "Add a ramp at the Saloma Link south entrance.",
      openQuestions: ["Is the elevator maintained weekly?"],
      expectedRevision: rev,
    });
    expect(out.success).toBe(true);
    expect(bridge.replaceStateCalls).toBe(1);
    const state = bridge.getState();
    expect(state.draft).not.toBeNull();
    const statements = state.draft!.statements;
    const classes = statements.map((s) => s.statementClass);
    expect(classes).toContain("source-reference");
    expect(classes).toContain("curated-interpretation");
    expect(classes).toContain("resident-position");
    expect(classes).toContain("open-question");
    const curated = statements.find((s) => s.statementClass === "curated-interpretation");
    expect(curated).toBeTruthy();
    expect(curated!.mappingId).toBe(FIXTURE_MAPPING_ID);
    expect(curated!.rationale.length).toBeGreaterThan(0);
    expect(curated!.uncertainty.length).toBeGreaterThan(0);
    const sourceRef = statements.find((s) => s.statementClass === "source-reference");
    expect(sourceRef).toBeTruthy();
    expect(["sc-01", "sc-05"]).toContain(sourceRef!.sourceClaimId);
    const position = statements.find((s) => s.statementClass === "resident-position");
    expect(position).toBeTruthy();
    expect(position!.text).toContain("step-free");
    expect(position!.requestedChange).toContain("ramp");
    const q = statements.find((s) => s.statementClass === "open-question");
    expect(q).toBeTruthy();
    expect(q!.text).toContain("elevator");
    const last = state.auditLog[state.auditLog.length - 1];
    expect(last.action).toBe("createStructuredDraft");
    expect(last.actor).toBe("agent-tool");
    expect(state.draft!.text).not.toContain("<");
  });

  it("draft_public_comment rejects unknown source claim id with INVALID_INPUT and no replacement", async () => {
    const bridge = seededBridge();
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const draft = toolByName(tools, "draft_public_comment");
    const rev = bridge.getState().route.revision;
    const out = await run(draft, {
      mappingIds: [FIXTURE_MAPPING_ID],
      sourceClaimIds: ["sc-unknown"],
      userPosition: "p",
      requestedChange: "c",
      openQuestions: [],
      expectedRevision: rev,
    });
    expect(out.success).toBe(false);
    expect(out.errorCode).toBe("INVALID_INPUT");
    expect(bridge.replaceStateCalls).toBe(0);
  });

  it("draft_public_comment rejects stale revision without audit success", async () => {
    const bridge = seededBridge();
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const draft = toolByName(tools, "draft_public_comment");
    const rev = bridge.getState().route.revision;
    const out = await run(draft, {
      mappingIds: [FIXTURE_MAPPING_ID],
      sourceClaimIds: ["sc-01"],
      userPosition: "p",
      requestedChange: "c",
      openQuestions: [],
      expectedRevision: rev + 999,
    });
    expect(out.success).toBe(false);
    expect(out.errorCode).toBe("STALE_CONTEXT");
    expect(bridge.replaceStateCalls).toBe(0);
  });

  it("draft_public_comment rejects missing userPosition with INVALID_INPUT", async () => {
    const bridge = seededBridge();
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const draft = toolByName(tools, "draft_public_comment");
    const rev = bridge.getState().route.revision;
    const out = await run(draft, {
      mappingIds: [FIXTURE_MAPPING_ID],
      sourceClaimIds: ["sc-01"],
      userPosition: "",
      requestedChange: "c",
      openQuestions: [],
      expectedRevision: rev,
    });
    expect(out.success).toBe(false);
    expect(out.errorCode).toBe("INVALID_INPUT");
    expect(bridge.replaceStateCalls).toBe(0);
  });
});

describe("WebMCP adapter — read tools", () => {
  it("get_route_context returns current route context without mutation", async () => {
    const bridge = seededBridge();
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const ctx = toolByName(tools, "get_route_context");
    const out = await run(ctx, {});
    expect(out.success).toBe(true);
    const data = out.data as Record<string, unknown>;
    expect(data.scenarioId).toBe(FIXTURE_SCENARIO_ID);
    expect(data.stagedMappingIds).toEqual([]);
    expect(bridge.replaceStateCalls).toBe(0);
  });

  it("find_plan_evidence returns labelled evidence for known source claims", async () => {
    const bridge = seededBridge();
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const ev = toolByName(tools, "find_plan_evidence");
    const out = await run(ev, { sourceClaimIds: ["sc-01", "sc-05"] });
    expect(out.success).toBe(true);
    const data = out.data as Record<string, unknown>;
    const claims = data.evidence as Array<Record<string, unknown>>;
    expect(claims).toHaveLength(2);
    expect(claims[0].id).toBe("sc-01");
    expect(typeof claims[0].document).toBe("string");
    expect(typeof claims[0].boundaryNote).toBe("string");
    expect(bridge.replaceStateCalls).toBe(0);
  });

  it("find_plan_evidence rejects unknown source claim id with INVALID_INPUT", async () => {
    const bridge = seededBridge();
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const ev = toolByName(tools, "find_plan_evidence");
    const out = await run(ev, { sourceClaimIds: ["sc-missing"] });
    expect(out.success).toBe(false);
    expect(out.errorCode).toBe("INVALID_INPUT");
  });

  it("get_review_status reports audit actor counts and approval validity", async () => {
    const bridge = seededBridge();
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const stage = toolByName(tools, "stage_impact_overlay");
    await run(stage, { mappingId: FIXTURE_MAPPING_ID, expectedRevision: bridge.getState().route.revision });
    const status = toolByName(tools, "get_review_status");
    const out = await run(status, {});
    expect(out.success).toBe(true);
    const data = out.data as Record<string, unknown>;
    const audit = data.audit as Record<string, number>;
    expect(audit.human).toBeGreaterThanOrEqual(1);
    expect(audit.agentTool).toBeGreaterThanOrEqual(1);
    expect(data.approvalValid).toBe(false);
  });
});

describe("WebMCP adapter — authority boundary", () => {
  it("human raw actions audit as human; agent-tool mutations audit as agent-tool", async () => {
    const initial = agentPort.createInitialState();
    const humanSeeded = selectScenario(initial, FIXTURE_SCENARIO_ID);
    if (!humanSeeded.success) throw new Error("seed failed");
    expect(humanSeeded.data.auditLog[0].actor).toBe("human");

    const bridge = createMemoryBridge(humanSeeded.data);
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const stage = toolByName(tools, "stage_impact_overlay");
    await run(stage, { mappingId: FIXTURE_MAPPING_ID, expectedRevision: bridge.getState().route.revision });
    const last = bridge.getState().auditLog[bridge.getState().auditLog.length - 1];
    expect(last.actor).toBe("agent-tool");
  });

  it("agent port cannot approve or export; only the resident port can", () => {
    const ap = agentPort as unknown as Record<string, unknown>;
    expect(ap.approveDraft).toBeUndefined();
    expect(ap.requestExport).toBeUndefined();
    expect(typeof residentPort.approveDraft).toBe("function");
    expect(typeof residentPort.requestExport).toBe("function");
  });

  it("a mutation through the adapter invalidates a prior resident approval", async () => {
    const initial = agentPort.createInitialState();
    const seeded = agentPort.selectScenario(initial, FIXTURE_SCENARIO_ID);
    if (!seeded.success) throw new Error("seed failed");
    let st = seeded.data;
    const staged = agentPort.stageMapping(st, FIXTURE_MAPPING_ID, st.route.revision);
    if (!staged.success) throw new Error("stage failed");
    st = staged.data;
    const drafted = agentPort.createDraft(st, "x", [FIXTURE_MAPPING_ID], st.route.revision);
    if (!drafted.success) throw new Error("draft failed");
    st = drafted.data;
    const approved = residentPort.approveDraft(st, st.draft!.id, st.route.revision);
    if (!approved.success) throw new Error("approve failed");
    const bridge = createMemoryBridge(approved.data);
    expect(agentPort.isApprovalValid(bridge.getState())).toBe(true);

    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const stage = toolByName(tools, "stage_impact_overlay");
    const out = await run(stage, { mappingId: "map-02", expectedRevision: bridge.getState().route.revision });
    expect(out.success).toBe(true);
    expect(agentPort.isApprovalValid(bridge.getState())).toBe(false);
  });
});
