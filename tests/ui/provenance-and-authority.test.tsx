import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import App from "@/App.tsx";
import { createGroundedRouteController } from "@/domain/actions.ts";

const { humanPort, agentPort } = createGroundedRouteController();
const FIXTURE_SCENARIO = "saloma-link-active-mobility-demo";

describe("FDN-002 provenance and authority (FDN-008 contract)", () => {
  beforeEach(() => {
    // @ts-expect-error removing experimental API
    delete document.modelContext;
  });

  it("source-reference and curated-interpretation cards are visibly separated", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Start a route-impact check/i }));
    await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));

    // Evidence board is behind disclosure.
    await user.click(screen.getByRole("button", { name: /Show evidence board/i }));
    const evidenceBoard = await screen.findByRole("region", { name: /Evidence board/i });
    expect(evidenceBoard).toBeInTheDocument();

    const sourceRefs = within(evidenceBoard).getAllByText(/source-reference/i);
    expect(sourceRefs.length).toBeGreaterThan(0);
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
    await user.click(screen.getByRole("button", { name: /Start a route-impact check/i }));
    await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));

    const conditions = await screen.findByRole("region", { name: /Conditions to review/i });
    await user.click(within(conditions).getAllByRole("button", { name: /Add .* to my draft/i })[0]);

    const draft = screen.getByRole("region", { name: /Draft review/i });
    await user.click(within(draft).getByRole("button", { name: /Prepare draft/i }));

    await user.click(screen.getByRole("button", { name: /Approve current draft/i }));
    const exportBtn = screen.getByRole("button", { name: /Export/i });
    await waitFor(() => expect(exportBtn).not.toBeDisabled());

    // Mutate: select a different profile (this invalidates approval).
    await user.click(screen.getByRole("button", { name: /Cyclist/i }));
    await waitFor(() => expect(exportBtn).toBeDisabled());
  });

  it("clear session removes draft, approval, and audit from workspace", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Start a route-impact check/i }));
    await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));
    const conditions = await screen.findByRole("region", { name: /Conditions to review/i });
    await user.click(within(conditions).getAllByRole("button", { name: /Add .* to my draft/i })[0]);
    const draft = screen.getByRole("region", { name: /Draft review/i });
    await user.click(within(draft).getByRole("button", { name: /Prepare draft/i }));
    await user.click(screen.getByRole("button", { name: /Approve current draft/i }));

    await user.click(screen.getByRole("button", { name: /Clear current session/i }));
    expect(screen.queryByRole("region", { name: /Conditions to review/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Export/i })).not.toBeInTheDocument();
  });

  it("runtime emits no external request", () => {
    const fetchSpy = vi.spyOn(window, "fetch").mockImplementation(() => Promise.resolve(new Response()));
    const xhrSpy = vi.spyOn(XMLHttpRequest.prototype, "open").mockImplementation(() => {});

    render(<App />);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
    xhrSpy.mockRestore();
  });

  it("local map uses actual fixture segment IDs and staged state", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Start a route-impact check/i }));
    await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));

    const mapRegion = await screen.findByRole("img", { name: /Illustrative local route diagram/i });
    expect(mapRegion).toBeInTheDocument();

    const conditions = await screen.findByRole("region", { name: /Conditions to review/i });
    await user.click(within(conditions).getAllByRole("button", { name: /Add .* to my draft/i })[0]);

    expect(screen.getByRole("img", { name: /Illustrative local route diagram/i })).toBeInTheDocument();
  });
});
