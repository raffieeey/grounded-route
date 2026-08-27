import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import LocalRouteMap from "@/ui/LocalRouteMap.tsx";
import type { ScenarioImpactMapping } from "@/contracts/types.ts";
import profiles from "../../data/route_profiles.json";
import mappings from "../../data/scenario_impact_mappings.json";

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: React.PropsWithChildren) => <div data-testid="leaflet-map">{children}</div>,
  Marker: ({ children, position }: React.PropsWithChildren<{ position: [number, number] }>) => (
    <div data-testid="stairs-marker" data-lat={position[0]} data-lng={position[1]}>{children}</div>
  ),
  TileLayer: ({ eventHandlers }: { eventHandlers?: { tileerror?: () => void } }) => (
    <button type="button" aria-label="Trigger tile error" onClick={eventHandlers?.tileerror}>OSM tiles</button>
  ),
  Polyline: ({ pathOptions, children, ref: _ref, ...props }: React.PropsWithChildren<{ pathOptions: { color: string; weight: number; opacity?: number; className?: string }; ref?: unknown }>) => (
    <path data-testid="route-polyline" className={pathOptions.className} data-color={pathOptions.color} data-weight={pathOptions.weight} data-opacity={pathOptions.opacity} {...props}>{children}</path>
  ),
  CircleMarker: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
  Tooltip: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => <span {...props}>{children}</span>,
  useMap: () => ({ fitBounds: vi.fn() }),
}));

const typedProfiles = profiles as Array<{ id: string; label: string; routeSegmentIds: string[] }>;
const scenarioMappings = mappings as ScenarioImpactMapping[];

function renderMap(profileId: string, stagedMappingIds: string[] = []) {
  const profile = typedProfiles.find((candidate) => candidate.id === profileId)!;
  return render(
    <LocalRouteMap
      profileId={profileId}
      defaultSegmentIds={profile.routeSegmentIds}
      stagedMappingIds={stagedMappingIds}
      mappings={scenarioMappings}
    />,
  );
}

describe("FDN-011 profile-distinct route visualization", () => {
  it("renders own route paths in the selected profile color and fades the rest", () => {
    renderMap("profile-wheelchair");

    expect(document.querySelector("[data-segment-id='seg-saloma-elevator-bridge-approach']")).toHaveClass("segment-path--profile-wheelchair");
    expect(document.querySelector("[data-segment-id='seg-saloma-elevator-bridge-approach']")).toHaveAttribute("data-color", "#6d28d9");
    expect(document.querySelector("[data-segment-id='seg-saloma-elevator-bridge-approach']")).toHaveAttribute("data-weight", "4");
    expect(document.querySelector("[data-segment-id='seg-jalan-raja-abdullah-sultan-ismail-cycling-detour']")).toHaveClass("segment-path--background");
    expect(document.querySelector("[data-segment-id='seg-jalan-raja-abdullah-sultan-ismail-cycling-detour']")).toHaveAttribute("data-opacity", "0.25");
    expect(document.querySelector("[data-segment-id='seg-jalan-raja-abdullah-sultan-ismail-cycling-detour']")).toHaveAttribute("data-weight", "1");
  });

  it("shows the selected resident profile and route note in the colored caption", () => {
    renderMap("profile-parent");

    const caption = screen.getByTestId("profile-route-caption");
    expect(caption).toHaveTextContent("Your route as a School-pickup parent");
    expect(caption).toHaveTextContent("uses the north stair shortcut");
    expect(caption).toHaveStyle({ color: "rgb(217, 119, 6)" });
  });

  it("re-colors route paths and caption when the profile changes", () => {
    const wheelchair = typedProfiles.find((profile) => profile.id === "profile-wheelchair")!;
    const cyclist = typedProfiles.find((profile) => profile.id === "profile-cyclist")!;
    const { rerender } = renderMap("profile-wheelchair");

    expect(document.querySelector("[data-segment-id='seg-saloma-elevator-bridge-approach']")).toHaveAttribute("data-color", "#6d28d9");
    rerender(<LocalRouteMap profileId="profile-cyclist" defaultSegmentIds={cyclist.routeSegmentIds} stagedMappingIds={[]} mappings={scenarioMappings} />);

    expect(document.querySelector("[data-segment-id='seg-jalan-raja-abdullah-sultan-ismail-cycling-detour']")).toHaveAttribute("data-color", "#0f766e");
    expect(document.querySelector("[data-segment-id='seg-saloma-to-klcc-park-step-free-approach']")).toHaveClass("segment-path--background");
    expect(screen.getByTestId("profile-route-caption")).toHaveTextContent("Your route as a Cyclist");
    expect(wheelchair.routeSegmentIds).toContain("seg-saloma-elevator-bridge-approach");
  });

  it("keeps staged blue styling ahead of the selected profile color", () => {
    renderMap("profile-wheelchair", ["map-03"]);

    const staged = document.querySelector("[data-segment-id='seg-saloma-elevator-bridge-approach']")!;
    expect(staged).toHaveAttribute("data-staged", "true");
    expect(staged).toHaveAttribute("data-color", "#0075de");
    expect(staged).toHaveAttribute("data-weight", "5");
    expect(staged).not.toHaveClass("segment-path--profile-wheelchair");
  });

  it("keeps profile color, fading, and detour labels in the schematic fallback", () => {
    renderMap("profile-cyclist");
    fireEvent.click(screen.getByRole("button", { name: "Trigger tile error" }));

    const bypass = document.querySelector("[data-segment-id='seg-jalan-raja-abdullah-sultan-ismail-cycling-detour']")!;
    expect(bypass).toHaveAttribute("stroke", "#0f766e");
    expect(bypass).toHaveAttribute("stroke-width", "4");
    expect(document.querySelector("[data-segment-id='seg-saloma-to-klcc-park-step-free-approach']")).toHaveAttribute("opacity", "0.25");
    expect(screen.getByText("Jalan Raja Abdullah and Sultan Ismail cycling road detour")).toHaveClass("route-detour-label--profile-cyclist");
  });
});
