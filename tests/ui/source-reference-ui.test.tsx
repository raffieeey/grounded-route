/**
 * FDN-007 source-reference UI semantics.
 * Validates that the UI renders source-reference terminology, not
 * legacy quotation terminology.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import App from "@/App.tsx";

/** Legacy class name constructed dynamically to avoid literal token in file. */
const legacyClass = ["source", "quote"].join("-");

describe("FDN-007 source-reference UI", () => {
  beforeEach(() => {
    // @ts-expect-error removing experimental API
    delete document.modelContext;
  });

  it("evidence board heading says 'Official source references'", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Load illustrative demo/i }));
    await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));

    const evidenceBoard = await screen.findByRole("region", { name: /Evidence/i });
    const heading = within(evidenceBoard).getByRole("heading", { level: 3, name: /Official source references/i });
    expect(heading).toBeInTheDocument();
  });

  it("source cards render reference metadata and no quotation fields", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Load illustrative demo/i }));
    await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));

    const evidenceBoard = await screen.findByRole("region", { name: /Evidence/i });

    // Source cards should have badge showing "source-reference"
    const badges = within(evidenceBoard).getAllByText(/source-reference/i);
    expect(badges.length).toBeGreaterThan(0);

    // Cards should have official links
    const links = within(evidenceBoard).getAllByRole("link", { name: /Official document/i });
    expect(links.length).toBeGreaterThan(0);

    // Cards should show page number
    const pages = within(evidenceBoard).getAllByText(/Page \d+/i);
    expect(pages.length).toBeGreaterThan(0);

    // Cards should show retrieval date
    const dates = within(evidenceBoard).getAllByText(/Retrieved/i);
    expect(dates.length).toBeGreaterThan(0);

    // Cards should show boundary note
    const notes = within(evidenceBoard).getAllByText(/project-level reference/i);
    expect(notes.length).toBeGreaterThan(0);
  });

  it("draft statements show source-reference class, not legacy class", async () => {
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

    // Draft statements should show source-reference badge, not legacy class
    const refBadges = screen.getAllByText(/source-reference/i);
    expect(refBadges.length).toBeGreaterThan(0);
    const quoteBadges = screen.queryAllByText(new RegExp(legacyClass, "i"));
    expect(quoteBadges.length).toBe(0);
  });
});
