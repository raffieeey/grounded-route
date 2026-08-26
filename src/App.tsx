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
import type { RouteSegmentFeature, DemoScenario, RouteProfile, SourceClaim, ScenarioImpactMapping } from "@/contracts/types.ts";

import WorkspaceControls from "@/ui/WorkspaceControls.tsx";
import RouteSegmentList from "@/ui/RouteSegmentList.tsx";
import EvidenceBoard from "@/ui/EvidenceBoard.tsx";
import DraftReviewPanel from "@/ui/DraftReviewPanel.tsx";
import AuditConsentStrip from "@/ui/AuditConsentStrip.tsx";
import LocalRouteMap from "@/ui/LocalRouteMap.tsx";

const { humanPort, residentPort } = createGroundedRouteController();

const scenario = scenarios[0] as DemoScenario;
const typedProfiles = profiles as RouteProfile[];
const typedSourceClaims = sourceClaims as SourceClaim[];
const typedMappings = mappings as ScenarioImpactMapping[];
const allSegments = (JSON.parse(segmentsGeoRaw) as { features: RouteSegmentFeature[] }).features;

export default function App() {
  const { state, bridge } = useWorkspaceBridge(humanPort.createInitialState());
  const [loaded, setLoaded] = useState(false);
  const [draftOpen, setDraftOpen] = useState(false);

  // Feature-gated WebMCP registration. The bridge identity is stable across
  // state changes (see useWorkspaceBridge), so this effect runs once per mount.
  // Registration is deferred to a task so the first StrictMode setup can be
  // cancelled in its cleanup before it ever invokes registerWebMcpTools; the
  // settled setup then emits exactly one six-tool batch. An AbortController
  // cancels in-flight registration on remount and unregisters the tool batch
  // on real unmount via the documented { signal } option.
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

  const orderedSegments = useMemo(() => {
    const order = scenario.defaultSegmentIds;
    return order
      .map((id) => allSegments.find((s) => s.properties.id === id))
      .filter(Boolean) as RouteSegmentFeature[];
  }, []);

  const scenarioMappings = useMemo(
    () => typedMappings.filter((m) => m.scenarioId === scenario.id),
    []
  );

  const handleLoad = useCallback(() => {
    const next = humanPort.selectScenario(state, scenario.id);
    if (next.success) {
      bridge.replaceState(next.data, "Demo loaded");
      setLoaded(true);
    }
  }, [state, bridge]);

  const handleClear = useCallback(() => {
    bridge.replaceState(humanPort.createInitialState(), "Session cleared");
    setLoaded(false);
    setDraftOpen(false);
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

  const handleCreateDraft = useCallback(
    (position: string, change: string, questions: string) => {
      const openQuestions = questions
        .split(",")
        .map((q) => q.trim())
        .filter((q) => q.length > 0);
      const next = humanPort.createStructuredDraft(state, {
        mappingIds: state.route.stagedMappingIds,
        sourceClaimIds: scenarioMappings.flatMap((m) => m.sourceClaimIds),
        userPosition: position,
        requestedChange: change,
        openQuestions,
      }, state.route.revision);
      if (next.success) {
        bridge.replaceState(next.data, "Draft created");
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

  const activeProfile = state.route.profileId
    ? typedProfiles.find((p) => p.id === state.route.profileId) || null
    : null;

  return (
    <div>
      <div
        id="workspace-announcer"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        </div>

      <header>
        <h1>{scenario.title}</h1>
        <p className="scenario-meta">{scenario.areaBoundsDescription}</p>
      </header>

      <section className="disclaimer" role="note">
        {scenario.disclaimer}
      </section>

      <WorkspaceControls
        loaded={loaded}
        activeProfileId={state.route.profileId}
        profiles={typedProfiles}
        onLoad={handleLoad}
        onClear={handleClear}
        onSelectProfile={handleSelectProfile}
      />

      {loaded && (
        <div role="region" aria-label="Workspace">
          {activeProfile && (
            <div className="profile-info">
              <strong>{activeProfile.label}</strong> — {activeProfile.description}
            </div>
          )}

          <div className="workspace-grid">
            <div className="workspace-main">
              <LocalRouteMap
                defaultSegmentIds={scenario.defaultSegmentIds}
                stagedMappingIds={state.route.stagedMappingIds}
                mappings={scenarioMappings}
              />

              <RouteSegmentList
                segments={orderedSegments}
                stagedMappingIds={state.route.stagedMappingIds}
                mappings={scenarioMappings}
                onStageMapping={handleStageMapping}
                onClearMapping={handleClearMapping}
              />

              <EvidenceBoard
                sourceClaims={typedSourceClaims}
                mappings={scenarioMappings}
              />

              <DraftReviewPanel
                draft={state.draft}
                onCreateDraft={handleCreateDraft}
                onOpen={() => setDraftOpen(true)}
                isOpen={draftOpen}
              />

              <AuditConsentStrip
                state={state}
                onApprove={handleApprove}
                onExport={handleExport}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
