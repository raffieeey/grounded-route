# Grounded Route — Progress

## Current milestone: M0 Fixture Freeze

**Status:** Foundation implementation complete (FDN-001). M0 fixture freeze **PASSED FOR PRIVATE DEVELOPMENT**.

### Completed

- Bootstrap enforcement artifacts:
  - `scripts/workflow_guard.py` — passes in foundation phase
  - `scripts/tdd_guard.py` — 10 exported names covered
  - `scripts/validate_fixture.py` — cross-file ID, schema, date consistency, and M0 count validation
  - `docs/evidence/fdn-001-tdd-evidence.md` — RED→GREEN evidence recorded, including honest M0 correction log
- Strict TypeScript React/Vite project scaffold with all required scripts:
  - `npm run dev`, `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run workflow:check`, `npm run fixture:check`, `npm run tdd:check`
- Deterministic domain contracts and actions:
  - `src/contracts/types.ts`
  - `src/domain/actions.ts`
  - Immutable `SourceClaim` vs reviewed `ScenarioImpactMapping` vs unknown enforced
- Behavioral tests (18 passing):
  - 9 domain action tests in `tests/domain/actions.test.ts`
  - 9 fixture validation tests in `tests/data/fixture.test.ts`
- M0 fixture data:
  - `data/route_segments.geojson` (14 segments)
  - `data/places.geojson` (4 places)
  - `data/source_claims.json` (6 claims)
  - `data/scenario_impact_mappings.json` (3 mappings)
  - `data/route_profiles.json` (3 profiles)
  - `data/demo_scenarios.json` (1 scenario)
  - `data/fixture_manifest.json` (version `m0-2026-08-26`)
- Minimal human-only shell:
  - `src/App.tsx` displays scenario, profile choices, disclaimer, and evidence counts
  - `src/main.tsx` bootstraps React
  - `src/styles/main.css` basic styling
- Updated `data/THIRD_PARTY_DATA_MANIFEST.md` with asset-level attribution and `excluded` public-release status.

### Acceptance commands run

All exit 0:

```bash
npm run workflow:check
npm run fixture:check
npm run tdd:check
npm run test
npm run typecheck
npm run lint
npm run build
```

### Test summary

- Domain tests: 9 passed
- Fixture tests: 9 passed
- Total: 18 passed, 0 failed

### Branch

`feat/foundation-m0`

### Commit SHA

Use `git rev-parse HEAD` for the current revision.
The known foundation feature commit is `957a2e858f9705a1a51deca44b60dfa941f35a83`.

### Known limitations

- Public release is **excluded** until DBKL excerpt terms and OSM data-license terms are verified.
- Map rendering is not implemented; this is a foundation shell only.
- WebMCP adapter is not implemented; reserved for FDN-003.

### Next tickets

- FDN-002: React UI, map/list equivalence, evidence/draft/approval UI
- FDN-003: WebMCP adapter, tool registration, handler authorization

## Spark frozen-blocker repair (FDN-001 focused)

**Status:** SPK-FND-001 and SPK-FND-002 repaired and verified.

### Repairs applied
- `src/domain/actions.ts` — fixture-aware `stageMapping` and `createDraft` with reviewed-mapping allowlist validation.
- `src/domain/actions.ts` — capability-separated `agentPort` and `residentPort`; old `requestExport` with `humanConfirmed` boolean removed.
- `src/contracts/types.ts` — added `AgentPort` and `ResidentPort` interfaces; removed `ExportRequest`.
- `tests/domain/actions.test.ts` — 5 new behavioural tests proving RED→GREEN for both blockers.
- `docs/evidence/fdn-001-tdd-evidence.md` — honest RED→GREEN evidence appended.
- `docs/reviews/spark-foundation-review.md` — review artifact preserved verbatim.

### Test summary
- Domain tests: 14 passed (5 new, 9 existing updated)
- Fixture tests: 9 passed
- Total: 23 passed, 0 failed

### Acceptance commands run
All exit 0:
```bash
npm run workflow:check
npm run fixture:check
npm run tdd:check
npm run test
npm run typecheck
npm run lint
npm run build
```
