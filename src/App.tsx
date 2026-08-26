import { buildExportPayload } from "@/ui/export-payload.ts";
import { useEffect, useMemo, useCallback, useState } from "react";
import "./styles/main.css";
import scenarios from "../data/demo_scenarios.json";
import profiles from "../data/route_profiles.json";
import sourceClaims from "../data/source_claims.json";
import mappings from "../data/scenario_impact_mappings.json";
import segmentsGeoRaw from "../data/route_segments.geojson?raw";

import { useWorkspaceBridge } from "@/ui/useWorkspaceBridge.ts";
import { createGroundedRouteController } from "@/domain/actions.ts";
import { registerWebMcpTools } from "@/webmcp/index.ts";
import {
  computeRouteVerdict,
  buildDraftPrefill,
  summarizeAgentActivity,
  type ConditionToReview,
} from "@/domain/verdict.ts";
import type { RouteSegmentFeature, DemoScenario, RouteProfile, SourceClaim, ScenarioImpactMapping } from "@/contracts/types.ts";

import WorkspaceControls from "@/ui/WorkspaceControls.tsx";
import RouteSegmentList from "@/ui/RouteSegmentList.tsx";
import EvidenceBoard from "@/ui/EvidenceBoard.tsx";
import DraftReviewPanel from "@/ui/DraftReviewPanel.tsx";
import AuditConsentStrip from "@/ui/AuditConsentStrip.tsx";
import LocalRouteMap from "@/ui/LocalRouteMap.tsx";
import VerdictCard from "@/ui/VerdictCard.tsx";
import ConditionsShortlist from "@/ui/ConditionsShortlist.tsx";
import AssistantActivity from "@/ui/AssistantActivity.tsx";

const { humanPort, residentPort } = createGroundedRouteController();

const scenario = scenarios[0] as DemoScenario;
const typedProfiles = profiles as RouteProfile[];
const typedSourceClaims = sourceClaims as SourceClaim[];
const typedMappings = mappings as ScenarioImpactMapping[];
const allSegments = (JSON.parse(segmentsGeoRaw) as { features: RouteSegmentFeature[] }).features;

