/**
 * Grounded Route — deterministic domain contracts.
 * Immutable SourceClaim vs reviewed ScenarioImpactMapping vs unknown.
 */

export interface GeoJsonFeature {
  type: "Feature";
  geometry: {
    type: "LineString" | "Point" | "Polygon";
    coordinates: number[][] | number[];
  };
  properties: Record<string, unknown>;
}

export interface GeoJsonCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

export type SourceClaimCategory =
  | "transport-policy"
  | "land-use-policy"
  | "infrastructure-description"
  | "environmental-policy";

export interface SourceClaim {
  id: string;
  category: SourceClaimCategory;
  document: string;
  documentUrl: string;
  page: number;
  boundaryNote: string;

  retrievedDate: string; // ISO date
  // Explicit: no segment-impact fields here
}

export type MappingType = "curated-interpretation";
export type CertaintyLevel = "high" | "medium" | "low" | "unknown";

export interface ScenarioImpactMapping {
  id: string;
  mappingType: MappingType;
  scenarioId: string;
  segmentIds: string[];
  sourceClaimIds: string[];
  rationale: string;
  uncertainty: string;
  certaintyLevel: CertaintyLevel;
  reviewer: string;
  reviewDate: string; // ISO date
}

export interface RouteProfile {
  id: string;
  label: string;
  description: string;
  constraints: string[];
}

export interface PlaceFeature extends GeoJsonFeature {
  properties: {
    id: string;
    name: string;
    placeType: "origin" | "destination" | "transit" | "landmark";
  };
}

export interface RouteSegmentFeature extends GeoJsonFeature {
  properties: {
    id: string;
    segmentName: string;
    tags: string[]; // e.g. ["footway", "steps", "crossing"]
    lengthMeters: number;
  };
}

export interface DemoScenario {
  id: string;
  title: string;
  description: string;
  areaBoundsDescription: string;
  disclaimer: string;
  profileIds: string[];
  originPlaceId: string;
  destinationPlaceId: string;
  defaultSegmentIds: string[];
}

export interface FixtureManifest {
  fixtureVersion: string;
  scenarioId: string;
  areaName: string;
  reviewer: string;
  reviewDate: string;
  sourceClaimIds: string[];
  segmentIds: string[];
  mappingIds: string[];
  profileIds: string[];
  placeIds: string[];
  validationCommand: string;
  knownUncertainties: string[];
  publicReleaseStatus: "excluded" | "pending" | "verified";
}

/* ---------- Domain state / actions ---------- */

export interface RouteState {
  scenarioId: string | null;
  profileId: string | null;
  activeSegmentIds: string[];
  stagedMappingIds: string[];
  revision: number;
}

/* ---------- Structured draft statements (FDN-003) ---------- */

export type DraftStatementClass =
  | "source-reference"
  | "curated-interpretation"
  | "resident-position"
  | "open-question";

export interface DraftStatementBase {
  id: string;
  statementClass: DraftStatementClass;
  text: string;
}

export interface SourceReferenceStatement extends DraftStatementBase {
  statementClass: "source-reference";
  sourceClaimId: string;
  document: string;
  page: number;
  documentUrl: string;
  retrievedDate: string;
  boundaryNote: string;
}

export interface CuratedInterpretationStatement extends DraftStatementBase {
  statementClass: "curated-interpretation";
  mappingId: string;
  rationale: string;
  uncertainty: string;
}

export interface ResidentPositionStatement extends DraftStatementBase {
  statementClass: "resident-position";
  requestedChange: string;
}

export interface OpenQuestionStatement extends DraftStatementBase {
  statementClass: "open-question";
}

export type DraftStatement =
  | SourceReferenceStatement
  | CuratedInterpretationStatement
  | ResidentPositionStatement
  | OpenQuestionStatement;

export interface StructuredDraftInput {
  mappingIds: string[];
  sourceClaimIds: string[];
  userPosition: string;
  requestedChange: string;
  openQuestions: string[];
}

