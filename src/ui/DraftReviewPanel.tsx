import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { TextareaHTMLAttributes } from "react";
import type { DraftComment, DraftStatement } from "@/contracts/types.ts";

export interface DraftPrefill {
  userPosition: string;
  requestedChange: string;
  openQuestions: string[];
}

interface DraftReviewPanelProps {
  draft: DraftComment | null;
  prefill: DraftPrefill | null;
  profileId: string | null;
  onCreateDraft: (position: string, change: string, questions: string) => void;
}

/**
 * Auto-sizing textarea: on every value change it grows to fit its content, so a
 * prefilled draft is fully readable without internal vertical or horizontal
 * scrolling. Resize is locked because the element sizes itself to its content.
 */
function AutoTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const natural = el.scrollHeight;
    if (natural > 0) el.style.height = `${natural}px`;
  }, [props.value]);
  return <textarea ref={ref} {...props} />;
}

export default function DraftReviewPanel({
  draft,
  prefill,
  profileId,
  onCreateDraft,
}: DraftReviewPanelProps) {
  const [position, setPosition] = useState("");
  const [change, setChange] = useState("");
  const [questions, setQuestions] = useState("");

  // Seed the editable draft from the deterministic verdict prefill whenever the
  // selected profile changes. Staging concerns does not change the profile, so a
  // resident mid-edit is not clobbered by overlay toggles.
  useEffect(() => {
    if (prefill) {
      setPosition(prefill.userPosition);
      setChange(prefill.requestedChange);
      setQuestions(prefill.openQuestions.join(", "));
    } else {
      setPosition("");
      setChange("");
      setQuestions("");
    }
  }, [profileId, prefill]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateDraft(position, change, questions);
  };

  return (
    <section className="draft-panel" aria-label="Draft review" role="region">
      <h2>Draft review</h2>
      <p className="draft-intro">
        Pre-filled from your profile and the reviewed conditions. Edit anything before preparing your comment.
      </p>
      <form onSubmit={handleSubmit} aria-label="Draft review" className="draft-form">
        <label>
          Your position
          <AutoTextarea
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            aria-label="Your position"
            required
            rows={2}
            className="draft-field"
          />
        </label>
        <label>
          Requested change
          <AutoTextarea
            value={change}
            onChange={(e) => setChange(e.target.value)}
            aria-label="Requested change"
            required
            rows={2}
            className="draft-field"
          />
        </label>
        <label>
          Open questions
          <AutoTextarea
            value={questions}
            onChange={(e) => setQuestions(e.target.value)}
            aria-label="Open questions"
            rows={2}
            className="draft-field"
          />
        </label>
        <button type="submit" className="btn-primary touch-target" aria-label="Prepare draft">
          Prepare draft
        </button>
      </form>

      {draft && draft.statements.length > 0 && (
        <div className="draft-statements" aria-label="Draft statements">
          <h3>Prepared draft</h3>
          <ul role="list">
            {draft.statements.map((stmt: DraftStatement) => (
              <li key={stmt.id} className={`statement ${stmt.statementClass}`}>
                <span className="badge">{stmt.statementClass}</span>
                <p>{stmt.text}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
