import type { DomainState } from "@/contracts/types.ts";

export interface ExportAttribution {
  osm: string;
  licenseUrl: string;
  scope: string;
}

export interface ExportPayload {
  draft: DomainState["draft"];
  approvedAt: string | undefined;
  attribution: ExportAttribution;
}

export function buildExportPayload(state: DomainState): ExportPayload {
  return {
    draft: state.draft,
    approvedAt: state.approval?.approvedAt,
    attribution: {
      osm: "© OpenStreetMap contributors",
      licenseUrl: "https://www.openstreetmap.org/copyright",
      scope:
        "Geometry and tags are illustrative local fixture context, not navigation or certified accessibility data.",
    },
  };
}
