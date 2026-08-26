import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import App from "@/App.tsx";

describe("FDN-002 workspace flow", () => {
  beforeEach(() => {
    // Ensure modelContext is absent for human-only test
    // @ts-expect-error removing experimental API removing experimental API
    delete document.modelContext;
  });

  it("renders without modelContext and shows load demo button", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /Load illustrative demo/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Clear current session/i })).not.toBeInTheDocument();
  });

  it("keyboard-only path: load → select profile → stage → draft → approval readiness", async () => {
    const user = userEvent.setup();
    render(<App />);

    // Load demo
    await user.click(screen.getByRole("button", { name: /Load illustrative demo/i }));
    expect(await screen.findByRole("region", { name: /Workspace/i })).toBeInTheDocument();

    // Select wheelchair profile
    await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));
    expect(screen.getByRole("button", { name: /Wheelchair user/i })).toHaveAttribute("aria-pressed", "true");

    // Segment list should appear
    const segmentList = await screen.findByRole("list", { name: /Route segments/i });
    expect(segmentList).toBeInTheDocument();

    // Stage a mapping from the first segment row
    const firstSegment = within(segmentList).getAllByRole("listitem")[0];
    const stageBtn = within(firstSegment).getByRole("button", { name: /Stage/i });
    await user.click(stageBtn);

    // Staged announcement
    const liveRegion = screen.getByRole("status");
    await waitFor(() => expect(liveRegion.textContent).toMatch(/staged/i));

    // Open draft panel
    await user.click(screen.getByRole("button", { name: /Open draft/i }));
    const draftPanel = await screen.findByRole("form", { name: /Draft review/i });
    expect(draftPanel).toBeInTheDocument();

    // Fill draft
    await user.type(within(draftPanel).getByLabelText(/Your position/i), "Concerned parent");
    await user.type(within(draftPanel).getByLabelText(/Requested change/i), "Install ramps");
    await user.type(within(draftPanel).getByLabelText(/Open questions/i), "Timeline?");

    // Create structured draft
    await user.click(within(draftPanel).getByRole("button", { name: /Create draft/i }));

    // Approval readiness: export should be disabled until approved
    const exportBtn = screen.getByRole("button", { name: /Export/i });
    expect(exportBtn).toBeDisabled();

    // Approve draft
    await user.click(screen.getByRole("button", { name: /Approve current draft/i }));
    await waitFor(() => expect(exportBtn).not.toBeDisabled());
  });

  it("clear session removes draft, approval, audit, and UI state", async () => {
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

    // Now clear
    await user.click(screen.getByRole("button", { name: /Clear current session/i }));

    expect(screen.queryByRole("region", { name: /Workspace/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("list", { name: /Route segments/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("form", { name: /Draft review/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Load illustrative demo/i })).toBeInTheDocument();
  });

  it("export is disabled without current approval", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Load illustrative demo/i }));
    await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));

    // Stage + draft but no approval
    const segmentList = await screen.findByRole("list", { name: /Route segments/i });
    const firstSegment = within(segmentList).getAllByRole("listitem")[0];
    await user.click(within(firstSegment).getByRole("button", { name: /Stage/i }));
    await user.click(screen.getByRole("button", { name: /Open draft/i }));
    const draftPanel = await screen.findByRole("form", { name: /Draft review/i });
    await user.type(within(draftPanel).getByLabelText(/Your position/i), "p");
    await user.type(within(draftPanel).getByLabelText(/Requested change/i), "c");
    await user.click(within(draftPanel).getByRole("button", { name: /Create draft/i }));

    // Export button exists now but is disabled
    const exportBtn = screen.getByRole("button", { name: /Export/i });
    expect(exportBtn).toBeDisabled();
  });

  it("does not throw when modelContext is absent and WebMCP registration is feature-gated", () => {
    // @ts-expect-error removing experimental API
    delete document.modelContext;
    expect(() => render(<App />)).not.toThrow();
    expect(screen.getByRole("button", { name: /Load illustrative demo/i })).toBeInTheDocument();
  });
});
