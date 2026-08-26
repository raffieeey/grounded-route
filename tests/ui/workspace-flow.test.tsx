import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import App from "@/App.tsx";

describe("FDN-002 workspace flow (FDN-008 contract)", () => {
  beforeEach(() => {
    // @ts-expect-error removing experimental API
    delete document.modelContext;
  });

  it("renders without modelContext and shows the route-impact-check CTA", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /Start a route-impact check/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Load illustrative demo/i })).not.toBeInTheDocument();
  });

  it("keyboard-only path: start → select profile → add concern → draft → approval readiness", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /Start a route-impact check/i }));
    expect(await screen.findByRole("region", { name: /Workspace/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));
    expect(screen.getByRole("button", { name: /Wheelchair user/i })).toHaveAttribute("aria-pressed", "true");

    const conditions = await screen.findByRole("region", { name: /Conditions to review/i });
    expect(conditions).toBeInTheDocument();

    const addBtn = within(conditions).getAllByRole("button", { name: /Add .* to my draft/i })[0];
    await user.click(addBtn);

    const liveRegion = screen.getByRole("status");
    await waitFor(() => expect(liveRegion.textContent).toMatch(/added|staged|concern/i));

    const draft = screen.getByRole("region", { name: /Draft review/i });
    await user.click(within(draft).getByRole("button", { name: /Prepare draft/i }));

    const exportBtn = screen.getByRole("button", { name: /Export/i });
    expect(exportBtn).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /Approve current draft/i }));
    await waitFor(() => expect(exportBtn).not.toBeDisabled());
  });

  it("clear session removes draft, approval, audit, and UI state", async () => {
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

    expect(screen.queryByRole("region", { name: /Workspace/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Conditions to review/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: /Draft review/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start a route-impact check/i })).toBeInTheDocument();
  });

  it("export is disabled without current approval", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Start a route-impact check/i }));
    await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));
    const conditions = await screen.findByRole("region", { name: /Conditions to review/i });
    await user.click(within(conditions).getAllByRole("button", { name: /Add .* to my draft/i })[0]);
    const draft = screen.getByRole("region", { name: /Draft review/i });
    await user.click(within(draft).getByRole("button", { name: /Prepare draft/i }));

    const exportBtn = screen.getByRole("button", { name: /Export/i });
    expect(exportBtn).toBeDisabled();
  });

  it("does not throw when modelContext is absent and WebMCP registration is feature-gated", () => {
    // @ts-expect-error removing experimental API
    delete document.modelContext;
    expect(() => render(<App />)).not.toThrow();
    expect(screen.getByRole("button", { name: /Start a route-impact check/i })).toBeInTheDocument();
  });
});