export interface DraftComment {
  id: string;
  text: string;
  mappingIds: string[];
  statements: DraftStatement[];
  createdAt: string;
  revision: number;
}

export interface ApprovalSnapshot {
  draftId: string;
  approvedAt: string;
  validForRevision: number;
  invalidated: boolean;
}

export interface DomainState {
  route: RouteState;
  draft: DraftComment | null;
  approval: ApprovalSnapshot | null;
  auditLog: AuditEvent[];
}

export type AuditActor = "human" | "agent-tool";

export interface AuditEvent {
  eventId: string;
  timestamp: string;
  action: string;
  payload: Record<string, unknown>;
  revisionBefore: number;
  revisionAfter: number;
  actor: AuditActor;
}

/* ---------- Structured results ---------- */

export type ErrorCode =
  | "STALE_CONTEXT"
  | "PRECONDITION_FAILED"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "EXPORT_BLOCKED";

export interface SuccessResult<T> {
  success: true;
  data: T;
  revision: number;
}

export interface FailureResult {
  success: false;
  errorCode: ErrorCode;
  message: string;
}

export type Result<T> = SuccessResult<T> | FailureResult;

/* ---------- Capability-separated ports ---------- */

/**
 * Agent / WebMCP-facing port.
 * Exposes only read and reversible actions. No approval, export, copy, or download.
 */
export interface AgentPort {
  createInitialState: () => DomainState;
  selectScenario: (state: DomainState, scenarioId: string) => Result<DomainState>;
  selectProfile: (state: DomainState, profileId: string) => Result<DomainState>;
  setActiveSegments: (
    state: DomainState,
    segmentIds: string[],
    expectedRevision: number
  ) => Result<DomainState>;
  stageMapping: (
    state: DomainState,
    mappingId: string,
    expectedRevision: number
  ) => Result<DomainState>;
  removeStagedMapping: (
    state: DomainState,
    mappingId: string,
    expectedRevision: number
  ) => Result<DomainState>;
  createDraft: (
    state: DomainState,
    text: string,
    mappingIds: string[],
    expectedRevision: number
  ) => Result<DomainState>;
  createStructuredDraft: (
    state: DomainState,
    input: StructuredDraftInput,
    expectedRevision: number
  ) => Result<DomainState>;
  clearStagedMappings: (
    state: DomainState,
    expectedRevision: number
  ) => Result<DomainState>;
  isApprovalValid: (state: DomainState) => boolean;
}

/**
 * Human-UI-facing port.
 * Same reversible actions as AgentPort but audited as human.
 * No approval or export capability.
 */
export interface HumanPort {
  createInitialState: () => DomainState;
  selectScenario: (state: DomainState, scenarioId: string) => Result<DomainState>;
  selectProfile: (state: DomainState, profileId: string) => Result<DomainState>;
  setActiveSegments: (
    state: DomainState,
    segmentIds: string[],
    expectedRevision: number
  ) => Result<DomainState>;
  stageMapping: (
    state: DomainState,
    mappingId: string,
    expectedRevision: number
  ) => Result<DomainState>;
  removeStagedMapping: (
    state: DomainState,
    mappingId: string,
    expectedRevision: number
  ) => Result<DomainState>;
  createDraft: (
    state: DomainState,
    text: string,
    mappingIds: string[],
    expectedRevision: number
  ) => Result<DomainState>;
  createStructuredDraft: (
    state: DomainState,
    input: StructuredDraftInput,
    expectedRevision: number
  ) => Result<DomainState>;
  clearStagedMappings: (
    state: DomainState,
    expectedRevision: number
  ) => Result<DomainState>;
  isApprovalValid: (state: DomainState) => boolean;
}

/**
 * Resident-UI-facing port.
 * Owns explicit current-revision review transition and local export payload.
 */
export interface ResidentPort {
  approveDraft: (
    state: DomainState,
    draftId: string,
    expectedRevision: number
  ) => Result<DomainState>;
  requestExport: (state: DomainState) => Result<{ url: string }>;
}
