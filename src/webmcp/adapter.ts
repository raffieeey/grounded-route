/**
 * WebMCP adapter (FDN-003 rescue scope).
 *
 * Feature-gated browser adapter that registers exactly six narrow tools with
 * `document.modelContext`. Handlers use only the Grounded Route agent port,
 * the workspace bridge, and local static fixtures. They never mutate the DOM
 * directly, never call fetch/XHR/WebSocket/localStorage/clipboard, and never
 * expose approve/export/copy/download capability to the agent.
 */
import type {
  DocumentLike,
  RegisteredTool,
  RegistrationResult,
} from "@/webmcp/model-context.ts";
import type { WorkspaceBridge } from "@/webmcp/workspace-bridge.ts";
import type {
  Result,
  StructuredDraftInput,
  ScenarioImpactMapping,
  SourceClaim,
} from "@/contracts/types.ts";
import { createGroundedRouteController } from "@/domain/actions.ts";
import scenarioImpactMappings from "../../data/scenario_impact_mappings.json";
import sourceClaimsData from "../../data/source_claims.json";

export const WEBMCP_TOOL_NAMES = [
  "get_route_context",
  "find_plan_evidence",
  "stage_impact_overlay",
  "clear_staged_overlay",
  "draft_public_comment",
  "get_review_status",
] as const;

const knownMappingIds: ReadonlySet<string> = new Set(
  (scenarioImpactMappings as readonly ScenarioImpactMapping[]).map((m) => m.id)
);
const knownSourceClaimIds: ReadonlySet<string> = new Set(
  (sourceClaimsData as readonly SourceClaim[]).map((c) => c.id)
);
const sourceClaimById: ReadonlyMap<string, SourceClaim> = new Map(
  (sourceClaimsData as readonly SourceClaim[]).map((c) => [c.id, c])
);

type AgentPort = ReturnType<typeof createGroundedRouteController>["agentPort"];

function okJson(data: unknown): string {
  return JSON.stringify({ success: true, data });
}

function errorJson(code: string, message: string): string {
  return JSON.stringify({ success: false, errorCode: code, message });
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((x) => typeof x === "string");
}

function describeFailure<T>(result: Result<T>): string {
  return result.success ? "" : result.message;
}

