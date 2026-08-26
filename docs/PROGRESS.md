# Grounded Route — Progress

## Current milestone: M4 Browser and integration proof

**Status:** FDN-002 human-first React workspace, local map/list equivalence, resident draft/approval/export controls, and the feature-gated WebMCP host are accepted on a private integration candidate. Merge/push to `main` is pending final integration gates. A real supported browser `document.modelContext` host remains unproven.

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

- Public release is **excluded** until DBKL excerpt terms and visible OSM attribution are verified and implemented.
- No real supported browser `document.modelContext` host has executed the registered WebMCP tools; the lifecycle contract is verified with a local fake host.
- E2E verifies current-approval export readiness and zero external requests, not downloaded Blob bytes.

### Next tickets

- M4: live supported-browser WebMCP execution proof and any required host-specific compatibility adjustment.
- M5: DBKL/OSM public-release terms, visible attribution, static deployment, and later user-approved public submission transition.

## Spark frozen-blocker repair (FDN-001 focused)

**Status:** SPK-FND-001 and SPK-FND-002 repaired and verified.

### Repairs applied
- `src/contracts/types.ts` — `AgentPort` staging/drafting methods now bind only intent fields and revision; no caller mapping collection argument.
- `src/domain/actions.ts` — imported checked-in fixture mappings from `../../data/scenario_impact_mappings.json` and introduced `createGroundedRouteController()` to return capability-separated `agentPort`/`residentPort` ports with immutable fixture allowlist binding.
- `src/domain/actions.ts` — `agentPort.stageMapping` and `agentPort.createDraft` now reject `sc-01`, unknown, and cross-scenario mapping IDs through trusted static allowlists.
- `tests/domain/actions.test.ts` — extended SPK-FND-001 coverage for API shape and forged-input/mutational invariants.
- `docs/evidence/fdn-001-tdd-evidence.md` — repair notes updated with this focused RED→GREEN evidence.
- `docs/reviews/spark-foundation-review.md` — review artifact preserved verbatim.

### Test summary
- Domain tests: 17 passed (5 new, 9 existing updated, +3 API/forgery tests)
- Fixture tests: 9 passed
- Total: 26 passed, 0 failed

### Final independent acceptance

- GLM-5.2 via Ollama Cloud independently reviewed the final foundation candidate and returned **PASS**.
- Review artifact: `docs/reviews/glm-foundation-final-review.md`.
- The review confirmed trusted fixture-bound mapping authorization, capability-separated agent/resident ports, revision-bound approval invalidation, and the absence of backend/runtime network/model dependencies in the foundation scope.

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

## WebMCP adapter and structured draft loop (FDN-003)

**Status:** Accepted for private development as a headless browser adapter.

### Completed

- Browser-native, feature-gated `document.modelContext.registerTool(...)` adapter at `src/webmcp/**`.
- Exactly six narrow tools: context, evidence lookup, stage/clear overlay, structured draft, and review status. No agent approval/export/publication/copy/download tool and no cross-origin exposure.
- Typed UI bridge for future React state wiring; successful agent mutations are visible state replacements rather than DOM mutations.
- Fixture-bound source/mapping authorization, revision-safe handlers, and structured `DraftStatement` provenance classes.
- Controlled audit actors: direct/resident path actions are `human`; WebMCP actions are `agent-tool`.
- Deterministic evaluation fixture/test coverage for `EV-01` through `EV-08`.
- Honest RED→GREEN evidence: `docs/evidence/fdn-003-webmcp-evidence.md`.
- Independent DeepSeek V4 Pro review **PASS**: `docs/reviews/deepseek-webmcp-review.md`.

### Acceptance evidence

- 68 tests passed: 27 domain, 23 WebMCP adapter, 9 evaluation, and 9 fixture tests.
- `workflow:check`, `fixture:check`, `tdd:check`, `typecheck`, `lint`, and `build` all pass.
- Claim ceiling: React host wiring, deterministic fake-host WebMCP lifecycle, and human-first browser flows are verified; a real browser `document.modelContext` invocation remains unproven.

## Human-first workspace and visual accessibility (FDN-002)

**Status:** Accepted for private integration.

### Completed

- Human-only React workspace that deliberately works without `document.modelContext`.
- Fixture-bound `humanPort` for human route/profile/overlay/draft actions; resident-only approval and revision-bound export remain separated from the agent surface.
- Keyboard-first canonical route list, local illustrative SVG map, evidence board, structured draft/review panel, audit trail, and direct human export path.
- React `WorkspaceBridge` ties feature-gated WebMCP mutations to the same rendered `DomainState`.
- StrictMode lifecycle regression coverage: exactly six raw WebMCP registrations; no re-registration after resident state updates; cleanup aborts active registrations.
- Mobile accessibility visual repair: 44px computed minimum button height at 390×844, label halo/stagger layout, mobile profile grid, and aligned audit rows.
- Evidence: `docs/evidence/fdn-002-frontend-evidence.md` and `docs/evidence/fdn-002-visual-qa.md`.
- Independent reviews: `docs/reviews/deepseek-flash-frontend-final-review.md` and `docs/reviews/deepseek-flash-visual-final-review.md` both **PASS**.

### Acceptance evidence

- 91 tests passed across 8 test files.
- Desktop and Mobile Chrome Playwright flow: 4 passed.
- At 390×844, a real production-build Playwright DOM probe found 16 visible buttons; none was under 44px high.
- Final screenshot QA found no visible route-label overlap, clipping, or mobile overflow.

### Claim ceiling

- The WebMCP tool lifecycle is verified with a local fake `document.modelContext`; a real supported browser host has not yet invoked the registered tools.
- Export readiness and zero external requests are verified; Blob download bytes are not independently asserted.
