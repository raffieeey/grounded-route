# Spark Review — Grounded Route FDN-001 Foundation

## Scope and evidence read
- Reviewed required docs and scripts: `docs/TECHNICAL_DESIGN.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/PROGRESS.md`, `docs/evidence/fdn-001-tdd-evidence.md`
- Reviewed data/domain/tests/contracts/scripts: `data/**`, `src/contracts/types.ts`, `src/domain/actions.ts`, `scripts/**`, `tests/**`
- Inspected the full diff from `c3bc9ae6898bf58bbc5fb66e689bb361b46a54b7` to `HEAD`.

## Verdict
FAIL

## Findings
### SPK-FND-001 — IMPORTANT — Unvalidated staging/draft identifiers allow source-quote IDs in place of vetted mappings
- **File/section:** [src/domain/actions.ts](/home/afifah/worktrees/grounded-route-foundation-spark-review/src/domain/actions.ts)
- **Reproduction/evidence:**
  - `stageMapping` only checks `expectedRevision` and `state.route.scenarioId === scenarioId` before accepting, and has no validation that `mappingId` exists in `scenario_impact_mappings.json`.
  - `createDraft` similarly takes `mappingIds` and performs no fixture membership checks.
  - `tests/domain/actions.test.ts` includes no negative case for unknown/foreign IDs, so this behavior is currently untested.
- **Why it violates the contract:**
  - Acceptance item 3 requires deterministic, revision-bound actions where impacts are derived only via reviewed mappings, not arbitrary IDs.
  - This allows callers to pass a source-claim ID (e.g., `sc-01`) and successfully stage it as a “mapping,” which breaks the immutable quote → reviewed mapping separation in practice.
- **Required repair:**
  - Add fixture-derived lookup/validation in `stageMapping` (and `createDraft`) so `mappingId`/`mappingIds` must exist in the selected scenario’s vetted mapping IDs and reject anything else with no mutation.

### SPK-FND-002 — IMPORTANT — Approval/export path is not enforceably human-only at domain boundary
- **File/section:** [src/domain/actions.ts](/home/afifah/worktrees/grounded-route-foundation-spark-review/src/domain/actions.ts) (`approveDraft`, `requestExport`)
- **Reproduction/evidence:**
  - `approveDraft` unconditionally writes an approval snapshot when called with a valid draft id and revision.
  - `requestExport` only checks `req.humanConfirmed === true` and matching revision.
  - The existing test `"export succeeds only with human confirmation and matching revision"` demonstrates a full approval+export flow using only domain actions in code, with no UI-gating evidence.
- **Why it violates the contract:**
  - Acceptance item 5 requires no local action to permit approval/export bypass; approval and export decisions must be tied to a direct resident/UI path, not an arbitrary function call.
  - Without actor/source-of-truth checks, a non-UI caller can call the same domain actions and produce an export URL.
- **Required repair:**
  - Split approval into an explicit resident-only UI transition and/or add an unforgeable confirmation token/context parameter validated in domain actions so non-UI callers cannot satisfy it.

## Confirmed invariants
- M0 fixture count now uses 6 source claims, and `scripts/validate_fixture.py` enforces the 6–12 bound.
- `SourceClaim` objects remain separate from mappings (no segment-impact fields on source records, enforced by fixture validation/tests).
- Date consistency checks are present across fixture manifest, claims, and mappings; source/reference dates are aligned to `2026-08-26`.
- Stale and cross-scenario mutation failures return error codes and do not call success audit transitions.
- No backend/FastMCP server or account system is introduced in this foundation scope.

## Claim ceiling
- The foundation currently supports 6 source claims total; the review is limited to confirmed violations in two acceptance-critical paths and does not speculate beyond observed, deterministic evidence.
