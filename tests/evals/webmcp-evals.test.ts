import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  registerWebMcpTools,
  WEBMCP_TOOL_NAMES,
  type RegisteredTool,
  type DocumentLike,
} from "@/webmcp/index.ts";
import { createMemoryBridge, type MemoryBridge } from "@/webmcp/workspace-bridge.ts";
import { createGroundedRouteController, selectScenario } from "@/domain/actions.ts";

const { agentPort, residentPort } = createGroundedRouteController();
const FIXTURE_SCENARIO_ID = "saloma-link-active-mobility-demo";
const FIXTURE_MAPPING_ID = "map-01";

interface EvalSpec {
  id: string;
  name: string;
  required: string[];
  forbidden: string[];
}

const evalsFile = JSON.parse(
  readFileSync(resolve(__dirname, "webmcp-evals.json"), "utf-8")
) as { suite: string; evalCount: number; evals: EvalSpec[] };

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
  };
  return { document: { modelContext } as DocumentLike, tools };
}

function seededBridge(): MemoryBridge {
  const initial = agentPort.createInitialState();
  const seeded = selectScenario(initial, FIXTURE_SCENARIO_ID);
  if (!seeded.success) throw new Error("seed failed");
  return createMemoryBridge(seeded.data);
}

async function run(tool: RegisteredTool, input: Record<string, unknown>): Promise<Record<string, unknown>> {
  return parse(await tool.execute(input, { signal: new AbortController().signal }));
}

function byName(tools: RegisteredTool[], name: string): RegisteredTool {
  const t = tools.find((x) => x.name === name);
  if (!t) throw new Error(`missing tool ${name}`);
  return t;
}

describe("webmcp eval fixture", () => {
  it("contains exactly EV-01 through EV-08 with required/forbidden behavior", () => {
    expect(evalsFile.suite).toBe("fdn-003-webmcp-rescue");
    expect(evalsFile.evalCount).toBe(8);
    expect(evalsFile.evals).toHaveLength(8);
    const ids = evalsFile.evals.map((e) => e.id);
    expect(ids).toEqual(["EV-01", "EV-02", "EV-03", "EV-04", "EV-05", "EV-06", "EV-07", "EV-08"]);
    for (const e of evalsFile.evals) {
      expect(e.required.length).toBeGreaterThan(0);
      expect(e.forbidden.length).toBeGreaterThan(0);
      expect(e.name.length).toBeGreaterThan(0);
    }
  });
});

