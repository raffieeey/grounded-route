# Grounded Route — Progress

## Current milestone: M4 Browser and integration proof

**Status:** M0 fixture, the human-first React workspace, browser-native WebMCP, and visible OSM attribution are accepted on private `main`. A real native Chrome local-development host has registered and executed all six WebMCP tools against the visible workspace. The DBKL source-reference rights path, final public-distribution scope review, and any public-release transition remain future gates.

### Completed

- Bootstrap enforcement artifacts:
  - `scripts/workflow_guard.py` — passes in foundation phase
  - `scripts/tdd_guard.py` — 10 exported names covered
  - `scripts/validate_fixture.py` — cross-file ID, schema, date consistency, and M0 count validation
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

- Public release is **excluded** until the DBKL source-reference rights path is resolved and the user explicitly approves a visibility change.
- OSM visible UI/export attribution is implemented; a final ODbL/public-distribution scope review remains required before public distribution of the GeoJSON subset.
- Native registration and all six tool calls are proven in a flag-enabled local Chrome development host; a third-party agent client or origin-trial/public-deployment demonstration remains unproven.
- Browser-local Blob export readiness is verified, not downloaded Blob bytes.

### Next tickets

- M5: resolve the DBKL source-reference rights path, complete final public-distribution/ODbL scope review, set up static deployment, and ask the user for explicit public-release approval only when all gates are cleared.
- Optional M4 follow-up: third-party agent-client or origin-trial deployment demonstration after an appropriate deployment target exists.

## Spark frozen-blocker repair (FDN-001 focused)

**Status:** SPK-FND-001 and SPK-FND-002 repaired and verified.

### Repairs applied
- `src/contracts/types.ts` — `AgentPort` staging/drafting methods now bind only intent fields and revision; no caller mapping collection argument.
- `src/domain/actions.ts` — imported checked-in fixture mappings from `../../data/scenario_impact_mappings.json` and introduced `createGroundedRouteController()` to return capability-separated `agentPort`/`residentPort` ports with immutable fixture allowlist binding.
- `src/domain/actions.ts` — `agentPort.stageMapping` and `agentPort.createDraft` now reject `sc-01`, unknown, and cross-scenario mapping IDs through trusted static allowlists.
- `tests/domain/actions.test.ts` — extended SPK-FND-001 coverage for API shape and forged-input/mutational invariants.

### Test summary
- Domain tests: 17 passed (5 new, 9 existing updated, +3 API/forgery tests)
- Fixture tests: 9 passed
- Total: 26 passed, 0 failed

### Final independent acceptance

- GLM-5.2 via Ollama Cloud independently reviewed the final foundation candidate and returned **PASS**.
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

**Status:** Accepted and exercised in a real local Chrome development host.

### Completed

- Browser-native, feature-gated `document.modelContext.registerTool(...)` adapter at `src/webmcp/**`.
- Exactly six narrow tools: context, evidence lookup, stage/clear overlay, structured draft, and review status. No agent approval/export/publication/copy/download tool and no cross-origin exposure.
- Typed UI bridge ties successful agent mutations to visible state replacements rather than DOM mutations; React host wiring is verified.
- Fixture-bound source/mapping authorization, revision-safe handlers, and structured `DraftStatement` provenance classes.
- Controlled audit actors: direct/resident path actions are `human`; WebMCP actions are `agent-tool`.
- Deterministic evaluation fixture/test coverage for `EV-01` through `EV-08`.

### Acceptance evidence

- 68 tests passed: 27 domain, 23 WebMCP adapter, 9 evaluation, and 9 fixture tests.
- `workflow:check`, `fixture:check`, `tdd:check`, `typecheck`, `lint`, and `build` all pass.
- Claim ceiling: React host wiring and all six native tools are proven in a local flag-enabled Chrome development host; a third-party agent-client, origin-trial, or public-deployment proof remains future work.

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
- Independent review: `docs/reviews/deepseek-flash-visual-final-review.md` **PASS**.

### Acceptance evidence

- 91 tests passed across 8 test files.
- Desktop and Mobile Chrome Playwright flow: 4 passed.
- At 390×844, a real production-build Playwright DOM probe found 16 visible buttons; none was under 44px high.
- Final screenshot QA found no visible route-label overlap, clipping, or mobile overflow.

