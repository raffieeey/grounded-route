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
    <section aria-label="Route segments">
      <h2>Route segments</h2>
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
                        <span className="mapping-id">{m.id}</span>
                        {isStaged ? (
                          <button
                            className="btn-small btn-secondary"
                            onClick={() => onClearMapping(m.id)}
                            aria-label={`Clear ${m.id}`}
                          >
                            Clear
                          </button>
                        ) : (
                          <button
                            className="btn-small btn-primary"
                            onClick={() => onStageMapping(m.id)}
                            aria-label={`Stage ${m.id}`}
                          >
                            Stage
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              {stagedForSegment.length > 0 && (
                <div className="staged-badge">Staged: {stagedForSegment.map((m) => m.id).join(", ")}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
