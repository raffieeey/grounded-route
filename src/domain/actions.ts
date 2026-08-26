import type {
  DomainState,
  AuditEvent,
  AuditActor,
  Result,
  ErrorCode,
  ScenarioImpactMapping,
  SourceClaim,
  DraftStatement,
  StructuredDraftInput,
  AgentPort,
  HumanPort,
  ResidentPort,
} from "@/contracts/types.ts";

import scenarioImpactMappings from "../../data/scenario_impact_mappings.json";
import sourceClaimsData from "../../data/source_claims.json";

interface GroundedRouteController {
  agentPort: AgentPort;
  humanPort: HumanPort;
  residentPort: ResidentPort;
}

let _eventCounter = 0;
let _stmtCounter = 0;
function nextEventId(): string {
  _eventCounter += 1;
  return `evt-${Date.now()}-${_eventCounter}`;
}

function nextStmtId(): string {
  _stmtCounter += 1;
  return `stmt-${Date.now()}-${_stmtCounter}`;
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
  payload: Record<string, unknown>,
  actor: AuditActor
): DomainState {
  const nextRevision = state.route.revision + 1;
  const event: AuditEvent = {
    eventId: nextEventId(),
    timestamp: new Date().toISOString(),
    action,
    payload,
    revisionBefore: state.route.revision,
    revisionAfter: nextRevision,
    actor,
  };
  return {
    ...state,
    route: { ...state.route, revision: nextRevision },
    auditLog: [...state.auditLog, event],
  };
}

const trustedMappings: readonly ScenarioImpactMapping[] =
  scenarioImpactMappings as readonly ScenarioImpactMapping[];
const trustedSourceClaims: readonly SourceClaim[] =
  sourceClaimsData as readonly SourceClaim[];

const mappingById: ReadonlyMap<string, ScenarioImpactMapping> = new Map(
  trustedMappings.map((m) => [m.id, m])
);
const sourceClaimById: ReadonlyMap<string, SourceClaim> = new Map(
  trustedSourceClaims.map((c) => [c.id, c])
);

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

function buildScenarioSourceClaimIndex(
  mappings: readonly ScenarioImpactMapping[]
): ReadonlyMap<string, ReadonlySet<string>> {
  const scenarioMap = new Map<string, Set<string>>();

  for (const mapping of mappings) {
    let set = scenarioMap.get(mapping.scenarioId);
    if (!set) {
      set = new Set<string>();
      scenarioMap.set(mapping.scenarioId, set);
    }
    for (const claimId of mapping.sourceClaimIds) {
      set.add(claimId);
    }
  }

  const trustedIndex = new Map<string, ReadonlySet<string>>();
  for (const [scenarioId, ids] of scenarioMap.entries()) {
    trustedIndex.set(scenarioId, ids);
  }

  return trustedIndex;
}

const trustedMappingIndex: ReadonlyMap<string, ReadonlySet<string>> =
  buildScenarioMappingIndex(trustedMappings);
const trustedSourceClaimIndex: ReadonlyMap<string, ReadonlySet<string>> =
  buildScenarioSourceClaimIndex(trustedMappings);

const EMPTY_MAPPING_IDS: ReadonlySet<string> = new Set<string>();

function mappingIdsForScenario(
  scenarioId: string | null
): ReadonlySet<string> {
  if (!scenarioId) return EMPTY_MAPPING_IDS;
  return trustedMappingIndex.get(scenarioId) ?? EMPTY_MAPPING_IDS;
}

function sourceClaimIdsForScenario(
  scenarioId: string | null
): ReadonlySet<string> {
  if (!scenarioId) return EMPTY_MAPPING_IDS;
  return trustedSourceClaimIndex.get(scenarioId) ?? EMPTY_MAPPING_IDS;
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
  scenarioId: string,
  actor: AuditActor = "human"
): Result<DomainState> {
  if (!scenarioId) {
    return fail("INVALID_INPUT", "scenarioId required");
  }
  const next = writeAudit(state, "selectScenario", { scenarioId }, actor);
  next.route.scenarioId = scenarioId;
  next.route.stagedMappingIds = [];
  next.approval = null;
  return ok(next, next.route.revision);
}

export function selectProfile(
  state: DomainState,
  profileId: string,
  actor: AuditActor = "human"
): Result<DomainState> {
  if (!profileId) {
    return fail("INVALID_INPUT", "profileId required");
  }
  const next = writeAudit(state, "selectProfile", { profileId }, actor);
  next.route.profileId = profileId;
  next.approval = null;
  return ok(next, next.route.revision);
}

export function setActiveSegments(
  state: DomainState,
  segmentIds: string[],
  expectedRevision: number,
  actor: AuditActor = "human"
): Result<DomainState> {
  if (state.route.revision !== expectedRevision) {
    return fail("STALE_CONTEXT", "segment mutation rejected: stale revision");
  }
  const next = writeAudit(state, "setActiveSegments", { segmentIds }, actor);
  next.route.activeSegmentIds = [...segmentIds];
  next.approval = null;
  return ok(next, next.route.revision);
}

