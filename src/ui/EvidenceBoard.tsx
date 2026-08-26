import type { SourceClaim, ScenarioImpactMapping } from "@/contracts/types.ts";

interface EvidenceBoardProps {
  sourceClaims: SourceClaim[];
  mappings: ScenarioImpactMapping[];
}

export default function EvidenceBoard({ sourceClaims, mappings }: EvidenceBoardProps) {
  const mappingSourceIds = new Set(
    mappings.flatMap((m) => m.sourceClaimIds)
  );
  const relevantClaims = sourceClaims.filter((c) => mappingSourceIds.has(c.id));

  return (
    <section aria-label="Evidence board">
      <h2>Evidence board</h2>

      <div className="evidence-section">
        <h3>Official source references</h3>
        <ul className="source-list">
          {relevantClaims.map((claim) => (
            <li key={claim.id} className="source-card">
              <div className="source-header">
                <span className="badge source-reference">{'\u003e'} source-reference</span>
                <span className="source-doc">{claim.document}</span>
              </div>
              <div className="source-reference-meta">
                <p>Page {claim.page} ·{" "}
                  <a href={claim.documentUrl} target="_blank" rel="noopener noreferrer">
                    Official document
                  </a>
                  {" · Retrieved "}
                  {claim.retrievedDate}
                </p>
                <p className="source-category">Category: {claim.category}</p>
              </div>
              <div className="source-boundary">{claim.boundaryNote}</div>
              <div className="source-notes">{claim.notes}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="evidence-section">
        <h3>Curated interpretations</h3>
        <ul className="mapping-list">
          {mappings.map((m) => (
            <li key={m.id} className="mapping-card">
              <div className="mapping-header">
                <span className="badge curated-interpretation">{'\u003e'} curated-interpretation</span>
                <span className="mapping-certainty">Certainty: {m.certaintyLevel}</span>
              </div>
              <div className="mapping-rationale">
                <strong>Rationale:{" "}</strong>{m.rationale}
              </div>
              <div className="mapping-uncertainty">
                <strong>Uncertainty:{" "}</strong>{m.uncertainty}
              </div>
              <div className="mapping-meta">
                Reviewer: {m.reviewer} · {m.reviewDate}
              </div>
              <div className="mapping-segments">
                Segments: {m.segmentIds.join(", ")}
              </div>
              <div className="mapping-sources">
                Sources: {m.sourceClaimIds.join(", ")}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
