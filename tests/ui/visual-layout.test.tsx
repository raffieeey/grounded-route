import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import LocalRouteMap from "@/ui/LocalRouteMap.tsx";
import WorkspaceControls from "@/ui/WorkspaceControls.tsx";
import type { RouteProfile, ScenarioImpactMapping } from "@/contracts/types.ts";
import scenarios from "../../data/demo_scenarios.json";
import profiles from "../../data/route_profiles.json";
import mappings from "../../data/scenario_impact_mappings.json";

const scenario = scenarios[0];
const scenarioMappings = (
  mappings as ScenarioImpactMapping[]
).filter((m) => m.scenarioId === scenario.id);

describe("FDN-002 visual layout — local route diagram", () => {
  it("preserves the explicit illustrative-not-navigation label for assistive tech", () => {
    const { container } = render(
      <LocalRouteMap
        defaultSegmentIds={scenario.defaultSegmentIds}
        stagedMappingIds={[]}
        mappings={scenarioMappings}
      />,
    );
    const svg = container.querySelector("svg.local-route-map");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.getAttribute("aria-label") ?? "").toMatch(/illustrative local route diagram/i);
    expect(screen.getByText(/Illustrative local route diagram — not navigation/i)).toBeVisible();
  });

  it("staggered segment labels alternate above/below the route line with a readable halo", () => {
    const { container } = render(
      <LocalRouteMap
        defaultSegmentIds={scenario.defaultSegmentIds}
        stagedMappingIds={[]}
        mappings={scenarioMappings}
      />,
    );

    const labels = Array.from(
      container.querySelectorAll("svg.local-route-map text.segment-label"),
    );
    expect(labels.length).toBeGreaterThan(0);

    // Every rendered segment label carries an explicit stagger side.
    const sides = labels.map((el) => el.getAttribute("data-stagger"));
    expect(sides.every((s) => s === "up" || s === "down")).toBe(true);

    // Stagger is deliberate: both sides are used (not a single pile on the line).
    expect(new Set(sides).size).toBeGreaterThan(1);

    // Adjacent corridor labels must not share the same side (no run-length overlap).
    for (let i = 1; i < sides.length; i += 1) {
      expect(sides[i]).not.toBe(sides[i - 1]);
    }

    // Each label has a halo (white stroke painted behind the dark fill).
    expect(
      labels.every((el) => (el.getAttribute("stroke") ?? "").toLowerCase() === "#ffffff"),
    ).toBe(true);
    expect(
      labels.every((el) => (el.getAttribute("paint-order") ?? "").includes("stroke")),
    ).toBe(true);
  });
});

describe("FDN-002 visual layout — workspace control semantics on small screens", () => {
  const typedProfiles = profiles as RouteProfile[];

  it("profile selectors keep full readable labels and toggle semantics", () => {
    render(
      <WorkspaceControls
        loaded
        activeProfileId="profile-wheelchair"
        profiles={typedProfiles}
        onLoad={() => {}}
        onClear={() => {}}
        onSelectProfile={() => {}}
      />,
    );

    const group = screen.getByRole("group", { name: /Select a profile/i });
    for (const p of typedProfiles) {
      const btn = within(group).getByRole("button", { name: new RegExp(p.label) });
      expect(btn).toHaveAttribute("aria-label", p.label);
    }
    // Wheelchair is active -> pressed; others are not.
    expect(
      within(group).getByRole("button", { name: /Wheelchair user/i }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(group).getByRole("button", { name: /Cyclist/i }),
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("clear-session control is a labelled, touch-friendly secondary action", () => {
    render(
      <WorkspaceControls
        loaded
        activeProfileId={null}
        profiles={typedProfiles}
        onLoad={() => {}}
        onClear={() => {}}
        onSelectProfile={() => {}}
      />,
    );
    const clear = screen.getByRole("button", { name: /Clear current session/i });
    expect(clear).toHaveClass("btn-secondary");
    expect(clear).toHaveClass("touch-target");
  });
});
