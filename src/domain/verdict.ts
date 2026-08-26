/**
 * FDN-008 — deterministic route-impact verdict view-model.
 *
 * Pure, fixture-bound layer that derives a resident-facing verdict from:
 *   - the selected profile,
 *   - the profile-relevant active segment set (deterministic fixture metadata),
 *   - existing fixture segment tags,
 *   - reviewed scenario impact mappings.
 *
 * It never claims a confirmed project impact, construction timeline,
 * accessibility finding, or DBKL commitment. Every condition is labelled
 * illustrative/unverified and requires field verification. Raw mapping/segment
 * IDs are kept out of resident-facing verdict text; they remain available to
 * the audit/export metadata and advanced provenance disclosures.
 */
import type {
  RouteProfile,
  RouteSegmentFeature,
  ScenarioImpactMapping,
} from "@/contracts/types.ts";
import profilesData from "../../data/route_profiles.json";

const typedProfiles = profilesData as RouteProfile[];

/**
 * Deterministic profile → route segment ids, sourced from checked-in
 * project-authored fixture metadata. Explicitly illustrative.
 */
export const PROFILE_ROUTE_SEGMENT_IDS: Record<string, string[]> = Object.fromEntries(
  typedProfiles.map((p) => [p.id, [...p.routeSegmentIds]])
);

export function profileRouteSegmentIds(profileId: string): string[] {
  return [...(PROFILE_ROUTE_SEGMENT_IDS[profileId] ?? [])];
}

export interface ConditionRule {
  constraint: string;
  triggerTags: string[];
  excludeTags?: string[];
  describe: (segmentName: string) => string;
}

const CONDITION_RULES: Record<string, ConditionRule[]> = {
  "profile-wheelchair": [
    {
      constraint: "no-steps",
      triggerTags: ["steps"],
      describe: (n) => `Steps on ${n} — step-free access is unverified`,
    },
    {
      constraint: "ramp-or-elevator-required",
      triggerTags: ["slope"],
      describe: (n) => `Slope or gradient on ${n} — ramp or elevator access is unverified`,
    },
    {
      constraint: "ramp-or-elevator-required",
      triggerTags: ["bridge"],
      excludeTags: ["ramp", "elevator"],
      describe: (n) => `Bridge on ${n} — step-free crossing (ramp/elevator) is unverified`,
    },
  ],
  "profile-parent": [
    {
      constraint: "max-gradient-5-percent",
      triggerTags: ["slope"],
      describe: (n) => `Slope or gradient on ${n} — whether it exceeds 5% is unverified`,
    },
    {
      constraint: "signalised-crossing-preferred",
      triggerTags: ["crossing"],
      describe: (n) => `Crossing at ${n} — signalised protection is unverified`,
    },
    {
      constraint: "wide-sidewalk",
      triggerTags: ["steps"],
      describe: (n) => `Steps on ${n} — stroller access is unverified`,
    },
  ],
  "profile-cyclist": [
    {
      constraint: "cycleway-or-shared-path",
      triggerTags: ["footway"],
      excludeTags: ["cycleway", "shared-path"],
      describe: (n) => `${n} — no dedicated cycleway; shared-path or road interaction is unverified`,
    },
    {
      constraint: "no-dismount-required",
      triggerTags: ["steps"],
      describe: (n) => `Steps on ${n} — dismount is required, unverified`,
    },
    {
      constraint: "no-dismount-required",
      triggerTags: ["crossing"],
      describe: (n) => `Crossing at ${n} — cyclist right-of-way is unverified`,
    },
  ],
};

const CONDITION_QUALIFIER =
  "Illustrative and unverified — field verification required.";

const VERDICT_QUALIFIER =
  "Illustrative scenario only — not a verified project impact, construction timeline, accessibility finding, or DBKL commitment. Field verification is required.";

const NEXT_ACTION =
  "Review the conditions below and add the ones that matter to your draft.";

