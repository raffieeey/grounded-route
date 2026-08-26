import { useState } from "react";
import type { DraftComment, DraftStatement } from "@/contracts/types.ts";

interface DraftReviewPanelProps {
  draft: DraftComment | null;
  onCreateDraft: (position: string, change: string, questions: string) => void;
  onOpen: () => void;
  isOpen: boolean;
}

export default function DraftReviewPanel({
  draft,
  onCreateDraft,
  onOpen,
  isOpen,
}: DraftReviewPanelProps) {
  const [position, setPosition] = useState("");
  const [change, setChange] = useState("");
  const [questions, setQuestions] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateDraft(position, change, questions);
  };

  if (!isOpen) {
    return (
      <section aria-label="Draft review">
        <button className="btn-primary" onClick={onOpen} aria-label="Open draft">
          Open draft panel
        </button>
        {draft && (
          <div className="draft-summary">
            <strong>Current draft present</strong> — Revision {draft.revision}
          </div>
        )}
      </section>
    );
  }

  return (
    <section aria-label="Draft review">
      <form
        onSubmit={handleSubmit}
        aria-label="Draft review"
        className="draft-form"
      >
        <h3>Draft / Review</h3>

        <label>
          Your position
          <input
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            aria-label="Your position"
            required
          />
        </label>

        <label>
          Requested change
          <input
            type="text"
            value={change}
            onChange={(e) => setChange(e.target.value)}
            aria-label="Requested change"
            required
          />
        </label>

        <label>
          Open questions
          <input
            type="text"
            value={questions}
            onChange={(e) => setQuestions(e.target.value)}
            aria-label="Open questions"
          />
        </label>

        <button type="submit" className="btn-primary" aria-label="Create draft">
          Create draft
        </button>
      </form>

      {draft && draft.statements.length > 0 && (
        <div className="draft-statements">
          <h4>Stored statements</h4>
          <ul>
            {draft.statements.map((stmt: DraftStatement) => (
              <li key={stmt.id} className={`statement ${stmt.statementClass}`}>
                <span className="badge">{stmt.statementClass}</span>
                <p>{stmt.text}</p>
                {"mappingId" in stmt && stmt.mappingId && (
                  <div className="stmt-meta">Mapping: {stmt.mappingId}</div>
                )}
                {"sourceClaimId" in stmt && stmt.sourceClaimId && (
                  <div className="stmt-meta">Source reference: {stmt.sourceClaimId}</div>
                )}
                {"requestedChange" in stmt && (
                  <div className="stmt-meta">Change: {stmt.requestedChange}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