### Claim ceiling

- The WebMCP lifecycle and all six native tools are verified in a local flag-enabled Chrome development host; a third-party agent client or public origin-trial deployment is not yet demonstrated.
- Export readiness and zero external requests are verified; Blob download bytes are not independently asserted.

## Live Chrome WebMCP host proof (FDN-004)

**Status:** Accepted local development-host proof.

### Completed

- Enabled Chrome's documented local WebMCP testing flag in an isolated headed Chrome profile and relaunched it.
- The real browser exposed native `document.modelContext` and `navigator.modelContextTesting` on the production build.
- Native tool discovery returned exactly the six intended tools and no approval/export/copy/download/publication tool.
- Native execution exercised context, evidence lookup, stage, draft, review status, and clear against the actual rendered workspace state.
- The stage/clear calls visibly changed the map indicator and controlled `agent-tool` audit trail; the structured draft remained approval-invalid until a direct resident action.

### Claim ceiling

- This is a real Chrome local-development proof under the documented testing flag, not a third-party agent-client or public origin-trial/deployment demonstration.
- The test intentionally did not approve, export, or submit anything through WebMCP; those capabilities remain resident-only.

## Visible OSM attribution and local-export metadata (FDN-006)

**Status:** Accepted on a private candidate; repository remains private because the DBKL source-reference gate is separate and unresolved.

### Completed

- The local route-map section visibly displays `© OpenStreetMap contributors` with the official OSM copyright/ODbL link and an illustrative/non-navigation/non-certified-accessibility scope notice.
- The direct human export payload carries the same OSM attribution as machine-readable metadata.
- No automatic request/tracking was introduced; the attribution is a user-followable static link.
- WebMCP inventory remains six narrow tools with no export, attribution, copy, download, or approval capability.
- FDN-006 evidence: `docs/evidence/fdn-006-osm-attribution-implementation.md`.
- Independent DeepSeek Flash review: `docs/reviews/deepseek-flash-osm-attribution-review.md` — **PASS**.

### Acceptance evidence

- 99 tests across 9 test files passed.
- Browser verification confirmed the visible attribution link and that an approved local export payload contains the exact OSM attribution object.
- `workflow:check`, `fixture:check`, `tdd:check`, typecheck, lint, build, and desktop/mobile Playwright all passed.

### Claim ceiling

- Visible OSM attribution is implemented, but it does not settle every ODbL public-distribution question and does not clear the independent DBKL source-reference gate.
- The overall repository remains private until the DBKL rights path is resolved and the user explicitly authorizes a visibility change.


## De-quoted transparent public candidate (FDN-007)

Private quotation-bearing review and evidence history has been intentionally excluded from this candidate tree. See `docs/evidence/candidate-scope.md`.

**Status:** Accepted for private candidate; repository remains private because the DBKL rights path is separate and unresolved.

### Completed

- Replaced former quotation fields in `SourceClaim` with `boundaryNote` — project-authored boundary note stating each record is a reference to the official document, not project-authored research.
- Renamed `DraftStatementClass` value from the former quotation class to `source-reference`; renamed the former quotation statement type to `SourceReferenceStatement` with additional reference metadata fields (`document`, `page`, `documentUrl`, `retrievedDate`, `boundaryNote`).
- Updated `EvidenceBoard` section heading to "Official source references"; replaced blockquote rendering with reference card layout showing document title, page, official link, retrieval date, category, and boundary note.
- Updated `DraftReviewPanel` to display `source-reference` statements with document/page metadata.
- Updated `find_plan_evidence` WebMCP tool to return source-reference metadata instead of quotation content.
- Updated `createStructuredDraft` domain action to emit `source-reference` statements containing document/page/URL/boundary note instead of former quotation statements containing source text.
- Updated CSS badge class to `.source-reference`.
- Updated `scripts/validate_fixture.py` to require `boundaryNote` and reject former quotation fields in source claim records.
- Added FDN-007 RED→GREEN test coverage in `tests/data/source-reference-fixture.test.ts`, `tests/domain/source-reference-semantics.test.ts`, `tests/ui/source-reference-ui.test.tsx`, and `tests/webmcp/source-reference-adapter.test.ts`.
- Updated existing tests (fixture, domain, provenance, evals, adapter) for source-reference semantics.
- Updated all tracked documentation to reflect source-reference terminology, not quotation terminology.
- Evidence: `docs/evidence/fdn-007-dequoted-public-candidate.md`.