export default function App() {
  const { state, bridge } = useWorkspaceBridge(humanPort.createInitialState());
  const [started, setStarted] = useState(false);
  const [showFullSegments, setShowFullSegments] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);

  useEffect(() => {
    const mc = (document as unknown as Record<string, unknown>).modelContext;
    if (!mc) return;
    const controller = new AbortController();
    let cancelled = false;
    const task = setTimeout(() => {
      if (cancelled) return;
      void registerWebMcpTools(
        document as unknown as Parameters<typeof registerWebMcpTools>[0],
        bridge,
        { signal: controller.signal }
      );
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(task);
      controller.abort();
    };
  }, [bridge]);

  const scenarioMappings = useMemo(
    () => typedMappings.filter((m) => m.scenarioId === scenario.id),
    []
  );

  const handleStart = useCallback(() => {
    const next = humanPort.selectScenario(state, scenario.id);
    if (next.success) {
      bridge.replaceState(next.data, "Illustrative corridor loaded");
      setStarted(true);
    }
  }, [state, bridge]);

  const handleClear = useCallback(() => {
    bridge.replaceState(humanPort.createInitialState(), "Session cleared");
    setStarted(false);
    setShowFullSegments(false);
    setShowEvidence(false);
  }, [bridge]);

  const handleSelectProfile = useCallback(
    (profileId: string) => {
      const next = humanPort.selectProfile(state, profileId);
      if (next.success) {
        bridge.replaceState(next.data, `Profile selected: ${profileId}`);
      }
    },
    [state, bridge]
  );

  const handleStageMapping = useCallback(
    (mappingId: string) => {
      const next = humanPort.stageMapping(state, mappingId, state.route.revision);
      if (next.success) {
        bridge.replaceState(next.data, `Staged ${mappingId}`);
      }
    },
    [state, bridge]
  );

  const handleClearMapping = useCallback(
    (mappingId: string) => {
      const next = humanPort.removeStagedMapping(state, mappingId, state.route.revision);
      if (next.success) {
        bridge.replaceState(next.data, `Cleared ${mappingId}`);
      }
    },
    [state, bridge]
  );

  const handleAddConcern = useCallback(
    (condition: ConditionToReview) => {
      let current = state;
      let rev = state.route.revision;
      for (const mappingId of condition.mappingIds) {
        if (current.route.stagedMappingIds.includes(mappingId)) continue;
        const next = humanPort.stageMapping(current, mappingId, rev);
        if (next.success) {
          current = next.data;
          rev = next.revision;
        }
      }
      if (current !== state) {
        bridge.replaceState(current, `Added concern: ${condition.segmentName}`);
      }
    },
    [state, bridge]
  );

  const handleRemoveConcern = useCallback(
    (condition: ConditionToReview) => {
      let current = state;
      let rev = state.route.revision;
      for (const mappingId of condition.mappingIds) {
        if (!current.route.stagedMappingIds.includes(mappingId)) continue;
        const next = humanPort.removeStagedMapping(current, mappingId, rev);
        if (next.success) {
          current = next.data;
          rev = next.revision;
        }
      }
      if (current !== state) {
        bridge.replaceState(current, `Removed concern: ${condition.segmentName}`);
      }
    },
    [state, bridge]
  );

  const handleReviewConditions = useCallback(() => {
    const el = document.getElementById("conditions-shortlist");
    if (!el) return;
    el.scrollIntoView({ block: "start" });
    el.focus({ preventScroll: true });
  }, []);

  const handleCreateDraft = useCallback(
    (position: string, change: string, questions: string) => {
      const openQuestions = questions
        .split(",")
        .map((q) => q.trim())
        .filter((q) => q.length > 0);
      const stagedIds = state.route.stagedMappingIds;
      const activeSet = new Set(state.route.activeSegmentIds);
      const planRelevant = scenarioMappings
        .filter((m) => m.segmentIds.some((id) => activeSet.has(id)))
        .map((m) => m.id);
      const mappingIds = stagedIds.length > 0 ? stagedIds : planRelevant;
      const sourceClaimIds = Array.from(
        new Set(
          mappingIds
            .map((id) => scenarioMappings.find((m) => m.id === id))
            .filter(Boolean)
            .flatMap((m) => m!.sourceClaimIds)
        )
      );
      const next = humanPort.createStructuredDraft(
        state,
        { mappingIds, sourceClaimIds, userPosition: position, requestedChange: change, openQuestions },
        state.route.revision
      );
      if (next.success) {
        bridge.replaceState(next.data, "Draft prepared");
      }
    },
    [state, bridge, scenarioMappings]
  );

  const handleApprove = useCallback(() => {
    if (!state.draft) return;
    const next = residentPort.approveDraft(state, state.draft.id, state.route.revision);
    if (next.success) {
      bridge.replaceState(next.data, "Draft approved");
    }
  }, [state, bridge]);

  const handleExport = useCallback(() => {
    const result = residentPort.requestExport(state);
    if (result.success) {
      const payload = buildExportPayload(state);
      const blob = new Blob(
        [JSON.stringify(payload, null, 2)],
        { type: "text/plain" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "grounded-route-comment.txt";
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [state]);

  const activeSegmentIds = state.route.profileId && state.route.activeSegmentIds.length > 0
    ? state.route.activeSegmentIds
    : scenario.defaultSegmentIds;

  const orderedSegments = useMemo(() => {
    const order = activeSegmentIds;
    return order
      .map((id) => allSegments.find((s) => s.properties.id === id))
      .filter(Boolean) as RouteSegmentFeature[];
  }, [activeSegmentIds]);

  const verdict = useMemo(() => {
    if (!state.route.profileId || state.route.activeSegmentIds.length === 0) return null;
    return computeRouteVerdict({
      profileId: state.route.profileId,
      profiles: typedProfiles,
      activeSegmentIds: state.route.activeSegmentIds,
      segments: allSegments,
      mappings: scenarioMappings,
      scenarioTitle: scenario.title,
    });
  }, [state.route.profileId, state.route.activeSegmentIds, scenarioMappings]);

  const prefill = useMemo(
    () => (verdict ? buildDraftPrefill({ verdict, mappings: scenarioMappings }) : null),
    [verdict, scenarioMappings]
  );

  const assistantActivity = useMemo(
    () => summarizeAgentActivity(state, scenarioMappings),
    [state, scenarioMappings]
  );

  return (
    <div>
      <div
        id="workspace-announcer"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      <header>
        <h1>Will a city plan change your route?</h1>
        <p className="value-prop">
          Get a 30-second, source-linked route-impact check for one Kuala Lumpur
          corridor — and turn it into an editable civic comment you control.
        </p>
      </header>

      <section className="disclaimer" role="note">
        {scenario.disclaimer}
      </section>

      <WorkspaceControls
        started={started}
        activeProfileId={state.route.profileId}
        profiles={typedProfiles}
        onStart={handleStart}
        onClear={handleClear}
        onSelectProfile={handleSelectProfile}
      />

      {started && (
        <div role="region" aria-label="Workspace">
          <h2 className="corridor-title">
            Illustrative corridor: {scenario.title.replace(/ — Illustrative Demo$/, "")}
          </h2>

          <AssistantActivity activity={assistantActivity} />

          {verdict && (
            <>
              <VerdictCard verdict={verdict} onReviewConditions={handleReviewConditions} />

              <div className="workspace-grid">
                <div className="workspace-main">
                  <LocalRouteMap
                    defaultSegmentIds={activeSegmentIds}
                    stagedMappingIds={state.route.stagedMappingIds}
                    mappings={scenarioMappings}
                  />

                  <ConditionsShortlist
                    conditions={verdict.conditionsToReview}
                    mappings={scenarioMappings}
                    stagedMappingIds={state.route.stagedMappingIds}
                    planRelevantMappingIds={verdict.planRelevantMappingIds}
                    onAddConcern={handleAddConcern}
                    onRemoveConcern={handleRemoveConcern}
                  />

                  <DraftReviewPanel
                    draft={state.draft}
                    prefill={prefill}
                    profileId={state.route.profileId}
                    onCreateDraft={handleCreateDraft}
                  />

                  <AuditConsentStrip
                    state={state}
                    onApprove={handleApprove}
                    onExport={handleExport}
                  />

                  <div className="disclosures">
                    <button
                      className="btn-link"
                      onClick={() => setShowFullSegments((v) => !v)}
                      aria-expanded={showFullSegments}
                      aria-controls="full-segments-details"
                    >
                      {showFullSegments ? "Hide full route segments" : "Show full route segments"}
                    </button>
                    {showFullSegments && (
                      <div id="full-segments-details">
                        <RouteSegmentList
                          segments={orderedSegments}
                          stagedMappingIds={state.route.stagedMappingIds}
                          mappings={scenarioMappings}
                          onStageMapping={handleStageMapping}
                          onClearMapping={handleClearMapping}
                        />
                      </div>
                    )}

                    <button
                      className="btn-link"
                      onClick={() => setShowEvidence((v) => !v)}
                      aria-expanded={showEvidence}
                      aria-controls="evidence-board-details"
                    >
                      {showEvidence ? "Hide evidence board" : "Show evidence board"}
                    </button>
                    {showEvidence && (
                      <div id="evidence-board-details">
                        <EvidenceBoard
                          sourceClaims={typedSourceClaims}
                          mappings={scenarioMappings}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
