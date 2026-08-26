import type {
  DomainState,
  AuditEvent,
  Result,
  ErrorCode,
  ScenarioImpactMapping,
  AgentPort,
  ResidentPort,
} from "@/contracts/types.ts";

import scenarioImpactMappings from "../../data/scenario_impact_mappings.json";

interface GroundedRouteController {
  agentPort: AgentPort;
  residentPort: ResidentPort;
}

let _eventCounter = 0;
function nextEventId(): string {
  _eventCounter += 1;
  return `evt-${Date.now()}-${_eventCounter}`;
}

function fail<T>(code: ErrorCode, message: string): Result<T> {
  return { success: false, errorCode: code, message };
}

function ok<T>(data: T, revision: number): Result<T> {
  return { success: true, data, revision };
}

function writeAudit(
  state: DomainState,
  action: string,
  payload: Record<string, unknown>
): DomainState {
  const nextRevision = state.route.revision + 1;
  const event: AuditEvent = {
    eventId: nextEventId(),
    timestamp: new Date().toISOString(),
    action,
    payload,
    revisionBefore: state.route.revision,
    revisionAfter: nextRevision,
  };
  return {
    ...state,
    route: { ...state.route, revision: nextRevision },
    auditLog: [...state.auditLog, event],
  };
}

function buildScenarioMappingIndex(
  mappings: readonly ScenarioImpactMapping[]
): ReadonlyMap<string, ReadonlySet<string>> {
  const scenarioMap = new Map<string, Set<string>>();

  for (const mapping of mappings) {
    const set = scenarioMap.get(mapping.scenarioId);
    if (set) {
      set.add(mapping.id);
    } else {
      scenarioMap.set(mapping.scenarioId, new Set([mapping.id]));
    }
  }

  const trustedIndex = new Map<string, ReadonlySet<string>>();
  for (const [scenarioId, ids] of scenarioMap.entries()) {
    trustedIndex.set(scenarioId, ids);
  }

  return trustedIndex;
}

const trustedMappingIndex: ReadonlyMap<string, ReadonlySet<string>> =
  buildScenarioMappingIndex(
    scenarioImpactMappings as readonly ScenarioImpactMapping[]
  );

const EMPTY_MAPPING_IDS: ReadonlySet<string> = new Set<string>();

function mappingIdsForScenario(
  scenarioId: string | null
): ReadonlySet<string> {
  if (!scenarioId) return EMPTY_MAPPING_IDS;
  return trustedMappingIndex.get(scenarioId) ?? EMPTY_MAPPING_IDS;
}

export function createInitialState(): DomainState {
  return {
    route: {
      scenarioId: null,
      profileId: null,
      activeSegmentIds: [],
      stagedMappingIds: [],
      revision: 0,
    },
    draft: null,
    approval: null,
    auditLog: [],
  };
}

export function selectScenario(
  state: DomainState,
  scenarioId: string
): Result<DomainState> {
  if (!scenarioId) {
    return fail("INVALID_INPUT", "scenarioId required");
  }
  const next = writeAudit(state, "selectScenario", { scenarioId });
  next.route.scenarioId = scenarioId;
  next.route.stagedMappingIds = [];
  next.approval = null;
  return ok(next, next.route.revision);
}

export function selectProfile(
  state: DomainState,
  profileId: string
): Result<DomainState> {
  if (!profileId) {
    return fail("INVALID_INPUT", "profileId required");
  }
  const next = writeAudit(state, "selectProfile", { profileId });
  next.route.profileId = profileId;
  next.approval = null;
  return ok(next, next.route.revision);
}

export function setActiveSegments(
  state: DomainState,
  segmentIds: string[],
  expectedRevision: number
): Result<DomainState> {
  if (state.route.revision !== expectedRevision) {
    return fail("STALE_CONTEXT", "segment mutation rejected: stale revision");
  }
  const next = writeAudit(state, "setActiveSegments", { segmentIds });
  next.route.activeSegmentIds = [...segmentIds];
  next.approval = null;
  return ok(next, next.route.revision);
}

function stageMappingWithAllowedSet(
  state: DomainState,
  mappingId: string,
  expectedRevision: number,
  allowedMappings: ReadonlySet<string>
): Result<DomainState> {
  if (state.route.revision !== expectedRevision) {
    return fail("STALE_CONTEXT", "stageMapping rejected: stale revision");
  }

  if (!state.route.scenarioId) {
    return fail("PRECONDITION_FAILED", "stageMapping rejected: no scenario selected");
  }

  if (!allowedMappings.has(mappingId)) {
    return fail(
      "PRECONDITION_FAILED",
      "stageMapping rejected: mappingId is not in the scenario reviewed allowlist"
    );
  }

  if (state.route.stagedMappingIds.includes(mappingId)) {
    return fail("PRECONDITION_FAILED", "mapping already staged");
  }

  const next = writeAudit(state, "stageMapping", {
    mappingId,
    scenarioId: state.route.scenarioId,
  });
  next.route.stagedMappingIds = [...next.route.stagedMappingIds, mappingId];
  next.approval = null;
  return ok(next, next.route.revision);
}

