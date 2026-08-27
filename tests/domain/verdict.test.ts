/**
 * FDN-008 — deterministic route-impact verdict domain layer.
 * Strict TDD: written before implementation. Validates that selecting a
 * profile materially changes active route/concern state, that the verdict
 * derives only from fixture segment tags + profile constraints + reviewed
 * mappings, and that the draft prefill is editable-templated, not authored.
 */
import { describe, it, expect } from "vitest";
import {
  profileRouteSegmentIds,
  computeRouteVerdict,
  buildDraftPrefill,
  summarizeAgentActivity,
  PROFILE_ROUTE_SEGMENT_IDS,
} from "@/domain/verdict.ts";
import { createGroundedRouteController } from "@/domain/actions.ts";
import scenarios from "../../data/demo_scenarios.json";
import profiles from "../../data/route_profiles.json";
import mappings from "../../data/scenario_impact_mappings.json";
import segmentsGeoRaw from "../../data/route_segments.geojson?raw";
import type {
  RouteProfile,
  ScenarioImpactMapping,
  RouteSegmentFeature,
  DomainState,
} from "@/contracts/types.ts";

const scenario = scenarios[0];
const typedProfiles = profiles as RouteProfile[];
const typedMappings = mappings as ScenarioImpactMapping[];
const allSegments = (JSON.parse(segmentsGeoRaw) as { features: RouteSegmentFeature[] }).features;
const { humanPort, agentPort } = createGroundedRouteController();

function seedState(profileId: string): DomainState {
  let st = humanPort.createInitialState();
  st = (humanPort.selectScenario(st, scenario.id) as { success: true; data: DomainState }).data;
  st = (humanPort.selectProfile(st, profileId) as { success: true; data: DomainState }).data;
  return st;
}

describe("FDN-008 profile route rules (V2)", () => {
  it("every demo profile has a deterministic, non-empty, fixture-valid route segment set", () => {
    for (const p of typedProfiles) {
      const ids = profileRouteSegmentIds(p.id);
      expect(ids.length, `${p.id}`).toBeGreaterThan(0);
      for (const id of ids) {
        expect(allSegments.some((s) => s.properties.id === id)).toBe(true);
      }
    }
  });

  it("the three profiles have materially different route segment sets", () => {
    const w = new Set(profileRouteSegmentIds("profile-wheelchair"));
    const p = new Set(profileRouteSegmentIds("profile-parent"));
    const c = new Set(profileRouteSegmentIds("profile-cyclist"));
    expect(w).not.toEqual(p);
    expect(w).not.toEqual(c);
    expect(p).not.toEqual(c);
  });

  it("the wheelchair route avoids real stair segments and uses the mapped Saloma elevator approach", () => {
    const w = profileRouteSegmentIds("profile-wheelchair");
    expect(w).toContain("seg-saloma-elevator-bridge-approach");
    expect(w).not.toContain("seg-saloma-north-stairs");
    // No segment in the wheelchair route carries the `steps` tag.
    for (const id of w) {
      const seg = allSegments.find((s) => s.properties.id === id)!;
      expect(seg.properties.tags).not.toContain("steps");
    }
  });

  it("selectProfile mutates activeSegmentIds to the profile route (material, not cosmetic)", () => {
    const base = humanPort.createInitialState();
    const loaded = (humanPort.selectScenario(base, scenario.id) as { success: true; data: DomainState }).data;
    expect(loaded.route.activeSegmentIds).toEqual([]);
    const w = (humanPort.selectProfile(loaded, "profile-wheelchair") as { success: true; data: DomainState }).data;
    expect(w.route.activeSegmentIds).toEqual(PROFILE_ROUTE_SEGMENT_IDS["profile-wheelchair"]);
    const c = (humanPort.selectProfile(w, "profile-cyclist") as { success: true; data: DomainState }).data;
    expect(c.route.activeSegmentIds).toEqual(PROFILE_ROUTE_SEGMENT_IDS["profile-cyclist"]);
    expect(c.route.activeSegmentIds).not.toEqual(w.route.activeSegmentIds);
  });

  it("selectProfile for an unknown profile clears active segments rather than inventing a route", () => {
    const loaded = (humanPort.selectScenario(humanPort.createInitialState(), scenario.id) as { success: true; data: DomainState }).data;
    const st = (humanPort.selectProfile(loaded, "nonexistent-profile") as { success: true; data: DomainState }).data;
    expect(st.route.activeSegmentIds).toEqual([]);
  });
});

