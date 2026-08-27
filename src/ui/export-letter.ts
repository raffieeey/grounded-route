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

/**
 * Render the approved draft as a plain, readable letter a resident can paste
 * into a city feedback form or email. Human-readable first; machine metadata
 * (OSM attribution) goes in a footer. No fabricated content: every line comes
 * from the approved draft statements.
 */
export function buildExportLetter(state: DomainState): string {
  const draft = state.draft;
  if (!draft) return "";

  const lines: string[] = [];

  lines.push("To the Kuala Lumpur City Hall (DBKL) planning team,");
  lines.push("");

  const position = draft.statements.find((s) => s.statementClass === "resident-position");
  if (position) {
    lines.push(position.text);
    lines.push("");
  }

  lines.push("My requested change:");
  const requestedChange =
    (position as unknown as { requestedChange?: string } | undefined)?.requestedChange ?? "";
  for (const line of requestedChange.split("\n")) {
    lines.push(line.trim() ? `  ${line}` : "");
  }
  lines.push("");

  const openQuestions = draft.statements.filter((s) => s.statementClass === "open-question");
  if (openQuestions.length > 0) {
    lines.push("Open questions I would like answered:");
    for (const q of openQuestions) {
      lines.push(`  - ${q.text}`);
    }
    lines.push("");
  }

  const sources = draft.statements.filter((s) => s.statementClass === "source-reference");
  if (sources.length > 0) {
    lines.push("Official sources referenced:");
    for (const s of sources) {
      lines.push(`  - ${s.text}`);
      const url = (s as unknown as { documentUrl?: string }).documentUrl;
      if (url) lines.push(`    ${url}`);
    }
    lines.push("");
  }

  lines.push("Submitted via Grounded Route (illustrative planning-review workspace).");
  lines.push("Map geometry and tags: © OpenStreetMap contributors (https://www.openstreetmap.org/copyright) —");
  lines.push("illustrative local fixture context, not navigation or certified accessibility data.");
  if (state.approval?.approvedAt) {
    lines.push(`Draft approved by the resident on ${state.approval.approvedAt}.`);
  }

  return lines.join("\n");
}