export interface ConditionToReview {
  segmentId: string;
  segmentName: string;
  constraint: string;
  condition: string;
  qualifier: string;
  mappingIds: string[];
}

export interface RouteVerdict {
  profileId: string;
  profileLabel: string;
  scenarioTitle: string;
  conditionsToReview: ConditionToReview[];
  planRelevantMappingIds: string[];
  headline: string;
  qualifier: string;
  nextAction: string;
}

export interface ComputeRouteVerdictInput {
  profileId: string;
  profiles: RouteProfile[];
  activeSegmentIds: string[];
  segments: RouteSegmentFeature[];
  mappings: ScenarioImpactMapping[];
  scenarioTitle: string;
}

function matches(rule: ConditionRule, tags: string[]): boolean {
  if (!rule.triggerTags.some((t) => tags.includes(t))) return false;
  if (rule.excludeTags && rule.excludeTags.some((t) => tags.includes(t))) {
    return false;
  }
  return true;
}

export function computeRouteVerdict(input: ComputeRouteVerdictInput): RouteVerdict {
  const profile = input.profiles.find((p) => p.id === input.profileId);
  const profileLabel = profile?.label ?? input.profileId;
  const rules = CONDITION_RULES[input.profileId] ?? [];

  const active = input.segments.filter((s) =>
    input.activeSegmentIds.includes(s.properties.id)
  );

  const conditions: ConditionToReview[] = [];
  const seen = new Set<string>();
  for (const seg of active) {
    const tags = seg.properties.tags;
    const segMappings = input.mappings
      .filter((m) => m.segmentIds.includes(seg.properties.id))
      .map((m) => m.id);
    for (const rule of rules) {
      if (!matches(rule, tags)) continue;
      const condition = rule.describe(seg.properties.segmentName);
      const key = `${seg.properties.id}|${condition}`;
      if (seen.has(key)) continue;
      seen.add(key);
      conditions.push({
        segmentId: seg.properties.id,
        segmentName: seg.properties.segmentName,
        constraint: rule.constraint,
        condition,
        qualifier: CONDITION_QUALIFIER,
        mappingIds: segMappings,
      });
    }
  }

  const activeSet = new Set(input.activeSegmentIds);
  const planRelevantMappingIds = input.mappings
    .filter((m) => m.segmentIds.some((id) => activeSet.has(id)))
    .map((m) => m.id);

  const n = conditions.length;
  const headline =
    n === 0
      ? `${profileLabel}: no route conditions flagged on this illustrative corridor.`
      : `${profileLabel}: ${n} route condition${n === 1 ? "" : "s"} to review on this illustrative corridor.`;

  return {
    profileId: input.profileId,
    profileLabel,
    scenarioTitle: input.scenarioTitle,
    conditionsToReview: conditions,
    planRelevantMappingIds,
    headline,
    qualifier: VERDICT_QUALIFIER,
    nextAction: NEXT_ACTION,
  };
}

export interface DraftPrefillInput {
  verdict: RouteVerdict;
  mappings: ScenarioImpactMapping[];
}

export interface DraftPrefill {
  mappingIds: string[];
  sourceClaimIds: string[];
  userPosition: string;
  requestedChange: string;
  openQuestions: string[];
}

