import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import App from "@/App.tsx";
import LocalRouteMap from "@/ui/LocalRouteMap.tsx";
import type { ScenarioImpactMapping } from "@/contracts/types.ts";
import scenarios from "../../data/demo_scenarios.json";
import mappings from "../../data/scenario_impact_mappings.json";

const scenario = scenarios[0];
const scenarioMappings = (
  mappings as ScenarioImpactMapping[]
).filter((m) => m.scenarioId === scenario.id);

describe("FDN-006 OSM attribution — visible notice", () => {
  it("LocalRouteMap shows exact © OpenStreetMap contributors text with official copyright link", () => {
    render(
      <LocalRouteMap
        defaultSegmentIds={scenario.defaultSegmentIds}
        stagedMappingIds={[]}
        mappings={scenarioMappings}
      />,
    );

    const attribution = screen.getByText(/© OpenStreetMap contributors/i);
    expect(attribution).toBeVisible();

    const link = screen.getByRole("link", { name: /OpenStreetMap contributors/i });
    expect(link).toHaveAttribute("href", "https://www.openstreetmap.org/copyright");
  });

  it("LocalRouteMap includes illustrative-fixture scope disclaimer near attribution", () => {
    render(
      <LocalRouteMap
        defaultSegmentIds={scenario.defaultSegmentIds}
        stagedMappingIds={[]}
        mappings={scenarioMappings}
      />,
    );

    const scope = screen.getByText(/illustrative local fixture context/i);
    expect(scope).toBeVisible();
    expect(scope.textContent).toMatch(/not navigation/i);
    expect(scope.textContent).toMatch(/certified accessibility data/i);
  });
});

describe("FDN-006 OSM attribution — export payload helper", () => {
  it("buildExportPayload returns exact attribution object with OSM text and license URL", async () => {
    const { buildExportPayload } = await import("@/ui/export-payload.ts");
    const { createGroundedRouteController } = await import("@/domain/actions.ts");
    const { humanPort, residentPort } = createGroundedRouteController();

    let state = humanPort.createInitialState();
    state = (humanPort.selectScenario(state, scenario.id) as { success: true; data: typeof state }).data;
    state = (humanPort.selectProfile(state, "profile-wheelchair") as { success: true; data: typeof state }).data;
    state = (humanPort.stageMapping(state, "map-01", state.route.revision) as { success: true; data: typeof state }).data;
    state = (humanPort.createDraft(state, "Test", ["map-01"], state.route.revision) as { success: true; data: typeof state }).data;
    state = (residentPort.approveDraft(state, state.draft!.id, state.route.revision) as { success: true; data: typeof state }).data;

    const payload = buildExportPayload(state);
    expect(payload.attribution).toBeDefined();
    expect(payload.attribution.osm).toBe("© OpenStreetMap contributors");
    expect(payload.attribution.licenseUrl).toBe("https://www.openstreetmap.org/copyright");
    expect(payload.attribution.scope).toMatch(/illustrative local fixture context/i);
    expect(payload.draft).toBeDefined();
    expect(payload.approvedAt).toBeDefined();
  });

  it("buildExportPayload is a pure function with no side effects", async () => {
    const { buildExportPayload } = await import("@/ui/export-payload.ts");
    const { createGroundedRouteController } = await import("@/domain/actions.ts");
    const { humanPort, residentPort } = createGroundedRouteController();

    let state = humanPort.createInitialState();
    state = (humanPort.selectScenario(state, scenario.id) as { success: true; data: typeof state }).data;
    state = (humanPort.selectProfile(state, "profile-wheelchair") as { success: true; data: typeof state }).data;
    state = (humanPort.stageMapping(state, "map-01", state.route.revision) as { success: true; data: typeof state }).data;
    state = (humanPort.createDraft(state, "Test", ["map-01"], state.route.revision) as { success: true; data: typeof state }).data;
    state = (residentPort.approveDraft(state, state.draft!.id, state.route.revision) as { success: true; data: typeof state }).data;

    const before = JSON.stringify(state);
    buildExportPayload(state);
    const after = JSON.stringify(state);
    expect(after).toBe(before);
  });
});

