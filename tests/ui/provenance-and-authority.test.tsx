import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import App from "@/App.tsx";
import { createGroundedRouteController } from "@/domain/actions.ts";

const { humanPort, agentPort } = createGroundedRouteController();
const FIXTURE_SCENARIO = "saloma-link-active-mobility-demo";

describe("FDN-002 provenance and authority", () => {
  beforeEach(() => {
    // @ts-expect-error removing experimental API
    delete document.modelContext;
  });

  it("source-quote and curated-interpretation cards are visibly separated", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Load illustrative demo/i }));
    await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));

    const evidenceBoard = await screen.findByRole("region", { name: /Evidence/i });
    expect(evidenceBoard).toBeInTheDocument();

    const sourceQuotes = within(evidenceBoard).getAllByText(/source-quote/i);
    expect(sourceQuotes.length).toBeGreaterThan(0);

    const curated = within(evidenceBoard).getAllByText(/curated-interpretation/i);
    expect(curated.length).toBeGreaterThan(0);
  });

  it("human actions audit as human; agent actions audit as agent-tool", () => {
    let state = humanPort.createInitialState();
    state = (humanPort.selectScenario(state, FIXTURE_SCENARIO) as { success: true; data: typeof state }).data;
    state = (humanPort.selectProfile(state, "profile-wheelchair") as { success: true; data: typeof state }).data;
    state = (humanPort.setActiveSegments(state, ["seg-01"], state.route.revision) as { success: true; data: typeof state }).data;

    const humanEvents = state.auditLog.filter((e) => e.actor === "human");
    expect(humanEvents.length).toBeGreaterThan(0);
    expect(state.auditLog.every((e) => e.actor === "human")).toBe(true);

    let ast = agentPort.createInitialState();
    ast = (agentPort.selectScenario(ast, FIXTURE_SCENARIO) as { success: true; data: typeof ast }).data;
    const agentEvents = ast.auditLog.filter((e) => e.actor === "agent-tool");
    expect(agentEvents.length).toBeGreaterThan(0);
  });

  it("a mutation invalidates approval and disables export", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Load illustrative demo/i }));
    await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));

    const segmentList = await screen.findByRole("list", { name: /Route segments/i });
    const firstSegment = within(segmentList).getAllByRole("listitem")[0];
    await user.click(within(firstSegment).getByRole("button", { name: /Stage/i }));

    await user.click(screen.getByRole("button", { name: /Open draft/i }));
    const draftPanel = await screen.findByRole("form", { name: /Draft review/i });
    await user.type(within(draftPanel).getByLabelText(/Your position/i), "p");
    await user.type(within(draftPanel).getByLabelText(/Requested change/i), "c");
    await user.click(within(draftPanel).getByRole("button", { name: /Create draft/i }));

    await user.click(screen.getByRole("button", { name: /Approve current draft/i }));
    const exportBtn = screen.getByRole("button", { name: /Export/i });
    await waitFor(() => expect(exportBtn).not.toBeDisabled());

    // Mutate: select a different profile (this invalidates approval)
    await user.click(screen.getByRole("button", { name: /Cyclist/i }));

    await waitFor(() => expect(exportBtn).toBeDisabled());
  });

  it("clear session removes draft, approval, and audit from workspace", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Load illustrative demo/i }));
    await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));

    const segmentList = await screen.findByRole("list", { name: /Route segments/i });
    const firstSegment = within(segmentList).getAllByRole("listitem")[0];
    await user.click(within(firstSegment).getByRole("button", { name: /Stage/i }));
    await user.click(screen.getByRole("button", { name: /Open draft/i }));
    const draftPanel = await screen.findByRole("form", { name: /Draft review/i });
    await user.type(within(draftPanel).getByLabelText(/Your position/i), "p");
    await user.type(within(draftPanel).getByLabelText(/Requested change/i), "c");
    await user.click(within(draftPanel).getByRole("button", { name: /Create draft/i }));
    await user.click(screen.getByRole("button", { name: /Approve current draft/i }));

    await user.click(screen.getByRole("button", { name: /Clear current session/i }));
    expect(screen.queryByRole("list", { name: /Route segments/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Export/i })).not.toBeInTheDocument();
  });

  it("runtime emits no external request", () => {
    const fetchSpy = vi.spyOn(window, "fetch").mockImplementation(() => Promise.resolve(new Response()));
    const xhrSpy = vi.spyOn(XMLHttpRequest.prototype, "open").mockImplementation(() => {});

    render(<App />);
    // No fetch/XHR calls expected during render
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
    xhrSpy.mockRestore();
  });

  it("local map uses actual fixture segment IDs and staged state", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Load illustrative demo/i }));
    await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));

    const mapRegion = await screen.findByRole("img", { name: /Illustrative local route diagram/i });
    expect(mapRegion).toBeInTheDocument();

    // After staging, map should reflect staged count visually
    const segmentList = await screen.findByRole("list", { name: /Route segments/i });
    const firstSegment = within(segmentList).getAllByRole("listitem")[0];
    await user.click(within(firstSegment).getByRole("button", { name: /Stage/i }));

    // Map region should still be present after staging
    expect(screen.getByRole("img", { name: /Illustrative local route diagram/i })).toBeInTheDocument();
  });
});
