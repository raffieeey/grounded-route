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
