import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import "@testing-library/jest-dom";
import App from "@/App.tsx";
import type { RegisteredTool } from "@/webmcp/index.ts";

/**
 * Focused lifecycle test for DSK-UI-001: proves the WebMCP tool surface is
 * registered exactly once across a StrictMode mount plus resident state
 * mutations, and that unmount aborts/cleans up registrations.
 */
interface ActiveRegistration {
  tool: RegisteredTool;
  signal: AbortSignal | undefined;
}

function installFakeModelContext() {
  const registerToolCalls: string[] = [];
  const active = new Map<string, ActiveRegistration>();

  const modelContext = {
    async registerTool(tool: RegisteredTool, options?: { signal?: AbortSignal }) {
      registerToolCalls.push(tool.name);
      const signal = options?.signal;
      active.set(tool.name, { tool, signal });
      if (signal) {
        if (signal.aborted) {
          active.delete(tool.name);
        } else {
          signal.addEventListener("abort", () => active.delete(tool.name));
        }
      }
      return { registeredTool: tool };
    },
  };

  Object.defineProperty(document, "modelContext", {
    value: modelContext,
    configurable: true,
    writable: true,
  });

  return {
    registerToolCalls: () => [...registerToolCalls],
    activeCount: () => active.size,
    activeNames: () => [...active.keys()].sort(),
  };
}

afterEach(() => {
  // @ts-expect-error removing experimental API
  delete document.modelContext;
});

describe("WebMCP registration lifecycle (DSK-UI-001)", () => {
  it("registers exactly six tools once under StrictMode and keeps them after state mutations", async () => {
    const mc = installFakeModelContext();
    const user = userEvent.setup();
    render(
      <StrictMode>
        <App />
      </StrictMode>
    );

    // Settled StrictMode mount must yield exactly six active registrations.
    await waitFor(() => expect(mc.activeCount()).toBe(6));
    expect(mc.activeNames()).toEqual([
      "clear_staged_overlay",
      "draft_public_comment",
      "find_plan_evidence",
      "get_review_status",
      "get_route_context",
      "stage_impact_overlay",
    ]);
    const callsAfterMount = mc.registerToolCalls().length;
    expect(callsAfterMount).toBeGreaterThanOrEqual(6);

    // Resident load — UI state mutation through the same bridge.
    await user.click(screen.getByRole("button", { name: /Load illustrative demo/i }));
    await screen.findByRole("region", { name: /Workspace/i });

    // No new registrations after a state change.
    expect(mc.registerToolCalls().length).toBe(callsAfterMount);
    expect(mc.activeCount()).toBe(6);

    // Profile selection mutation — still no re-registration.
    await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));
    expect(mc.registerToolCalls().length).toBe(callsAfterMount);
    expect(mc.activeCount()).toBe(6);
  });

  it("does not leave active registrations after unmount", async () => {
    const mc = installFakeModelContext();
    render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    await waitFor(() => expect(mc.activeCount()).toBe(6));
    cleanup();
    await waitFor(() => expect(mc.activeCount()).toBe(0));
  });

  it("remains safe (human-only) when modelContext is absent", () => {
    // @ts-expect-error removing experimental API
    delete document.modelContext;
    expect(() =>
      render(
        <StrictMode>
          <App />
        </StrictMode>
      )
    ).not.toThrow();
    expect(screen.getByRole("button", { name: /Load illustrative demo/i })).toBeInTheDocument();
    cleanup();
  });
});
