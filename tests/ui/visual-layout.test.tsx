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

describe("FDN-010 visual layout — real local route map", () => {
  it("preserves the explicit illustrative-not-navigation label for assistive tech", () => {
    const { container } = render(
      <LocalRouteMap
        defaultSegmentIds={scenario.defaultSegmentIds}
        stagedMappingIds={[]}
        mappings={scenarioMappings}
      />,
    );
    expect(screen.getByRole("region", { name: /Local route map/i })).toBeVisible();
    expect(container.querySelector(".local-route-map.leaflet-container")).not.toBeNull();
    expect(screen.getByText(/Illustrative local route diagram — not navigation/i)).toBeVisible();
  });

  it("renders permanent named place labels over the real map", () => {
    render(
      <LocalRouteMap
        defaultSegmentIds={scenario.defaultSegmentIds}
        stagedMappingIds={[]}
        mappings={scenarioMappings}
      />,
    );

    for (const name of ["Demo Home (Jalan Haji Hassan Salleh)", "Demo School (near Jalan Ampang)", "Kampung Baru LRT Station", "Saloma Link"]) {
      expect(screen.getByRole("tooltip", { name })).toBeVisible();
    }
  });
});

describe("FDN-002 visual layout — workspace control semantics on small screens", () => {
  const typedProfiles = profiles as RouteProfile[];

  it("profile selectors keep full readable labels and toggle semantics", () => {
    render(
      <WorkspaceControls
        started
        activeProfileId="profile-wheelchair"
        profiles={typedProfiles}
        onStart={() => {}}
        onClear={() => {}}
        onSelectProfile={() => {}}
      />,
    );

    const group = screen.getByRole("group", { name: /Select a.*profile/i });
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
        started
        activeProfileId={null}
        profiles={typedProfiles}
        onStart={() => {}}
        onClear={() => {}}
        onSelectProfile={() => {}}
      />,
    );
    const clear = screen.getByRole("button", { name: /Clear current session/i });
    expect(clear).toHaveClass("btn-secondary");
    expect(clear).toHaveClass("touch-target");
  });
});
