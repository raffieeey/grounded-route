import type { RouteVerdict } from "@/domain/verdict.ts";

interface VerdictCardProps {
  verdict: RouteVerdict;
  stagedMappingIds?: string[];
  onReviewConditions?: () => void;
}

export default function VerdictCard({
  verdict,
  stagedMappingIds = [],
  onReviewConditions,
}: VerdictCardProps) {
  const n = verdict.conditionsToReview.length;
  const stagedSet = new Set(stagedMappingIds);
  const stagedPlanMappings = verdict.planRelevantMappingIds.filter((id) =>
    stagedSet.has(id),
  );
  const stagedAreas = new Set(
    verdict.conditionsToReview
      .filter((condition) =>
        condition.mappingIds.some((id) => stagedPlanMappings.includes(id)),
      )
      .map((condition) => condition.segmentId),
  ).size;
  const actionLabel =
    n === 0
      ? "Review conditions summary"
      : `Review ${n} condition${n === 1 ? "" : "s"}`;
  return (
    <section
      className="verdict-card"
      aria-label="Route impact check"
      role="region"
    >
      <h2 className="verdict-headline">{verdict.headline}</h2>
      <p className="verdict-qualifier">{verdict.qualifier}</p>
      {stagedMappingIds.length > 0 && (
        <p
          key={stagedMappingIds.join("|")}
          className="verdict-overlay-delta"
          aria-live="polite"
        >
          With the staged plan overlay: {n} areas under review
          {" "}(+{stagedAreas} {stagedAreas === 1 ? "area" : "areas"} linked to the staged overlay). Illustrative and unverified — field verification required.
        </p>
      )}
      <button
        type="button"
        className="verdict-action touch-target"
        onClick={onReviewConditions}
        aria-label={`${actionLabel} — go to the conditions shortlist`}
      >
        {actionLabel}
      </button>
    </section>
  );
}
