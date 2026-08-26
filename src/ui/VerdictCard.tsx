import type { RouteVerdict } from "@/domain/verdict.ts";

interface VerdictCardProps {
  verdict: RouteVerdict;
}

export default function VerdictCard({ verdict }: VerdictCardProps) {
  const n = verdict.conditionsToReview.length;
  return (
    <section
      className="verdict-card"
      aria-label="Route impact check"
      role="region"
    >
      <h2 className="verdict-headline">{verdict.headline}</h2>
      <p className="verdict-qualifier">{verdict.qualifier}</p>
      <p className="verdict-next-action">
        <span className="verdict-next-label">Next: </span>
        {verdict.nextAction}
      </p>
      <p className="verdict-count" data-testid="verdict-condition-count">
        {n === 0
          ? "No conditions flagged."
          : `${n} condition${n === 1 ? "" : "s"} to review below.`}
      </p>
      {verdict.planRelevantMappingIds.length > 0 && (
        <p className="verdict-plan">
          {verdict.planRelevantMappingIds.length} possible plan impact area
          {verdict.planRelevantMappingIds.length === 1 ? "" : "s"} overlap your route.
        </p>
      )}
    </section>
  );
}
