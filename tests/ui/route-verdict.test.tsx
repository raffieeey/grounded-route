/**
 * FDN-008 — route-verdict redesign UI contract (V1–V6).
 * Strict TDD: written before the UI implementation.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, within, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import "@testing-library/jest-dom";
import App from "@/App.tsx";
import type { RegisteredTool } from "@/webmcp/index.ts";

function installFakeModelContext() {
  const tools: RegisteredTool[] = [];
  const active = new Map<string, RegisteredTool>();
  const modelContext = {
    async registerTool(tool: RegisteredTool, options?: { signal?: AbortSignal }) {
      tools.push(tool);
      const sig = options?.signal;
      active.set(tool.name, tool);
      if (sig) {
        if (sig.aborted) active.delete(tool.name);
        else sig.addEventListener("abort", () => active.delete(tool.name));
      }
      return { registeredTool: tool };
    },
  };
  Object.defineProperty(document, "modelContext", { value: modelContext, configurable: true, writable: true });
  return {
    tools: () => tools,
    activeCount: () => active.size,
  };
}

afterEach(() => {
  // @ts-expect-error removing experimental API
  delete document.modelContext;
  cleanup();
});

describe("FDN-008 V1 — first-screen value proposition and primary CTA", () => {
  beforeEach(() => {
    // @ts-expect-error removing experimental API
    delete document.modelContext;
  });

  it("shows a resident-facing value proposition and a route-impact-check CTA, not fixture jargon", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /Start a route-impact check/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Load illustrative demo/i })).not.toBeInTheDocument();
    // Value proposition heading must be resident-facing.
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).not.toMatch(/fixture|illustrative demo/i);
    expect(h1.textContent).toMatch(/route|plan|city/i);
  });

  it("keeps the illustrative/local limitation visible without overwhelming the CTA", () => {
    render(<App />);
    expect(screen.getByText(/illustrative|not navigation|not a verified/i)).toBeInTheDocument();
  });
});

describe("FDN-008 V2/V3 — profiles materially change the verdict and shortlist", () => {
  beforeEach(() => {
    // @ts-expect-error removing experimental API
    delete document.modelContext;
  });

  async function loadAndSelectProfile(user: ReturnType<typeof userEvent.setup>, label: RegExp) {
    await user.click(screen.getByRole("button", { name: /Start a route-impact check/i }));
    await screen.findByRole("region", { name: /Workspace/i });
    await user.click(screen.getByRole("button", { name: label }));
  }

  it("renders a route-impact-check verdict card after a profile is selected", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loadAndSelectProfile(user, /Wheelchair user/i);
    const verdict = await screen.findByRole("region", { name: /Route impact check/i });
    expect(verdict).toBeInTheDocument();
    expect(within(verdict).getByText(/Wheelchair user:/i)).toBeInTheDocument();
    expect(within(verdict).getAllByText(/condition/i).length).toBeGreaterThan(0);
    expect(within(verdict).getAllByText(/field verification|illustrative/i).length).toBeGreaterThan(0);
    expect(within(verdict).getAllByText(/draft|review|concern/i).length).toBeGreaterThan(0);
  });

  it("selecting different profiles changes the verdict headline and conditions deterministically", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loadAndSelectProfile(user, /Wheelchair user/i);
    const wVerdict = await screen.findByRole("region", { name: /Route impact check/i });
    const wHeadline = within(wVerdict).getByText(/Wheelchair user:/i).textContent;
    const wConditions = within(screen.getByRole("region", { name: /Conditions to review/i })).getAllByRole("article").length;

    await user.click(screen.getByRole("button", { name: /Cyclist/i }));
    const cVerdict = await screen.findByRole("region", { name: /Route impact check/i });
    const cHeadline = within(cVerdict).getByText(/Cyclist:/i).textContent;
    const cConditions = within(screen.getByRole("region", { name: /Conditions to review/i })).getAllByRole("article").length;

    expect(wHeadline).not.toBe(cHeadline);
    expect(wConditions).not.toBe(cConditions);
    expect(wConditions).toBeGreaterThan(0);
    expect(cConditions).toBeGreaterThan(0);
  });

  it("resident-facing verdict and conditions do not show raw mapping IDs", async () => {
    const user = userEvent.setup();
    render(<App />);
    await loadAndSelectProfile(user, /School-pickup parent/i);
    const verdict = await screen.findByRole("region", { name: /Route impact check/i });
    expect(verdict.textContent).not.toMatch(/\bmap-\d/);
    const conditions = screen.getByRole("region", { name: /Conditions to review/i });
    expect(conditions.textContent).not.toMatch(/\bmap-\d/);
  });
});

describe("FDN-008 V4/V5 — plain concern action creates a prefilled editable draft; approval/export stay resident-only", () => {
  beforeEach(() => {
    // @ts-expect-error removing experimental API
    delete document.modelContext;
  });

  it("a plain-language concern action states its result and stages a possible plan impact", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Start a route-impact check/i }));
    await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));
    const conditions = await screen.findByRole("region", { name: /Conditions to review/i });
    const addBtn = within(conditions).getAllByRole("button", { name: /Add .* to my draft/i })[0];
    await user.click(addBtn);
    // The same control now states the result (added/removable).
    expect(screen.getByRole("button", { name: /remove .* from draft/i })).toBeInTheDocument();
  });

  it("the draft is prefilled and editable, with separated resident/project/source/question sections after preparing", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Start a route-impact check/i }));
    await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));
    await screen.findByRole("region", { name: /Route impact check/i });

    // Draft inputs are prefilled (non-empty) and remain editable.
    const draft = screen.getByRole("region", { name: /Draft review/i });
    const positionInput = within(draft).getByLabelText(/Your position/i) as HTMLInputElement;
    const changeInput = within(draft).getByLabelText(/Requested change/i) as HTMLInputElement;
    const questionsInput = within(draft).getByLabelText(/Open questions/i) as HTMLInputElement;
    expect(positionInput.value.trim().length).toBeGreaterThan(0);
    expect(changeInput.value.trim().length).toBeGreaterThan(0);
    expect(questionsInput.value.trim().length).toBeGreaterThan(0);
    await user.clear(positionInput);
    await user.type(positionInput, "My own edited position");

    await user.click(within(draft).getByRole("button", { name: /Prepare draft/i }));

    const statements = within(draft).getAllByText(/source-reference|curated-interpretation|resident-position|open-question/i);
    expect(statements.length).toBeGreaterThan(0);
    // The resident's edited position survived into the prepared resident-position statement.
    const residentBadge = within(draft).getByText("resident-position");
    const residentStmt = residentBadge.closest("li")!;
    expect(residentStmt.textContent).toMatch(/My own edited position/i);
  });

  it("export remains disabled until the resident approves; approval/export are resident-only", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Start a route-impact check/i }));
    await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));
    await screen.findByRole("region", { name: /Route impact check/i });

    const draft = screen.getByRole("region", { name: /Draft review/i });
    await user.click(within(draft).getByRole("button", { name: /Prepare draft/i }));

    const exportBtn = screen.getByRole("button", { name: /Export/i });
    expect(exportBtn).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /Approve current draft/i }));
    await waitFor(() => expect(exportBtn).not.toBeDisabled());
  });

  it("exhaustive segments, evidence, and audit are behind disclosure by default but keyboard reachable", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Start a route-impact check/i }));
    await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));
    await screen.findByRole("region", { name: /Route impact check/i });
    // Full route segments, evidence board, and audit trail are not in the default flow.
    expect(screen.queryByRole("region", { name: /Route segments/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Evidence board/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Audit trail/i })).not.toBeInTheDocument();
    // But a disclosure control exists and is keyboard operable.
    const showEvidence = screen.getByRole("button", { name: /Show evidence board/i });
    await user.click(showEvidence);
    expect(await screen.findByRole("region", { name: /Evidence board/i })).toBeInTheDocument();
  });
});

describe("FDN-008 V6 — WebMCP agent activity is visible; human flow still works without modelContext", () => {
  it("absent modelContext: human flow still works and shows no assistant activity", async () => {
    // @ts-expect-error removing experimental API
    delete document.modelContext;
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Start a route-impact check/i }));
    await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));
    await screen.findByRole("region", { name: /Route impact check/i });
    expect(screen.queryByRole("region", { name: /Assistant activity/i })).not.toBeInTheDocument();
  });

  it("a WebMCP agent mutation produces a visible, concise assistant activity summary", async () => {
    const mc = installFakeModelContext();
    const user = userEvent.setup();
    render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    await waitFor(() => expect(mc.activeCount()).toBe(6));
    await user.click(screen.getByRole("button", { name: /Start a route-impact check/i }));
    await screen.findByRole("region", { name: /Workspace/i });
    await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));
    await screen.findByRole("region", { name: /Route impact check/i });

    const getRoute = mc.tools().find((t) => t.name === "get_route_context")!;
    const ctx = { signal: new AbortController().signal };
    const ctxOut = JSON.parse(await getRoute.execute({}, ctx)) as { data: { revision: number } };
    const rev = ctxOut.data.revision;
    const stage = mc.tools().find((t) => t.name === "stage_impact_overlay")!;
    const stageOut = JSON.parse(await stage.execute({ mappingId: "map-01", expectedRevision: rev }, ctx));
    expect(stageOut.success).toBe(true);

    const activity = await screen.findByRole("region", { name: /Assistant activity/i });
    expect(activity.textContent).toMatch(/staged a possible plan impact/i);
    // No raw engineering audit rows leak into the resident-facing summary.
    expect(activity.textContent).not.toMatch(/revisionBefore|evt-\d/);
  });

  it("registers exactly six raw tools with no human-authority capability", async () => {
    const mc = installFakeModelContext();
    render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    await waitFor(() => expect(mc.activeCount()).toBe(6));
    const names = mc.tools().map((t) => t.name).sort();
    expect(names).toEqual([
      "clear_staged_overlay",
      "draft_public_comment",
      "find_plan_evidence",
      "get_review_status",
      "get_route_context",
      "stage_impact_overlay",
    ]);
    for (const name of names) {
      expect(name).not.toMatch(/approve|export|publish|copy|download|chat/i);
    }
  });
});
