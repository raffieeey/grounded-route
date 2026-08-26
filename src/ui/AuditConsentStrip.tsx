import { useState } from "react";
import type { DomainState } from "@/contracts/types.ts";

interface AuditConsentStripProps {
  state: DomainState;
  onApprove: () => void;
  onExport: () => void;
}

export default function AuditConsentStrip({ state, onApprove, onExport }: AuditConsentStripProps) {
  const [showAudit, setShowAudit] = useState(false);
  const hasDraft = state.draft != null;
  const approvalValid =
    state.approval != null &&
    !state.approval.invalidated &&
    state.approval.validForRevision === state.route.revision &&
    state.approval.draftId === state.draft?.id;

  return (
    <section className="consent-strip" aria-label="Approve and export" role="region">
      <h2>Approve and export</h2>
      <p className="consent-note">
        Only you can approve and export. A browser assistant cannot approve, export, copy, or download.
      </p>
      <div className="consent-actions">
        {hasDraft && (
          <button
            className="btn-primary touch-target"
            onClick={onApprove}
            disabled={approvalValid}
            aria-label="Approve current draft"
          >
            {approvalValid ? "Approved" : "Approve current draft"}
          </button>
        )}
        <button
          className="btn-primary touch-target"
          onClick={onExport}
          disabled={!approvalValid}
          aria-label="Export"
        >
          Export
        </button>
      </div>

      <button
        className="btn-link"
        onClick={() => setShowAudit((v) => !v)}
        aria-expanded={showAudit}
        aria-controls="audit-trail-details"
      >
        {showAudit ? "Hide audit trail" : "Show audit trail"}
      </button>
      {showAudit && (
        <div id="audit-trail-details" className="audit-log" role="region" aria-label="Audit trail">
          <h3>Audit trail</h3>
          <ul role="list">
            {state.auditLog.slice(-8).map((evt) => (
              <li key={evt.eventId} className="audit-row">
                <span className={`badge actor-${evt.actor}`}>{evt.actor}</span>
                <span className="audit-row-text">
                  {evt.action} (r{evt.revisionBefore} → r{evt.revisionAfter})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
