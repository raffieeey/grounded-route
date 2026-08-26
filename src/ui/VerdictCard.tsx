import type { RouteVerdict } from "@/domain/verdict.ts";

interface VerdictCardProps {
  verdict: RouteVerdict;
  onReviewConditions?: () => void;
}

export default function VerdictCard({ verdict, onReviewConditions }: VerdictCardProps) {
  const n = verdict.conditionsToReview.length;
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