function stageMappingWithAllowedSet(
  state: DomainState,
  mappingId: string,
  expectedRevision: number,
  allowedMappings: ReadonlySet<string>,
  actor: AuditActor
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
  }, actor);
  next.route.stagedMappingIds = [...next.route.stagedMappingIds, mappingId];
  next.approval = null;
  return ok(next, next.route.revision);
}

function createDraftWithAllowedSet(
  state: DomainState,
  text: string,
  mappingIds: string[],
  expectedRevision: number,
  allowedMappings: ReadonlySet<string>,
  actor: AuditActor
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
    statements: [] as DraftStatement[],
    createdAt: new Date().toISOString(),
    revision: expectedRevision + 1,
  };

  const next = writeAudit(state, "createDraft", { draftId: draft.id }, actor);
  next.draft = draft;
  next.approval = null;
  return ok(next, next.route.revision);
}

function assembleStructuredText(
  mappingIds: string[],
  sourceClaimIds: string[],
  userPosition: string,
  requestedChange: string,
  openQuestions: string[]
): string {
  const lines: string[] = [];
  lines.push(`Resident position: ${userPosition}`);
  lines.push(`Requested change: ${requestedChange}`);
  for (const mappingId of mappingIds) {
    const mapping = mappingById.get(mappingId);
    if (mapping) {
      lines.push(
        `Curated interpretation (${mappingId}): ${mapping.rationale} — uncertainty: ${mapping.uncertainty}`
      );
    }
  }
  for (const claimId of sourceClaimIds) {
    const claim = sourceClaimById.get(claimId);
    if (claim) {
      lines.push(`Source reference (${claimId}): ${claim.document} page ${claim.page}`);
    }
  }
  for (const question of openQuestions) {
    lines.push(`Open question: ${question}`);
  }
  return lines.join("\n\n");
}

function createStructuredDraftWithAllowedSet(
  state: DomainState,
  input: StructuredDraftInput,
  expectedRevision: number,
  allowedMappings: ReadonlySet<string>,
  allowedSourceClaims: ReadonlySet<string>,
  actor: AuditActor
): Result<DomainState> {
  if (state.route.revision !== expectedRevision) {
    return fail("STALE_CONTEXT", "createStructuredDraft rejected: stale revision");
  }
  if (state.route.scenarioId == null) {
    return fail("PRECONDITION_FAILED", "createStructuredDraft rejected: no scenario selected");
  }
  if (!input.userPosition || !input.userPosition.trim()) {
    return fail("INVALID_INPUT", "createStructuredDraft rejected: userPosition required");
  }
  if (!input.requestedChange || !input.requestedChange.trim()) {
    return fail("INVALID_INPUT", "createStructuredDraft rejected: requestedChange required");
  }
  for (const id of input.mappingIds) {
    if (!allowedMappings.has(id)) {
      return fail(
        "PRECONDITION_FAILED",
        `createStructuredDraft rejected: mappingId ${id} is not in the scenario reviewed allowlist`
      );
    }
  }
  for (const id of input.sourceClaimIds) {
    if (!allowedSourceClaims.has(id)) {
      return fail(
        "PRECONDITION_FAILED",
        `createStructuredDraft rejected: sourceClaimId ${id} is not in the scenario reviewed allowlist`
      );
    }
  }

  const statements: DraftStatement[] = [];
  for (const mappingId of input.mappingIds) {
    const mapping = mappingById.get(mappingId);
    if (mapping) {
      statements.push({
        id: nextStmtId(),
        statementClass: "curated-interpretation",
        text: mapping.rationale,
        mappingId,
        rationale: mapping.rationale,
        uncertainty: mapping.uncertainty,
      });
    }
  }
  for (const sourceClaimId of input.sourceClaimIds) {
    const claim = sourceClaimById.get(sourceClaimId);
    if (claim) {
      statements.push({
        id: nextStmtId(),
        statementClass: "source-reference",
        text: `Official source reference: ${claim.document}, page ${claim.page}`,
        sourceClaimId,
        document: claim.document,
        page: claim.page,
        documentUrl: claim.documentUrl,
        retrievedDate: claim.retrievedDate,
        boundaryNote: claim.boundaryNote,
      });
    }
  }
  statements.push({
    id: nextStmtId(),
    statementClass: "resident-position",
    text: input.userPosition,
    requestedChange: input.requestedChange,
  });
  for (const question of input.openQuestions) {
    statements.push({
      id: nextStmtId(),
      statementClass: "open-question",
      text: question,
    });
  }

  const text = assembleStructuredText(
    input.mappingIds,
    input.sourceClaimIds,
    input.userPosition,
    input.requestedChange,
    input.openQuestions
  );

  const draft = {
    id: `draft-${Date.now()}`,
    text,
    mappingIds: [...input.mappingIds],
    statements,
    createdAt: new Date().toISOString(),
    revision: expectedRevision + 1,
  };

  const next = writeAudit(state, "createStructuredDraft", { draftId: draft.id }, actor);
  next.draft = draft;
  next.approval = null;
  return ok(next, next.route.revision);
}