function createDraftWithAllowedSet(
  state: DomainState,
  text: string,
  mappingIds: string[],
  expectedRevision: number,
  allowedMappings: ReadonlySet<string>
): Result<DomainState> {
  if (state.route.revision !== expectedRevision) {
    return fail("STALE_CONTEXT", "createDraft rejected: stale revision");
  }
  if (state.route.scenarioId == null) {
    return fail("PRECONDITION_FAILED", "createDraft rejected: no scenario selected");
  }

  for (const id of mappingIds) {
    if (!allowedMappings.has(id)) {
      return fail(
        "PRECONDITION_FAILED",
        `createDraft rejected: mappingId ${id} is not in the scenario reviewed allowlist`
      );
    }
  }

  const draft = {
    id: `draft-${Date.now()}`,
    text,
    mappingIds: [...mappingIds],
    createdAt: new Date().toISOString(),
    revision: expectedRevision + 1,
  };

  const next = writeAudit(state, "createDraft", { draftId: draft.id });
  next.draft = draft;
  next.approval = null;
  return ok(next, next.route.revision);
}

export function removeStagedMapping(
  state: DomainState,
  mappingId: string,
  expectedRevision: number
): Result<DomainState> {
  if (state.route.revision !== expectedRevision) {
    return fail("STALE_CONTEXT", "removeStagedMapping rejected: stale revision");
  }
  if (!state.route.stagedMappingIds.includes(mappingId)) {
    return fail("NOT_FOUND", "mapping not currently staged");
  }
  const next = writeAudit(state, "removeStagedMapping", { mappingId });
  next.route.stagedMappingIds = next.route.stagedMappingIds.filter(
    (id) => id !== mappingId
  );
  next.approval = null;
  return ok(next, next.route.revision);
}

export function approveDraft(
  state: DomainState,
  draftId: string,
  expectedRevision: number
): Result<DomainState> {
  if (!state.draft || state.draft.id !== draftId) {
    return fail("NOT_FOUND", "draft not found");
  }
  if (state.route.revision !== expectedRevision) {
    return fail("STALE_CONTEXT", "approveDraft rejected: stale revision");
  }
  const next = writeAudit(state, "approveDraft", { draftId });
  const snapshot = {
    draftId,
    approvedAt: new Date().toISOString(),
    validForRevision: next.route.revision,
    invalidated: false,
  };
  next.approval = snapshot;
  return ok(next, next.route.revision);
}

export function isApprovalValid(state: DomainState): boolean {
  if (!state.approval) return false;
  if (state.approval.invalidated) return false;
  return state.approval.validForRevision === state.route.revision;
}

/**
 * Resident-only export request.
 * The domain layer never calls browser clipboard/download APIs.
 */
export function residentRequestExport(
  state: DomainState
): Result<{ url: string }> {
  if (!state.approval || state.approval.invalidated) {
    return fail("PRECONDITION_FAILED", "no valid approval snapshot");
  }
  if (state.approval.validForRevision !== state.route.revision) {
    return fail("STALE_CONTEXT", "approval snapshot is stale");
  }
  if (!state.draft) {
    return fail("PRECONDITION_FAILED", "no draft to export");
  }
  if (state.approval.draftId !== state.draft.id) {
    return fail("PRECONDITION_FAILED", "approval draft mismatch");
  }
  return ok({ url: "blob:internal/export.txt" }, state.route.revision);
}

export function createGroundedRouteController(): GroundedRouteController {
  return {
    agentPort: {
      createInitialState,
      selectScenario,
      selectProfile,
      setActiveSegments,
      stageMapping: (state, mappingId, expectedRevision) =>
        stageMappingWithAllowedSet(
          state,
          mappingId,
          expectedRevision,
          mappingIdsForScenario(state.route.scenarioId)
        ),
      removeStagedMapping,
      createDraft: (state, text, mappingIds, expectedRevision) =>
        createDraftWithAllowedSet(
          state,
          text,
          mappingIds,
          expectedRevision,
          mappingIdsForScenario(state.route.scenarioId)
        ),
      isApprovalValid,
    },
    residentPort: {
      approveDraft,
      requestExport: residentRequestExport,
    },
  };
}

export const { agentPort, residentPort } = createGroundedRouteController();