const checks: Record<string, () => Promise<void> | void> = {
  "EV-01": () => {
    const bridge = seededBridge();
    const before = bridge.getState().route.revision;
    const results = registerWebMcpTools({} as DocumentLike, bridge);
    return results.then((r) => {
      expect(r).toHaveLength(6);
      for (const x of r) expect((x as { unavailable: boolean }).unavailable).toBe(true);
      expect(bridge.replaceStateCalls).toBe(0);
      expect(bridge.getState().route.revision).toBe(before);
    });
  },
  "EV-02": async () => {
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, createMemoryBridge(agentPort.createInitialState()));
    expect(tools).toHaveLength(6);
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([...WEBMCP_TOOL_NAMES].sort());
    for (const name of names) {
      expect(name).not.toMatch(/approve|export|publish|copy|download|chat|run/i);
    }
  },
  "EV-03": async () => {
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, createMemoryBridge(agentPort.createInitialState()));
    for (const t of tools) {
      expect(t.inputSchema.type).toBe("object");
      expect(Array.isArray(t.inputSchema.required)).toBe(true);
      expect("exposedTo" in t).toBe(false);
    }
    expect(byName(tools, "get_route_context").annotations.readOnlyHint).toBe(true);
    expect(byName(tools, "find_plan_evidence").annotations.untrustedContentHint).toBe(true);
    expect(byName(tools, "stage_impact_overlay").annotations.readOnlyHint).toBeUndefined();
  },
  "EV-04": async () => {
    const bridge = seededBridge();
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const rev = bridge.getState().route.revision;
    const out = await run(byName(tools, "stage_impact_overlay"), { mappingId: FIXTURE_MAPPING_ID, expectedRevision: rev });
    expect(out.success).toBe(true);
    expect(bridge.replaceStateCalls).toBe(1);
    const last = bridge.getState().auditLog[bridge.getState().auditLog.length - 1];
    expect(last.actor).toBe("agent-tool");
    expect(bridge.getState().route.revision).toBe(rev + 1);
  },
  "EV-05": async () => {
    const bridge = seededBridge();
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const stage = byName(tools, "stage_impact_overlay");
    const rev = bridge.getState().route.revision;
    const unknown = await run(stage, { mappingId: "map-x", expectedRevision: rev });
    expect(unknown.success).toBe(false);
    expect(unknown.errorCode).toBe("INVALID_INPUT");
    const stale = await run(stage, { mappingId: FIXTURE_MAPPING_ID, expectedRevision: rev + 999 });
    expect(stale.errorCode).toBe("STALE_CONTEXT");
    const dupRev = bridge.getState().route.revision;
    await run(stage, { mappingId: FIXTURE_MAPPING_ID, expectedRevision: dupRev });
    const dup = await run(stage, { mappingId: FIXTURE_MAPPING_ID, expectedRevision: bridge.getState().route.revision });
    expect(dup.errorCode).toBe("PRECONDITION_FAILED");
    expect(bridge.replaceStateCalls).toBe(1);
    expect(bridge.getState().route.revision).toBe(dupRev + 1);
  },
  "EV-06": async () => {
    const bridge = seededBridge();
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const out = await run(byName(tools, "draft_public_comment"), {
      mappingIds: [FIXTURE_MAPPING_ID],
      sourceClaimIds: ["sc-01", "sc-05"],
      userPosition: "step-free route needed",
      requestedChange: "add ramp",
      openQuestions: ["elevator maintenance?"],
      expectedRevision: bridge.getState().route.revision,
    });
    expect(out.success).toBe(true);
    const state = bridge.getState();
    const classes = state.draft!.statements.map((s) => s.statementClass);
    expect(classes).toContain("source-reference");
    expect(classes).toContain("curated-interpretation");
    expect(classes).toContain("resident-position");
    expect(classes).toContain("open-question");
    const curated = state.draft!.statements.find((s) => s.statementClass === "curated-interpretation")!;
    expect(curated.rationale.length).toBeGreaterThan(0);
    expect(curated.uncertainty.length).toBeGreaterThan(0);
    expect(state.draft!.text).not.toContain("<");
    expect(state.auditLog[state.auditLog.length - 1].actor).toBe("agent-tool");
  },
  "EV-07": () => {
    const initial = agentPort.createInitialState();
    const human = selectScenario(initial, FIXTURE_SCENARIO_ID);
    if (!human.success) throw new Error("seed failed");
    expect(human.data.auditLog[0].actor).toBe("human");
    const ap = agentPort as unknown as Record<string, unknown>;
    expect(ap.approveDraft).toBeUndefined();
    expect(ap.requestExport).toBeUndefined();
    expect(typeof residentPort.approveDraft).toBe("function");
  },
  "EV-08": async () => {
    const bridge = seededBridge();
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const stage = byName(tools, "stage_impact_overlay");
    const clear = byName(tools, "clear_staged_overlay");
    let rev = bridge.getState().route.revision;
    await run(stage, { mappingId: "map-01", expectedRevision: rev });
    rev = bridge.getState().route.revision;
    await run(stage, { mappingId: "map-02", expectedRevision: rev });
    const callsBefore = bridge.replaceStateCalls;
    const out = await run(clear, { expectedRevision: bridge.getState().route.revision });
    expect(out.success).toBe(true);
    expect(bridge.replaceStateCalls).toBe(callsBefore + 1);
    expect(bridge.getState().route.stagedMappingIds).toEqual([]);
    expect(bridge.getState().auditLog[bridge.getState().auditLog.length - 1].actor).toBe("agent-tool");
  },
};

describe("webmcp eval behavior", () => {
  for (const e of evalsFile.evals) {
    it(`${e.id}: ${e.name}`, async () => {
      const fn = checks[e.id];
      if (!fn) throw new Error(`no check implemented for ${e.id}`);
      await fn();
    });
  }
});
