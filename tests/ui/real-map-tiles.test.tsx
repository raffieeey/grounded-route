import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import LocalRouteMap, { clusterWorksMarkers } from "@/ui/LocalRouteMap.tsx";
import type { ScenarioImpactMapping } from "@/contracts/types.ts";
import scenarios from "../../data/demo_scenarios.json";
import mappings from "../../data/scenario_impact_mappings.json";

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
    <div data-testid="leaflet-map" {...props}>{children}</div>
  ),
  Marker: ({ children, position, icon }: React.PropsWithChildren<{
    position: [number, number];
    icon?: { options?: { html?: string } };
  }>) => (
    <div
      data-testid={icon?.options?.html?.includes("works-chip") ? "works-marker" : "stairs-marker"}
      data-lat={position[0]}
      data-lng={position[1]}
    >
      {children}
    </div>
  ),
  TileLayer: ({ eventHandlers }: { eventHandlers?: { tileerror?: () => void } }) => (
    <button type="button" aria-label="Trigger tile error" onClick={eventHandlers?.tileerror}>
      OSM tiles
    </button>
  ),
  Polyline: ({
    pathOptions,
    "data-staged": staged,
  }: {
    pathOptions: { color: string; weight: number; opacity?: number; className?: string };
    "data-staged"?: string;
  }) => (
    <path
      data-testid="route-polyline"
      className={pathOptions.className}
      data-staged={staged}
      data-color={pathOptions.color}
      data-weight={pathOptions.weight}
      data-opacity={pathOptions.opacity}
    />
  ),
  CircleMarker: ({ children }: React.PropsWithChildren) => <div data-testid="place-marker">{children}</div>,
  Tooltip: ({ children }: React.PropsWithChildren) => <span>{children}</span>,
  useMap: () => ({ fitBounds: vi.fn() }),
}));

const scenario = scenarios[0];
const scenarioMappings = (mappings as ScenarioImpactMapping[]).filter(
  (mapping) => mapping.scenarioId === scenario.id,
);

function renderMap(stagedMappingIds: string[] = []) {
  return render(
    <LocalRouteMap
      defaultSegmentIds={scenario.defaultSegmentIds}
      stagedMappingIds={stagedMappingIds}
      mappings={scenarioMappings}
    />,
  );
}

describe("FDN-010 real map tiles", () => {
  it("clusters nearby works markers into one counted chip", () => {
    const clusters = clusterWorksMarkers([
      { lat: 3.16146, lng: 101.70785, segmentId: "near-a" },
      { lat: 3.16149, lng: 101.70788, segmentId: "near-b" },
      { lat: 3.1604, lng: 101.70925, segmentId: "far" },
    ]);

    expect(clusters).toEqual([
      expect.objectContaining({ segmentIds: ["near-a", "near-b"], count: 2 }),
      expect.objectContaining({ segmentIds: ["far"], count: 1 }),
    ]);
  });

  it("renders a Leaflet map container with route overlay paths", () => {
    renderMap();

    expect(screen.getByTestId("leaflet-map")).toHaveClass("local-route-map");
    expect(screen.getAllByTestId("route-polyline")).toHaveLength(18);
  });

  it("marks staged route paths for the blue sweep overlay", () => {
    renderMap(["map-01"]);

    const staged = document.querySelectorAll("[data-testid='route-polyline'][data-staged='true']");
    expect(staged.length).toBeGreaterThan(0);
    expect(Array.from(staged).some((path) => path.classList.contains("segment-path--staged"))).toBe(true);
  });

  it("falls back to the schematic when OSM tiles report an error", () => {
    renderMap();

    fireEvent.click(screen.getByRole("button", { name: "Trigger tile error" }));
    expect(screen.getByTestId("local-route-map-fallback")).toBeVisible();
    expect(screen.queryByTestId("leaflet-map")).not.toBeInTheDocument();
  });

  it("keeps visible OSM attribution and the staged-review chip", () => {
    renderMap(["map-01"]);

    expect(screen.getByText(/© OpenStreetMap contributors/i)).toBeVisible();
    expect(screen.getByText("Staged — awaiting your review")).toBeVisible();
  });

  it("shows counted works chips away from the stair-shortcut label", () => {
    renderMap(["map-01"]);

    expect(screen.getByText("Stair shortcut — on your route")).toBeVisible();
    expect(screen.queryByText("Proposed works ×3")).not.toBeInTheDocument();
    // 120m clustering collapses the 8 staged segments into 3 readable chips
    // (with ×N count badges) instead of an overlapping pile.
    expect(screen.getAllByTestId("works-marker")).toHaveLength(3);
  });
});
