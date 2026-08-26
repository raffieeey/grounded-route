import type { RouteSegmentFeature, ScenarioImpactMapping } from "@/contracts/types.ts";

interface RouteSegmentListProps {
  segments: RouteSegmentFeature[];
  stagedMappingIds: string[];
  mappings: ScenarioImpactMapping[];
  onStageMapping: (mappingId: string) => void;
  onClearMapping: (mappingId: string) => void;
}

export default function RouteSegmentList({
  segments,
  stagedMappingIds,
  mappings,
  onStageMapping,
  onClearMapping,
}: RouteSegmentListProps) {
  return (
    <section aria-label="Route segments" role="region">
      <h2>Full route segments</h2>
      <p className="segment-list-intro">
        Advanced view of every illustrative segment on this corridor, with the
        reviewed plan-impact overlays. Mapping IDs are shown here for provenance.
      </p>
      <ul className="segment-list" role="list" aria-label="Route segments">
        {segments.map((seg) => {
          const segMappings = mappings.filter((m) =>
            m.segmentIds.includes(seg.properties.id)
          );
          const stagedForSegment = segMappings.filter((m) =>
            stagedMappingIds.includes(m.id)
          );
          return (
            <li key={seg.properties.id} className="segment-card">
              <div className="segment-header">
                <strong>{seg.properties.segmentName}</strong>
                <span className="segment-meta">{seg.properties.lengthMeters} m</span>
              </div>
              <div className="segment-tags">
                <span className="tag-label">OSM tags (unverified context):{" "}</span>
                {seg.properties.tags.map((t) => (
                  <span key={t} className="tag">{t}</span>
                ))}
              </div>
              {segMappings.length > 0 && (
                <div className="segment-mappings">
                  {segMappings.map((m) => {
                    const isStaged = stagedMappingIds.includes(m.id);
                    return (
                      <div key={m.id} className="mapping-row">
                        <details className="mapping-advanced">
                          <summary className="mapping-id">mapping {m.id}</summary>
                          <p className="mapping-rationale">{m.rationale}</p>
                        </details>
                        {isStaged ? (
                          <button
                            className="btn-small btn-secondary touch-target"
                            onClick={() => onClearMapping(m.id)}
                            aria-label={`Hide possible plan impact ${m.id}`}
                          >
                            Hide plan impact
                          </button>
                        ) : (
                          <button
                            className="btn-small btn-primary touch-target"
                            onClick={() => onStageMapping(m.id)}
                            aria-label={`Show possible plan impact ${m.id}`}
                          >
                            Show possible plan impact
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {stagedForSegment.length > 0 && (
                <div className="staged-badge">Plan impact shown</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