describe("FDN-008 route verdict (V3)", () => {
  it("names the profile, conditions, qualifier, and next action without raw mapping IDs", () => {
    const st = seedState("profile-wheelchair");
    const v = computeRouteVerdict({
      profileId: "profile-wheelchair",
      profiles: typedProfiles,
      activeSegmentIds: st.route.activeSegmentIds,
      segments: allSegments,
      mappings: typedMappings.filter((m) => m.scenarioId === scenario.id),
      scenarioTitle: scenario.title,
    });
    expect(v.profileId).toBe("profile-wheelchair");
    expect(v.profileLabel).toBe("Wheelchair user");
    expect(v.headline).toContain("Wheelchair user");
    expect(v.headline).toMatch(/condition/i);
    expect(v.qualifier).toMatch(/illustrative/i);
    expect(v.qualifier).toMatch(/field verification/i);
    expect(v.nextAction).toMatch(/draft|review|concern/i);
    expect(v.headline).not.toMatch(/map-\d/);
  });

  it("the verdict differs deterministically across the three profiles", () => {
    const mk = (pid: string) =>
      computeRouteVerdict({
        profileId: pid,
        profiles: typedProfiles,
        activeSegmentIds: profileRouteSegmentIds(pid),
        segments: allSegments,
        mappings: typedMappings.filter((m) => m.scenarioId === scenario.id),
        scenarioTitle: scenario.title,
      });
    const w = mk("profile-wheelchair");
    const p = mk("profile-parent");
    const c = mk("profile-cyclist");
    expect(w.conditionsToReview).not.toEqual(p.conditionsToReview);
    expect(w.conditionsToReview).not.toEqual(c.conditionsToReview);
    expect(p.conditionsToReview).not.toEqual(c.conditionsToReview);
    // Each profile surfaces at least one condition and a distinct plan-overlap count.
    expect(w.conditionsToReview.length).toBeGreaterThan(0);
    expect(p.conditionsToReview.length).toBeGreaterThan(0);
    expect(c.conditionsToReview.length).toBeGreaterThan(0);
  });

  it("conditions use plain segment names, not raw segment or mapping IDs", () => {
    const st = seedState("profile-parent");
    const v = computeRouteVerdict({
      profileId: "profile-parent",
      profiles: typedProfiles,
      activeSegmentIds: st.route.activeSegmentIds,
      segments: allSegments,
      mappings: typedMappings.filter((m) => m.scenarioId === scenario.id),
      scenarioTitle: scenario.title,
    });
    for (const cond of v.conditionsToReview) {
      expect(cond.segmentName).toBeTruthy();
      expect(allSegments.some((s) => s.properties.segmentName === cond.segmentName)).toBe(true);
      expect(cond.condition).not.toMatch(/seg-/);
      expect(cond.condition).not.toMatch(/map-\d/);
      expect(cond.qualifier).toMatch(/unverified|field verification|illustrative/i);
    }
  });

  it("the verdict never claims a confirmed impact, construction timeline, or accessibility fact", () => {
    const st = seedState("profile-cyclist");
    const v = computeRouteVerdict({
      profileId: "profile-cyclist",
      profiles: typedProfiles,
      activeSegmentIds: st.route.activeSegmentIds,
      segments: allSegments,
      mappings: typedMappings.filter((m) => m.scenarioId === scenario.id),
      scenarioTitle: scenario.title,
    });
    const blob = JSON.stringify(v);
    // The verdict must not assert any of these as positive facts. The
    // qualifier is allowed to negate them ("not a verified ...").
    expect(blob).not.toMatch(/is confirmed|will be built|is accessible|DBKL commits|confirmed project impact|verified accessible/i);
    expect(v.qualifier).toMatch(/not a verified/i);
  });
});

describe("FDN-008 draft prefill (V5)", () => {
  it("builds an editable structured draft input from profile + conditions + reviewed mappings", () => {
    const st = seedState("profile-wheelchair");
    const v = computeRouteVerdict({
      profileId: "profile-wheelchair",
      profiles: typedProfiles,
      activeSegmentIds: st.route.activeSegmentIds,
      segments: allSegments,
      mappings: typedMappings.filter((m) => m.scenarioId === scenario.id),
      scenarioTitle: scenario.title,
    });
    const prefill = buildDraftPrefill({
      verdict: v,
      mappings: typedMappings.filter((m) => m.scenarioId === scenario.id),
    });
    expect(prefill.userPosition.trim().length).toBeGreaterThan(0);
    expect(prefill.requestedChange.trim().length).toBeGreaterThan(0);
    expect(prefill.openQuestions.length).toBeGreaterThan(0);
    // Mapping ids must be reviewed mappings in the scenario allowlist.
    for (const id of prefill.mappingIds) {
      expect(typedMappings.some((m) => m.id === id && m.scenarioId === scenario.id)).toBe(true);
    }
    for (const id of prefill.sourceClaimIds) {
      expect(typedMappings.some((m) => m.sourceClaimIds.includes(id))).toBe(true);
    }
  });

  it("the prefill is a review template, not an invented personal experience or confirmed fact", () => {
    const st = seedState("profile-parent");
    const v = computeRouteVerdict({
      profileId: "profile-parent",
      profiles: typedProfiles,
      activeSegmentIds: st.route.activeSegmentIds,
      segments: allSegments,
      mappings: typedMappings.filter((m) => m.scenarioId === scenario.id),
      scenarioTitle: scenario.title,
    });
    const prefill = buildDraftPrefill({
      verdict: v,
      mappings: typedMappings.filter((m) => m.scenarioId === scenario.id),
    });
    const blob = JSON.stringify(prefill).toLowerCase();
    expect(blob).not.toMatch(/i walk this route every day|i take this route daily|my child walks/i);
    expect(blob).not.toMatch(/confirmed impact|verified accessible|construction timeline/i);
  });
});

describe("FDN-008 assistant activity summary (V6)", () => {
  it("summarizes agent-tool mutations as concise, human-readable activity, not raw audit rows", () => {
    let st = agentPort.createInitialState();
    st = (agentPort.selectScenario(st, scenario.id) as { success: true; data: DomainState }).data;
    st = (agentPort.selectProfile(st, "profile-wheelchair") as { success: true; data: DomainState }).data;
    const rev = st.route.revision;
    st = (agentPort.stageMapping(st, "map-01", rev) as { success: true; data: DomainState }).data;

    const activity = summarizeAgentActivity(st, typedMappings);
    expect(activity.length).toBeGreaterThan(0);
    const staged = activity.find((a) => a.kind === "staged");
    expect(staged).toBeDefined();
    expect(staged!.summary.length).toBeGreaterThan(0);
    expect(staged!.summary).not.toMatch(/evt-|revisionBefore|revisionAfter/);
    expect(staged!.mappingIds).toContain("map-01");
  });

  it("human-only state produces no assistant activity", () => {
    const st = seedState("profile-wheelchair");
    const activity = summarizeAgentActivity(st, typedMappings);
    expect(activity).toEqual([]);
  });
});
