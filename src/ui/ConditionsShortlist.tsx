import type { ConditionToReview } from "@/domain/verdict.ts";
import type { ScenarioImpactMapping } from "@/contracts/types.ts";

interface ConditionsShortlistProps {
  conditions: ConditionToReview[];
  mappings: ScenarioImpactMapping[];
  stagedMappingIds: string[];
  planRelevantMappingIds: string[];
  onAddConcern: (condition: ConditionToReview) => void;
  onRemoveConcern: (condition: ConditionToReview) => void;
}

export default function ConditionsShortlist({
  conditions,
  mappings,
  stagedMappingIds,
  planRelevantMappingIds,
  onAddConcern,
  onRemoveConcern,
}: ConditionsShortlistProps) {
  const planAreaCount = planRelevantMappingIds.length;
  return (
    <section
      id="conditions-shortlist"
      className="conditions-shortlist"
      aria-label="Conditions to review"
      role="region"
      tabIndex={-1}
    >
      <h2>Conditions to review</h2>
      {planAreaCount > 0 && (
        <p className="conditions-plan-summary">
          {planAreaCount} possible plan impact area{planAreaCount === 1 ? "" : "s"} overlap your route.
        </p>
      )}
      {conditions.length === 0 ? (
        <p>No route conditions flagged for this profile on the illustrative corridor.</p>
      ) : (
        <ul className="condition-list" role="list">
          {conditions.map((cond) => {
            const allStaged = cond.mappingIds.every((id) => stagedMappingIds.includes(id));
            const someStaged = cond.mappingIds.some((id) => stagedMappingIds.includes(id));
            const mapping = mappings.find((m) => cond.mappingIds.includes(m.id));
            return (
              <li key={`${cond.segmentId}-${cond.constraint}`} className="condition-card">
                <article aria-label={cond.segmentName}>
                  <h3 className="condition-segment">{cond.segmentName}</h3>
                  <p className="condition-text">{cond.condition}</p>
                  <p className="condition-qualifier">{cond.qualifier}</p>
                  {mapping && (
                    <p className="condition-impact">
                      <strong>Possible plan impact: </strong>
                      {mapping.rationale}
                    </p>
                  )}
                  {allStaged && cond.mappingIds.length > 0 ? (
                    <button
                      className="btn-small btn-secondary touch-target"
                      onClick={() => onRemoveConcern(cond)}
                      aria-label={`Added — remove ${cond.segmentName} from draft`}
                    >
                      Added — remove from draft
                    </button>
                  ) : (
                    <button
                      className="btn-small btn-primary touch-target"
                      onClick={() => onAddConcern(cond)}
                      aria-label={`Add ${cond.segmentName} concern to my draft`}
                    >
                      Add to my draft
                    </button>
                  )}
                  {someStaged && !allStaged && (
                    <span className="condition-partial">Some impacts added</span>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
