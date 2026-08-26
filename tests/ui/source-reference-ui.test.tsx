/**
 * FDN-007 source-reference UI semantics (FDN-008 contract).
 * Validates that the UI renders source-reference terminology, not
 * legacy quotation terminology.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import App from "@/App.tsx";

const legacyClass = ["source", "quote"].join("-");

async function startAndProfile(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Start a route-impact check/i }));
  await user.click(screen.getByRole("button", { name: /Wheelchair user/i }));
}

describe("FDN-007 source-reference UI (FDN-008 contract)", () => {
  beforeEach(() => {
    // @ts-expect-error removing experimental API
    delete document.modelContext;
  });

  it("evidence board heading says 'Official source references'", async () => {
    const user = userEvent.setup();
    render(<App />);
    await startAndProfile(user);
    await user.click(screen.getByRole("button", { name: /Show evidence board/i }));
    const evidenceBoard = await screen.findByRole("region", { name: /Evidence board/i });
    const heading = within(evidenceBoard).getByRole("heading", { level: 3, name: /Official source references/i });
    expect(heading).toBeInTheDocument();
  });

  it("source cards render reference metadata and no quotation fields", async () => {
    const user = userEvent.setup();
    render(<App />);
    await startAndProfile(user);
    await user.click(screen.getByRole("button", { name: /Show evidence board/i }));
    const evidenceBoard = await screen.findByRole("region", { name: /Evidence board/i });

    const badges = within(evidenceBoard).getAllByText(/source-reference/i);
    expect(badges.length).toBeGreaterThan(0);
    const links = within(evidenceBoard).getAllByRole("link", { name: /Official document/i });
    expect(links.length).toBeGreaterThan(0);
    const pages = within(evidenceBoard).getAllByText(/Page \d+/i);
    expect(pages.length).toBeGreaterThan(0);
    const dates = within(evidenceBoard).getAllByText(/Retrieved/i);
    expect(dates.length).toBeGreaterThan(0);
    const notes = within(evidenceBoard).getAllByText(/project-level reference/i);
    expect(notes.length).toBeGreaterThan(0);
  });

  it("draft statements show source-reference class, not legacy class", async () => {
    const user = userEvent.setup();
    render(<App />);
    await startAndProfile(user);

    const conditions = await screen.findByRole("region", { name: /Conditions to review/i });
    await user.click(within(conditions).getAllByRole("button", { name: /Add .* to my draft/i })[0]);
    const draft = screen.getByRole("region", { name: /Draft review/i });
    await user.click(within(draft).getByRole("button", { name: /Prepare draft/i }));

    const refBadges = screen.getAllByText(/source-reference/i);
    expect(refBadges.length).toBeGreaterThan(0);
    const quoteBadges = screen.queryAllByText(new RegExp(legacyClass, "i"));
    expect(quoteBadges.length).toBe(0);
  });
});
