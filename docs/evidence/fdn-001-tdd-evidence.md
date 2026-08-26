# FDN-001 TDD Evidence

## RED — before implementation

Tests were written before finalizing domain implementation to specify expected behavior.
A captured RED run was not produced because the test files and action modules were created
in the same editing pass. The tests assert the following invariants:

1. source claims cannot contain segment-impact fields;
2. mappings require valid source/segment/scenario IDs plus rationale/uncertainty/reviewer/date;
3. a reviewed mapping can stage an overlay, while a direct source claim cannot;
4. stale expected revision and cross-scenario mapping calls fail without state/audit mutation;
5. any route/scenario/evidence/mapping/draft mutation invalidates exact-revision approval;
6. no local domain action can enable export without explicit direct-human approval API that validates the current snapshot;
7. fixture manifest validates all cross-file IDs and data-attribution records mark source data as excluded from public release until terms are verified.

## GREEN — after implementation

Command: `npx vitest run`

Result: 12 tests passed (8 domain + 4 fixture)

```
 RUN  v3.2.7
 ✓ tests/domain/actions.test.ts (8 tests)
 ✓ tests/data/fixture.test.ts (4 tests)
 Test Files  2 passed (2)
      Tests  12 passed (12)
```

## M0 correction RED→GREEN (2026-08-26)

**Problem:** After independent acceptance review, the M0 fixture violated approved TDD constraints:
- Only 5 source claims existed (TDD requires 6–12).
- All provenance dates were `2025-08-26` instead of the actual extraction/review date `2026-08-26`.
- The validator and behavioural tests did not enforce these M0 rules, so the defects were not caught automatically.

**Regression tests added to `tests/data/fixture.test.ts`:**
1. `source claim count is between 6 and 12 inclusive`
2. `fixture manifest reviewDate and fixtureVersion reflect current M0 date`
3. `all source claims have required fields`
4. `all source claim and mapping dates are valid ISO dates matching fixture reviewDate`
5. `manifest sourceClaimIds includes every source claim in the fixture`

### RED run — before fix

Command: `npm run test`

Result: 2 failed / 18 total

```
 FAIL  tests/data/fixture.test.ts > fixture manifest validation > source claim count is between 6 and 12 inclusive
AssertionError: expected 5 to be greater than or equal to 6

 FAIL  tests/data/fixture.test.ts > fixture manifest validation > fixture manifest reviewDate and fixtureVersion reflect current M0 date
AssertionError: expected '2025-08-26' to be '2026-08-26' // Object.is equality
```

### Fix applied

- Added sixth `SourceClaim` (`sc-06`) from PTKL2040 Executive Summary page 38:
  - Quote (Malay): `Promosi Pejalan Kaki dan Penggunaan Kenderaan Mikromobiliti`
  - Notes explicitly state it is a general policy/implementation proposal, not a confirmed segment project.
- Updated `data/fixture_manifest.json`:
  - `fixtureVersion`: `m0-2026-08-26`
  - `reviewDate`: `2026-08-26`
  - `sourceClaimIds`: added `sc-06`
- Updated `data/scenario_impact_mappings.json`:
  - Added `sc-06` to `map-01` sourceClaimIds.
  - Changed all `reviewDate` values to `2026-08-26`.
- Updated `data/source_claims.json`:
  - Changed all `retrievedDate` values to `2026-08-26`.
- Extended `scripts/validate_fixture.py`:
  - Enforces 6–12 source-claim count.
  - Validates required source-claim fields.
  - Validates ISO date format and cross-file date consistency (manifest reviewDate == claim retrievedDate == mapping reviewDate).
  - Validates manifest includes every source claim.

### GREEN run — after fix

Command: `npm run test`

Result:

```
 RUN  v3.2.7
 ✓ tests/domain/actions.test.ts (9 tests)
 ✓ tests/data/fixture.test.ts (9 tests)
 Test Files  2 passed (2)
      Tests  18 passed (18)
```

All acceptance commands exit 0:

```
npm run workflow:check   # WORKFLOW GUARD PASS
npm run fixture:check    # FIXTURE VALIDATION PASS
npm run tdd:check        # TDD GUARD PASS
npm run test             # 18 passed
npm run typecheck        # clean
npm run lint             # clean
npm run build            # dist produced
```
