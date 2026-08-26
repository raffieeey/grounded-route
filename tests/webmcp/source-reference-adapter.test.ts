/**
 * FDN-007 RED tests: WebMCP adapter source-reference semantics.
 * These MUST fail until find_plan_evidence returns reference metadata (not quotes).
 */
import { describe, it, expect } from "vitest";
import {
  registerWebMcpTools,
  WEBMCP_TOOL_NAMES,
  type RegisteredTool,
  type DocumentLike,
} from "@/webmcp/index.ts";
import { createMemoryBridge } from "@/webmcp/workspace-bridge.ts";
import { createGroundedRouteController, selectScenario } from "@/domain/actions.ts";

const { agentPort } = createGroundedRouteController();
const FIXTURE_SCENARIO_ID = "saloma-link-active-mobility-demo";

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

function seededBridge() {
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

describe("FDN-007 WebMCP source-reference adapter (RED phase)", () => {
  it("find_plan_evidence returns reference metadata, not quote fields", async () => {
    const bridge = seededBridge();
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const ev = byName(tools, "find_plan_evidence");
    const out = await run(ev, { sourceClaimIds: ["sc-01"] });
    expect(out.success).toBe(true);
    const evidence = (out.data as Record<string, unknown>).evidence as Array<Record<string, unknown>>;
    expect(evidence).toHaveLength(1);
    const claim = evidence[0];
    // Must have reference metadata
    expect(claim).toHaveProperty("document");
    expect(claim).toHaveProperty("page");
    expect(claim).toHaveProperty("documentUrl");
    expect(claim).toHaveProperty("retrievedDate");
    expect(claim).toHaveProperty("boundaryNote");
    // Must NOT have quote fields
    expect(claim).not.toHaveProperty("quoteMs");
    expect(claim).not.toHaveProperty("quoteEn");
  });

  it("find_plan_evidence reference data does not contain misleading attribution", async () => {
    const bridge = seededBridge();
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, bridge);
    const ev = byName(tools, "find_plan_evidence");
    const out = await run(ev, { sourceClaimIds: ["sc-01", "sc-02"] });
    expect(out.success).toBe(true);
    const evidence = (out.data as Record<string, unknown>).evidence as Array<Record<string, unknown>>;
    for (const claim of evidence) {
      const text = `${claim.boundaryNote ?? ""} ${claim.notes ?? ""}`.toLowerCase();
      expect(text).not.toContain("our research found");
      expect(text).not.toContain("independent research");
    }
  });

  it("tool inventory remains exactly six with no authority boundary regression", async () => {
    const { document, tools } = makeFakeDocument();
    await registerWebMcpTools(document, createMemoryBridge(agentPort.createInitialState()));
    expect(tools).toHaveLength(6);
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([...WEBMCP_TOOL_NAMES].sort());
  });
});