describe("FDN-006 OSM attribution — export through UI", () => {
  beforeEach(() => {
    // @ts-expect-error removing experimental API
    delete document.modelContext;
    URL.createObjectURL = vi.fn(() => "blob:mocked-url");
    URL.revokeObjectURL = vi.fn();
  });

  it("approved export payload includes exact OSM attribution object", async () => {
    const user = userEvent.setup();

    const blobSpy = vi.fn();
    const OriginalBlob = globalThis.Blob;
    Object.defineProperty(globalThis, "Blob", {
      value: function (parts: unknown, options?: BlobPropertyBag) {
        blobSpy(parts, options);
        return new OriginalBlob(parts as BlobPart[], options);
      },
      configurable: true,
      writable: true,
    });

    render(<App />);
    await user.click(screen.getByRole("button", { name: /Load illustrative demo/i }));
    await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));

    const segmentList = await screen.findByRole("list", { name: /Route segments/i });
    const firstSegment = within(segmentList).getAllByRole("listitem")[0];
    await user.click(within(firstSegment).getByRole("button", { name: /Stage/i }));

    await user.click(screen.getByRole("button", { name: /Open draft/i }));
    const draftPanel = await screen.findByRole("form", { name: /Draft review/i });
    await user.type(within(draftPanel).getByLabelText(/Your position/i), "Concerned resident");
    await user.type(within(draftPanel).getByLabelText(/Requested change/i), "Install tactile paving");
    await user.click(within(draftPanel).getByRole("button", { name: /Create draft/i }));

    await user.click(screen.getByRole("button", { name: /Approve current draft/i }));

    const exportBtn = screen.getByRole("button", { name: /Export/i });
    await user.click(exportBtn);

    expect(blobSpy).toHaveBeenCalled();
    const blobParts = blobSpy.mock.calls[0][0] as string[];
    const payload = JSON.parse(blobParts[0]);

    expect(payload.attribution).toBeDefined();
    expect(payload.attribution.osm).toBe("© OpenStreetMap contributors");
    expect(payload.attribution.licenseUrl).toBe("https://www.openstreetmap.org/copyright");
    expect(payload.attribution.scope).toMatch(/illustrative local fixture context/i);

    Object.defineProperty(globalThis, "Blob", { value: OriginalBlob, configurable: true, writable: true });
  });
});

describe("FDN-006 OSM attribution — no automatic external requests", () => {
  beforeEach(() => {
    // @ts-expect-error removing experimental API
    delete document.modelContext;
  });

  it("renders without fetch or XMLHttpRequest during mount and attribution display", () => {
    const fetchSpy = vi.spyOn(window, "fetch").mockImplementation(() => Promise.resolve(new Response()));
    const xhrSpy = vi.spyOn(XMLHttpRequest.prototype, "open").mockImplementation(() => {});

    render(<App />);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
    xhrSpy.mockRestore();
  });

  it("LocalRouteMap renders without fetch or XMLHttpRequest", () => {
    const fetchSpy = vi.spyOn(window, "fetch").mockImplementation(() => Promise.resolve(new Response()));
    const xhrSpy = vi.spyOn(XMLHttpRequest.prototype, "open").mockImplementation(() => {});

    render(
      <LocalRouteMap
        defaultSegmentIds={scenario.defaultSegmentIds}
        stagedMappingIds={[]}
        mappings={scenarioMappings}
      />,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
    xhrSpy.mockRestore();
  });
});

describe("FDN-006 OSM attribution — WebMCP boundary", () => {
  it("WebMCP tool inventory remains exactly six with no export/attribution agent capability", async () => {
    const { registerWebMcpTools, WEBMCP_TOOL_NAMES } = await import("@/webmcp/index.ts");
    const { createMemoryBridge } = await import("@/webmcp/workspace-bridge.ts");
    const { agentPort } = (await import("@/domain/actions.ts")).createGroundedRouteController();

    const tools: Array<{ name: string }> = [];
    const modelContext = {
      async registerTool(tool: { name: string }) {
        tools.push(tool);
        return { registeredTool: tool };
      },
    };

    const bridge = createMemoryBridge(agentPort.createInitialState());
    await registerWebMcpTools(
      { modelContext } as unknown as import("@/webmcp/index.ts").DocumentLike,
      bridge,
    );

    expect(tools).toHaveLength(6);
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([...WEBMCP_TOOL_NAMES].sort());

    const forbidden = ["export", "attribution", "copy", "download", "approve"];
    for (const name of names) {
      for (const bad of forbidden) {
        expect(name.toLowerCase()).not.toContain(bad.toLowerCase());
      }
    }
  });
});
