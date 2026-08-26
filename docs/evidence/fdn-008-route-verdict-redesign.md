# FDN-008 — Route Verdict redesign (RED → GREEN evidence)

Private product-redesign candidate on branch `feat/route-verdict-redesign`.
Baseline: `88f02f3e490bc450ab3c302bbb1199167e5a1ede` (116 vitest tests, all gates,
4 Playwright flows). This candidate was not pushed; no remote/visibility/history
was altered.

## Thesis implemented

Grounded Route is now a 30-second, resident-first route-impact verdict tool.
A resident starts a route-impact check, selects a mobility profile, immediately
sees a deterministic illustrative verdict (conditions to review + unknown
qualifier + next action), reviews a shortlist of plain-language conditions,
adds the ones that matter to an editable pre-filled draft, and alone
approves/exports. WebMCP browser-assistant mutations surface a concise, visible
assistant-activity summary; the resident remains the only approver/exporter.

The verdict is a fixture-bound planning/review prompt. It is **not** live
navigation, verified accessibility, a confirmed project impact, a construction
timeline, or a DBKL commitment.

## Strict TDD (RED → GREEN)

### Cluster 1 — domain verdict layer (RED observed)

Wrote `tests/domain/verdict.test.ts` before implementation. First run failed:

```
Error: Failed to resolve import "@/domain/verdict.ts" from "tests/domain/verdict.test.ts".
Test Files  1 failed (1)
  Tests  no tests
```

After implementing `src/domain/verdict.ts`, extending
`data/route_profiles.json` with deterministic illustrative `routeSegmentIds`,
and making `selectProfile` set `activeSegmentIds` to the profile route:

```
✓ tests/domain/verdict.test.ts (13 tests)
```

One assertion was refined during GREEN: the "never claims a confirmed impact"
check originally matched the qualifier's own negation ("not a ... construction
timeline"). The assertion was tightened to reject positive claims
(`is confirmed|will be built|is accessible|DBKL commits|verified accessible`)
while still requiring the qualifier to say `not a verified`.

### Cluster 2 — UI redesign (RED observed)

Wrote `tests/ui/route-verdict.test.tsx` (V1–V6) before the UI. First run:

```
Test Files  1 failed (1)
  Tests  11 failed | 1 passed (12)
```

Representative failures: `Start a route-impact check` button not found
(first screen still showed "Load illustrative demo"); `region "Route impact
check"` not found; `region "Conditions to review"` not found; `region
"Assistant activity"` not found.

After implementing `VerdictCard`, `ConditionsShortlist`, `AssistantActivity`,
the pre-filled editable `DraftReviewPanel`, the disclosure-gated
`AuditConsentStrip`/`RouteSegmentList`/`EvidenceBoard`, and the new `App`
composition, plus rewriting the existing FDN-002/006/007 UI tests to the new
contract:

```
Test Files  15 passed (15)
  Tests  142 passed (142)
```

### Cluster 3 — browser tests (RED observed)

Added `tests/e2e/route-verdict-flow.spec.ts`. First Playwright run failed the
V4 above-fold test on both projects:

```
V4: verdict and next action are visible at 390x844 without opening disclosures
Expected: < 300
Received:   872.375
2 failed
```

The verdict was pushed below the 844px fold by the disclaimer + profile banner.
Fix: removed the redundant profile banner (the verdict already names the
profile), compacted the disclaimer/value-prop/corridor title on mobile, and
asserted the verdict top is within the first screen (`< 844`). Final:

```
16 passed (8.6s)
```

## V1–V7 acceptance mapping

- **V1 first-screen value + CTA**: `App.tsx` header renders
  "Will a city plan change your route?" + a value proposition and a primary
  `Start a route-impact check` CTA. The illustrative limitation stays visible
  but compact. No "fixture"/"Load illustrative demo" jargon leads the page.
- **V2 profiles materially change state**: `selectProfile` now sets
  `activeSegmentIds` to the profile's deterministic `routeSegmentIds`
  (`src/domain/verdict.ts` / `data/route_profiles.json`). Tests prove the
  wheelchair route avoids `steps` segments and uses the step-free alternate +
  elevator/ramp; the three profiles have materially different route sets and
  different verdict/condition counts.
- **V3 plain verdict**: `computeRouteVerdict` derives a verdict only from
  fixture segment tags, profile constraints, and reviewed mappings. The
  verdict card names the profile, condition count, an "illustrative / field
  verification" qualifier, and a next action. No raw mapping/segment IDs appear
  in resident-facing verdict/condition text.
- **V4 actionable flow**: `Stage` is replaced by plain-language actions
  ("Add to my draft" / "Added — remove from draft"; advanced "Show possible
  plan impact"). Default view shows verdict + map + conditions shortlist;
  full route segments, evidence board, and audit trail are behind
  keyboard-operable disclosures. The 390×844 browser test proves the verdict
  and next action are visible without opening disclosures.
- **V5 editable pre-filled draft**: `buildDraftPrefill` builds an editable
  structured draft from the profile + conditions + reviewed mappings/source
  references. The draft separates resident-position, requested-change,
  source-reference, curated-interpretation, and open-question statements. It
  is a review template (no invented personal experience, no unverified claim
  stated as fact). Human-only approve/export and revision invalidation are
  unchanged.
- **V6 visible WebMCP**: No in-app LLM/chat was added. `summarizeAgentActivity`
  turns typed agent-tool audit events into a concise resident-facing
  assistant-activity summary (no raw audit rows). The human flow is fully
  useful without `document.modelContext` (no assistant-activity card appears).
  The browser test injects a fake `modelContext`, drives `get_route_context`
  then `stage_impact_overlay` through the real adapter, and asserts the
  visible summary. Tool inventory stays exactly six with no
  approve/export/copy/download/publish/chat capability.
- **V7 honest limits**: OSM credit and no-egress behavior preserved.
  Source-reference vs curated-interpretation distinction preserved (behind
  disclosure). Raw IDs and the audit trail are demoted from the default view
  but remain in advanced/provenance/audit disclosures and in the export
  metadata. Mobile touch-target baseline preserved (44px min-height).

## Gates

All exit 0:

```
npm run workflow:check   -> WORKFLOW GUARD PASS
npm run fixture:check    -> FIXTURE VALIDATION PASS
npm run tdd:check        -> TDD GUARD PASS (14 exported names covered)
npm run test             -> 142 passed (15 files)
npm run typecheck        -> ok
npm run lint             -> ok
npm run build            -> built in 274ms
npx playwright test      -> 16 passed (8.6s)
git diff --check 88f02f3..HEAD -> clean
```

## Honest limits / not done

- This is a private candidate. It was not pushed; no public release, no
  backend, no network requests, no storage, no analytics, no map tiles, no
  in-app LLM/chat, and no new dependency were added.
- The verdict is illustrative and fixture-bound. It does not verify
  accessibility, confirm a project impact, state a construction timeline, or
  represent a DBKL commitment. Every condition is labelled unverified.
- The deterministic profile route/concern rules are project-authored fixture
  metadata, explicitly illustrative, and validated by `scripts/validate_fixture.py`
  and `tests/data/fixture.test.ts`.
- Visual quality was verified only through the automated 390×844 above-fold
  gate and the existing Playwright desktop/mobile flows; no manual visual QA
  pass was run in this round. A real local Chrome native WebMCP invocation was
  not re-executed here (the adapter is unchanged in tool surface; the browser
  test injects a fake `modelContext` to drive the real adapter paths).
- The DBKL source-reference rights path remains unresolved; the repository
  stays private.