### Acceptance evidence

- 115 tests across 13 test files passed.
- `workflow:check`, `fixture:check`, `tdd:check`, typecheck, lint, build all pass.

### Branch boundary

- This is a private candidate. The DBKL source-reference gate is not cleared.
- This candidate contains only official source references (document title, page, URL), not direct quotations.
- No approval/export/copy/download/publish capability was added.
- Six WebMCP tool names preserved exactly. Human-only authority boundaries preserved.
- OSM attribution intact. No runtime egress.

## FDN-008 — Route Verdict redesign (private candidate)

**Status:** Implemented on `feat/route-verdict-redesign`; not pushed. The product
is transformed from a feature checklist into a resident-first, 30-second
route-impact verdict flow while preserving every truthful limitation and
authority boundary. Evidence: `docs/evidence/fdn-008-route-verdict-redesign.md`.

### Completed

- Deterministic verdict view-model (`src/domain/verdict.ts`): profile route
  rules, condition derivation from fixture segment tags + profile constraints +
  reviewed mappings, draft prefill, and typed agent-activity summaries.
- `selectProfile` now materially changes `activeSegmentIds` (not just a banner).
- Resident-first first screen: value proposition + `Start a route-impact check`
  CTA; illustrative limitation kept but compact.
- Verdict card + conditions shortlist before the dossier; plain-language
  concern actions replace `Stage`; pre-filled editable draft; visible
  assistant-activity summary from WebMCP mutations; full segments, evidence
  board, and audit trail demoted behind keyboard-operable disclosures.
- Mobile 390×844 above-fold gate: the full verdict card and a real keyboard-accessible `Review N conditions` action fit within the viewport for wheelchair, parent, and cyclist; redundant count/plan card lines removed/relocated (safety qualifier kept); 44px touch-target floor preserved.
- Honest limits preserved: no backend/network/storage/analytics/map tiles/chat
  runtime/dependency/public release; no claimed live navigation, verified
  accessibility, confirmed impact, construction timeline, DBKL commitment, or
  personal experience. OSM credit, source-reference vs curated-interpretation,
  six-tool invariant, revision invalidation, human-only approve/export, and
  no-egress are all intact.

### Acceptance evidence

- 142 vitest tests across 15 files pass; 16 Playwright tests pass (desktop +
  Mobile Chrome), including the new 390×844 above-fold, profile-driven
  differences, agent-activity, and six-tools browser tests.
- `workflow:check`, `fixture:check`, `tdd:check`, typecheck, lint, build all
  pass; `git diff --check 88f02f3..HEAD` clean.

### Not done

- No push, no public release, no manual visual QA pass, no re-run of a real
  local Chrome native WebMCP invocation (adapter tool surface unchanged; the
  browser test drives the real adapter via an injected fake `modelContext`).
- DBKL source-reference rights path remains unresolved; repository stays
  private.

## FDN-009 — WOW pass (private candidate)

**Status:** Implemented on `feat/wow-pass`; not pushed. Evidence:
`docs/evidence/fdn-009-wow-pass.md`.

### Completed

- Staged route overlays now use a glow-backed, reduced-motion-safe 600ms sweep
  and an accessible `Staged — awaiting your review` map chip.
- WebMCP activity now appears as a concise sticky/floating mobile `Agent is
  acting` banner with relative time and motion-safe presence treatment.
- Staging now produces a qualified, fixture-linked verdict delta without
  modifying verdict derivation semantics or human authority boundaries.
- The landing page has a static hand-rolled SVG route motif and stronger CTA;
  the started mobile workspace compacts that hero to preserve the 390×844
  verdict first-screen contract.

### Acceptance evidence

- 154 Vitest tests and 22 desktop/mobile Playwright checks pass.
- `workflow:check`, `fixture:check`, `tdd:check`, typecheck, lint, and build
  pass.
