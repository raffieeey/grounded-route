import type { DomainState } from "@/contracts/types.ts";

interface AuditConsentStripProps {
  state: DomainState;
  onApprove: () => void;
  onExport: () => void;
}

export default function AuditConsentStrip({
  state,
  onApprove,
  onExport,
}: AuditConsentStripProps) {
  const hasDraft = state.draft != null;
  const approvalValid =
    state.approval != null &&
    !state.approval.invalidated &&
    state.approval.validForRevision === state.route.revision &&
    state.approval.draftId === state.draft?.id;

  return (
    <section aria-label="Audit and consent">
      <div className="audit-strip">
        <div className="audit-meta">
          <span>Revision: {state.route.revision}</span>
          <span>Audit events: {state.auditLog.length}</span>
          {hasDraft && (
            <span>Draft: {state.draft!.id}</span>
          )}
          {state.approval && (
            <span>
              Approval: {state.approval.invalidated ? "Invalidated" : "Valid for revision " + state.approval.validForRevision}
            </span>
          )}
        </div>

        {hasDraft && (
          <div className="consent-actions">
            <button
              className="btn-primary touch-target"
              onClick={onApprove}
              disabled={approvalValid}
              aria-label="Approve current draft"
            >
              {approvalValid ? "Approved" : "Approve current draft"}
            </button>

            <button
              className="btn-primary touch-target"
              onClick={onExport}
              disabled={!approvalValid}
              aria-label="Export"
            >
              Export
            </button>
          </div>
        )}

        {state.auditLog.length > 0 && (
          <div className="audit-log">
            <h4>Audit trail</h4>
            <ul>
              {state.auditLog.slice(-5).map((evt) => (
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
      </div>
    </section>
  );
}