function buildTools(
  agentPort: AgentPort,
  bridge: WorkspaceBridge
): RegisteredTool[] {
  const getRouteContext: RegisteredTool = {
    name: "get_route_context",
    description:
      "Return the current bounded route workspace context: scenario, profile, active segments, staged impact overlays, draft, approval validity, and revision. Read-only.",
    inputSchema: { type: "object", properties: {}, required: [] },
    annotations: { readOnlyHint: true },
    execute: async () => {
      const state = bridge.getState();
      return okJson({
        scenarioId: state.route.scenarioId,
        profileId: state.route.profileId,
        activeSegmentIds: state.route.activeSegmentIds,
        stagedMappingIds: state.route.stagedMappingIds,
        revision: state.route.revision,
        hasDraft: state.draft != null,
        draftId: state.draft?.id ?? null,
        approvalValid: agentPort.isApprovalValid(state),
      });
    },
  };

  const findPlanEvidence: RegisteredTool = {
    name: "find_plan_evidence",
    description:
      "Look up official source references by fixture source claim IDs. Returns reference metadata (document, page, URL, retrieval date, boundary note) only; no quotation content. Read-only; never mutates workspace state.",
    inputSchema: {
      type: "object",
      properties: {
        sourceClaimIds: { type: "array", items: { type: "string" } },
      },
      required: ["sourceClaimIds"],
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: async (input) => {
      const ids = input.sourceClaimIds;
      if (!isStringArray(ids) || ids.length === 0) {
        return errorJson("INVALID_INPUT", "sourceClaimIds must be a non-empty string array");
      }
      for (const id of ids) {
        if (!knownSourceClaimIds.has(id)) {
          return errorJson("INVALID_INPUT", `unknown sourceClaimId: ${id}`);
        }
      }
      const evidence = ids.map((id) => {
        const claim = sourceClaimById.get(id)!;
        return {
          id: claim.id,
          category: claim.category,
          document: claim.document,
          page: claim.page,
          documentUrl: claim.documentUrl,
          boundaryNote: claim.boundaryNote,
          retrievedDate: claim.retrievedDate,
        };
      });
      return okJson({ evidence });
    },
  };

  const stageImpactOverlay: RegisteredTool = {
    name: "stage_impact_overlay",
    description:
      "Stage a reviewed impact mapping overlay for the current scenario. Accepts a fixture mapping ID and the expected revision. Validates IDs before mutation; commits exactly once on success.",
    inputSchema: {
      type: "object",
      properties: {
        mappingId: { type: "string" },
        expectedRevision: { type: "number" },
      },
      required: ["mappingId", "expectedRevision"],
    },
    annotations: {},
    execute: async (input) => {
      const mappingId = input.mappingId;
      const expectedRevision = input.expectedRevision;
      if (typeof mappingId !== "string" || !mappingId) {
        return errorJson("INVALID_INPUT", "mappingId required");
      }
      if (typeof expectedRevision !== "number" || !Number.isFinite(expectedRevision)) {
        return errorJson("INVALID_INPUT", "expectedRevision required");
      }
      if (!knownMappingIds.has(mappingId)) {
        return errorJson("INVALID_INPUT", `unknown mappingId: ${mappingId}`);
      }
      const state = bridge.getState();
      const result = agentPort.stageMapping(state, mappingId, expectedRevision);
      if (!result.success) {
        return errorJson(result.errorCode, describeFailure(result));
      }
      const next = result.data;
      bridge.replaceState(next, `stage_impact_overlay:${mappingId}`);
      return okJson({
        mappingId,
        stagedMappingIds: next.route.stagedMappingIds,
        revision: next.route.revision,
      });
    },
  };

  const clearStagedOverlay: RegisteredTool = {
    name: "clear_staged_overlay",
    description:
      "Clear all staged impact overlays for the current scenario. Accepts the expected revision. Fails with no mutation when nothing is staged.",
    inputSchema: {
      type: "object",
      properties: {
        expectedRevision: { type: "number" },
      },
      required: ["expectedRevision"],
    },
    annotations: {},
    execute: async (input) => {
      const expectedRevision = input.expectedRevision;
      if (typeof expectedRevision !== "number" || !Number.isFinite(expectedRevision)) {
        return errorJson("INVALID_INPUT", "expectedRevision required");
      }
      const state = bridge.getState();
      const result = agentPort.clearStagedMappings(state, expectedRevision);
      if (!result.success) {
        return errorJson(result.errorCode, describeFailure(result));
      }
      const next = result.data;
      bridge.replaceState(next, "clear_staged_overlay:all");
      return okJson({
        cleared: true,
        stagedMappingIds: next.route.stagedMappingIds,
        revision: next.route.revision,
      });
    },
  };

  const draftPublicComment: RegisteredTool = {
    name: "draft_public_comment",
    description:
      "Draft a transparent, labelled public comment from reviewed mappings, official source references, a resident position, a requested change, and open questions. Writes deterministic local text with structured statements; no executable HTML or instructions. Resident alone later approves/exports.",
    inputSchema: {
      type: "object",
      properties: {
        mappingIds: { type: "array", items: { type: "string" } },
        sourceClaimIds: { type: "array", items: { type: "string" } },
        userPosition: { type: "string" },
        requestedChange: { type: "string" },
        openQuestions: { type: "array", items: { type: "string" } },
        expectedRevision: { type: "number" },
      },
      required: [
        "mappingIds",
        "sourceClaimIds",
        "userPosition",
        "requestedChange",
        "openQuestions",
        "expectedRevision",
      ],
    },
    annotations: {},
    execute: async (input) => {
      const mappingIds = input.mappingIds;
      const sourceClaimIds = input.sourceClaimIds;
      const userPosition = input.userPosition;
      const requestedChange = input.requestedChange;
      const openQuestions = input.openQuestions;
      const expectedRevision = input.expectedRevision;

      if (!isStringArray(mappingIds)) {
        return errorJson("INVALID_INPUT", "mappingIds must be a string array");
      }
      if (!isStringArray(sourceClaimIds)) {
        return errorJson("INVALID_INPUT", "sourceClaimIds must be a string array");
      }
      if (typeof userPosition !== "string" || !userPosition.trim()) {
        return errorJson("INVALID_INPUT", "userPosition required");
      }
      if (typeof requestedChange !== "string" || !requestedChange.trim()) {
        return errorJson("INVALID_INPUT", "requestedChange required");
      }
      if (!isStringArray(openQuestions)) {
        return errorJson("INVALID_INPUT", "openQuestions must be a string array");
      }
      if (typeof expectedRevision !== "number" || !Number.isFinite(expectedRevision)) {
        return errorJson("INVALID_INPUT", "expectedRevision required");
      }
      for (const id of mappingIds) {
        if (!knownMappingIds.has(id)) {
          return errorJson("INVALID_INPUT", `unknown mappingId: ${id}`);
        }
      }
      for (const id of sourceClaimIds) {
        if (!knownSourceClaimIds.has(id)) {
          return errorJson("INVALID_INPUT", `unknown sourceClaimId: ${id}`);
        }
      }
      const structuredInput: StructuredDraftInput = {
        mappingIds,
        sourceClaimIds,
        userPosition,
        requestedChange,
        openQuestions,
      };
      const state = bridge.getState();
      const result = agentPort.createStructuredDraft(state, structuredInput, expectedRevision);
      if (!result.success) {
        return errorJson(result.errorCode, describeFailure(result));
      }
      const next = result.data;
      bridge.replaceState(next, "draft_public_comment");
      const draft = next.draft!;
      return okJson({
        draftId: draft.id,
        revision: next.route.revision,
        text: draft.text,
        statements: draft.statements,
      });
    },
  };

  const getReviewStatus: RegisteredTool = {
    name: "get_review_status",
    description:
      "Return the review status: revision, staged overlays, draft, approval validity, and audit actor counts (human vs agent-tool). Read-only.",
    inputSchema: { type: "object", properties: {}, required: [] },
    annotations: { readOnlyHint: true },
    execute: async () => {
      const state = bridge.getState();
      const human = state.auditLog.filter((e) => e.actor === "human").length;
      const agentTool = state.auditLog.filter((e) => e.actor === "agent-tool").length;
      return okJson({
        revision: state.route.revision,
        scenarioId: state.route.scenarioId,
        stagedMappingIds: state.route.stagedMappingIds,
        hasDraft: state.draft != null,
        draftId: state.draft?.id ?? null,
        approvalValid: agentPort.isApprovalValid(state),
        approvalInvalidated: state.approval?.invalidated ?? false,
        audit: {
          human,
          agentTool,
          total: state.auditLog.length,
        },
      });
    },
  };

  return [
    getRouteContext,
    findPlanEvidence,
    stageImpactOverlay,
    clearStagedOverlay,
    draftPublicComment,
    getReviewStatus,
  ];
}

export interface RegisterOptions {
  signal?: AbortSignal;
}

/**
 * Feature-gated registration. When `document.modelContext` is absent, returns
 * one structured unavailable result per tool without throwing or mutating the
 * bridge. When present, registers each tool and returns its registered tool.
 */
export async function registerWebMcpTools(
  document: DocumentLike,
  bridge: WorkspaceBridge,
  options?: RegisterOptions
): Promise<RegistrationResult[]> {
  const mc = document?.modelContext;
  if (!mc) {
    return WEBMCP_TOOL_NAMES.map((name) => ({
      unavailable: true as const,
      reason: `modelContext unavailable: ${name} not registered`,
    }));
  }

  const signal = options?.signal;
  const controller = createGroundedRouteController();
  const tools = buildTools(controller.agentPort, bridge);
  const results: RegistrationResult[] = [];
  for (const tool of tools) {
    // Stop registering the remaining tools once the caller has aborted (e.g.
    // a StrictMode remount or real unmount). Each registerTool call also
    // receives the signal so a host can remove an already-registered tool.
    if (signal?.aborted) {
      results.push({
        unavailable: true,
        reason: `registration aborted before ${tool.name}`,
      });
      continue;
    }
    try {
      await mc.registerTool(tool, signal ? { signal } : undefined);
      results.push({ unavailable: false, registeredTool: tool });
    } catch (error) {
      results.push({
        unavailable: true,
        reason: `registerTool failed for ${tool.name}: ${String(error)}`,
      });
    }
  }
  return results;
}