export function removeStagedMapping(
  state: DomainState,
  mappingId: string,
  expectedRevision: number,
  actor: AuditActor = "human"
): Result<DomainState> {
  if (state.route.revision !== expectedRevision) {
    return fail("STALE_CONTEXT", "removeStagedMapping rejected: stale revision");
  }
  if (!state.route.stagedMappingIds.includes(mappingId)) {
    return fail("NOT_FOUND", "mapping not currently staged");
  }
  const next = writeAudit(state, "removeStagedMapping", { mappingId }, actor);
  next.route.stagedMappingIds = next.route.stagedMappingIds.filter(
    (id) => id !== mappingId
  );
  next.approval = null;
  return ok(next, next.route.revision);
}

function clearStagedMappingsWithActor(
  state: DomainState,
  expectedRevision: number,
  actor: AuditActor
): Result<DomainState> {
  if (state.route.revision !== expectedRevision) {
    return fail("STALE_CONTEXT", "clearStagedMappings rejected: stale revision");
  }
  if (state.route.stagedMappingIds.length === 0) {
    return fail("PRECONDITION_FAILED", "clearStagedMappings rejected: nothing staged");
  }
  const cleared = [...state.route.stagedMappingIds];
  const next = writeAudit(state, "clearStagedMappings", { cleared }, actor);
  next.route.stagedMappingIds = [];
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
  const next = writeAudit(state, "approveDraft", { draftId }, "human");
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
      selectScenario: (state, scenarioId) =>
        selectScenario(state, scenarioId, "agent-tool"),
      selectProfile: (state, profileId) =>
        selectProfile(state, profileId, "agent-tool"),
      setActiveSegments: (state, segmentIds, expectedRevision) =>
        setActiveSegments(state, segmentIds, expectedRevision, "agent-tool"),
      stageMapping: (state, mappingId, expectedRevision) =>
        stageMappingWithAllowedSet(
          state,
          mappingId,
          expectedRevision,
          mappingIdsForScenario(state.route.scenarioId),
          "agent-tool"
        ),
      removeStagedMapping: (state, mappingId, expectedRevision) =>
        removeStagedMapping(state, mappingId, expectedRevision, "agent-tool"),
      createDraft: (state, text, mappingIds, expectedRevision) =>
        createDraftWithAllowedSet(
          state,
          text,
          mappingIds,
          expectedRevision,
          mappingIdsForScenario(state.route.scenarioId),
          "agent-tool"
        ),
      createStructuredDraft: (state, input, expectedRevision) =>
        createStructuredDraftWithAllowedSet(
          state,
          input,
          expectedRevision,
          mappingIdsForScenario(state.route.scenarioId),
          sourceClaimIdsForScenario(state.route.scenarioId),
          "agent-tool"
        ),
      clearStagedMappings: (state, expectedRevision) =>
        clearStagedMappingsWithActor(state, expectedRevision, "agent-tool"),
      isApprovalValid,
    },
    humanPort: {
      createInitialState,
      selectScenario: (state, scenarioId) =>
        selectScenario(state, scenarioId, "human"),
      selectProfile: (state, profileId) =>
        selectProfile(state, profileId, "human"),
      setActiveSegments: (state, segmentIds, expectedRevision) =>
        setActiveSegments(state, segmentIds, expectedRevision, "human"),
      stageMapping: (state, mappingId, expectedRevision) =>
        stageMappingWithAllowedSet(
          state,
          mappingId,
          expectedRevision,
          mappingIdsForScenario(state.route.scenarioId),
          "human"
        ),
      removeStagedMapping: (state, mappingId, expectedRevision) =>
        removeStagedMapping(state, mappingId, expectedRevision, "human"),
      createDraft: (state, text, mappingIds, expectedRevision) =>
        createDraftWithAllowedSet(
          state,
          text,
          mappingIds,
          expectedRevision,
          mappingIdsForScenario(state.route.scenarioId),
          "human"
        ),
      createStructuredDraft: (state, input, expectedRevision) =>
        createStructuredDraftWithAllowedSet(
          state,
          input,
          expectedRevision,
          mappingIdsForScenario(state.route.scenarioId),
          sourceClaimIdsForScenario(state.route.scenarioId),
          "human"
        ),
      clearStagedMappings: (state, expectedRevision) =>
        clearStagedMappingsWithActor(state, expectedRevision, "human"),
      isApprovalValid,
    },
    residentPort: {
      approveDraft,
      requestExport: residentRequestExport,
    },
  };
}

export const { agentPort, humanPort, residentPort } = createGroundedRouteController();