export function buildDraftPrefill(input: DraftPrefillInput): DraftPrefill {
  const v = input.verdict;
  const profileLabelLower = v.profileLabel.toLowerCase();
  const n = v.conditionsToReview.length;

  const relevantMappings = input.mappings.filter((m) =>
    v.planRelevantMappingIds.includes(m.id)
  );
  const sourceClaimIds = Array.from(
    new Set(relevantMappings.flatMap((m) => m.sourceClaimIds))
  );

  const userPosition =
    n === 0
      ? `As a ${profileLabelLower}, I am reviewing how this illustrative corridor scenario might affect my route.`
      : `As a ${profileLabelLower}, I am reviewing how this illustrative corridor scenario might affect my route. ${n} condition${n === 1 ? "" : "s"} are flagged for review.`;

  const requestedChange =
    n === 0
      ? `Please clarify how the proposed plan might affect the ${profileLabelLower} route on this illustrative corridor.`
      : `Please clarify how the proposed plan addresses the ${n} route condition${n === 1 ? "" : "s"} flagged for ${profileLabelLower}, and confirm what is verified versus unverified.`;

  const openQuestions = [
    `What is the verification status of the ${n === 0 ? "flagged" : n} route condition${n === 1 ? "" : "s"} for ${profileLabelLower}?`,
    "Will the proposed plan commit to addressing these conditions, and on what timeline?",
  ];

  return {
    mappingIds: [...v.planRelevantMappingIds],
    sourceClaimIds,
    userPosition,
    requestedChange,
    openQuestions,
  };
}

export type AssistantActivityKind =
  | "scenario"
  | "profile"
  | "segments"
  | "staged"
  | "cleared"
  | "drafted";

export interface AssistantActivity {
  id: string;
  kind: AssistantActivityKind;
  summary: string;
  mappingIds: string[];
  timestamp: string;
}

export function summarizeAgentActivity(
  state: { auditLog: Array<{ eventId: string; timestamp: string; action: string; payload: Record<string, unknown>; actor: string }> },
  mappings: ScenarioImpactMapping[]
): AssistantActivity[] {
  const mappingById = new Map(mappings.map((m) => [m.id, m]));
  const profileById = new Map(typedProfiles.map((p) => [p.id, p.label]));
  const out: AssistantActivity[] = [];
  for (const evt of state.auditLog) {
    if (evt.actor !== "agent-tool") continue;
    const p = evt.payload;
    switch (evt.action) {
      case "selectScenario":
        out.push({
          id: evt.eventId,
          kind: "scenario",
          summary: "Assistant loaded the illustrative corridor scenario.",
          mappingIds: [],
          timestamp: evt.timestamp,
        });
        break;
      case "selectProfile": {
        const label = profileById.get(String(p.profileId ?? "")) ?? "a profile";
        out.push({
          id: evt.eventId,
          kind: "profile",
          summary: `Assistant selected the ${label} profile.`,
          mappingIds: [],
          timestamp: evt.timestamp,
        });
        break;
      }
      case "setActiveSegments":
        out.push({
          id: evt.eventId,
          kind: "segments",
          summary: "Assistant changed the active route segment set.",
          mappingIds: [],
          timestamp: evt.timestamp,
        });
        break;
      case "stageMapping": {
        const m = mappingById.get(String(p.mappingId ?? ""));
        const count = m?.segmentIds.length ?? 0;
        out.push({
          id: evt.eventId,
          kind: "staged",
          summary: `Assistant staged a possible plan impact covering ${count} route segment${count === 1 ? "" : "s"}.`,
          mappingIds: [String(p.mappingId ?? "")],
          timestamp: evt.timestamp,
        });
        break;
      }
      case "removeStagedMapping":
        out.push({
          id: evt.eventId,
          kind: "cleared",
          summary: "Assistant removed a staged plan impact overlay.",
          mappingIds: [String(p.mappingId ?? "")],
          timestamp: evt.timestamp,
        });
        break;
      case "clearStagedMappings": {
        const cleared = Array.isArray(p.cleared) ? (p.cleared as string[]) : [];
        out.push({
          id: evt.eventId,
          kind: "cleared",
          summary: `Assistant cleared ${cleared.length} staged plan impact overlay${cleared.length === 1 ? "" : "s"}.`,
          mappingIds: cleared,
          timestamp: evt.timestamp,
        });
        break;
      }
      case "createDraft":
      case "createStructuredDraft":
        out.push({
          id: evt.eventId,
          kind: "drafted",
          summary: "Assistant prepared a draft comment for your review.",
          mappingIds: [],
          timestamp: evt.timestamp,
        });
        break;
      default:
        break;
    }
  }
  return out;
}
