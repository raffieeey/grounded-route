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

Added `tests/e2e/route-verdict-flow.spec.ts`. The first V4 assertion only
checked the verdict *top* edge (`box.y < 844`). The independent review
(DeepSeek V4, FDN-008-V4-01) proved with direct Playwright full-bounding-box
probes at 390×844 (`scrollY=0`) that the verdict card and first resident
action were clipped below the fold:

```
RED (probe, vite preview :4173, 390x844, scrollY=0):
  Wheelchair user      card_bottom=885.1  first_action_y=1767.6
  School-pickup parent card_bottom=910.3  first_action_y=1792.8
  Cyclist              card_bottom=885.1  first_action_y=1767.6
```

The V4 browser test was strengthened to measure the **full** bounding box of
both the verdict card and a real keyboard-accessible resident action for all
three profiles (`box.y + box.height <= 844`, `scrollY === 0`). This stronger
test failed before the repair (the `Review N conditions` action did not yet
exist and the card bottom exceeded 844 for every profile).

Repair (information hierarchy, not font shrinking): the redundant
`.verdict-count` line (which duplicated the headline's condition count) and
the `.verdict-plan` line were removed from the card; the plan-impact area
count was relocated into the `Conditions to review` shortlist as a compact
truthful summary; the verbose `Next:` text was replaced with a real
`Review N conditions` button that scrolls to and focuses the conditions
shortlist so the next resident action starts without guessing. The
illustrative/unverified safety qualifier stays in the card. Mobile card
padding/margins were compacted; the 44px mobile touch-target floor is
preserved (`button { min-height: 44px }`).

```
GREEN (probe, vite preview :4173, 390x844, scrollY=0):
  Wheelchair user      card_bottom=789.0  action_bottom=778.0
  School-pickup parent card_bottom=814.2  action_bottom=803.2
  Cyclist              card_bottom=789.0  action_bottom=778.0
npx playwright test -> 16 passed
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
  keyboard-operable disclosures. The 390×844 browser test measures the **full**
  bounding box of the verdict card and a real keyboard-accessible
  `Review N conditions` action for wheelchair, parent, and cyclist
  (`box.y + box.height <= 844`, `scrollY === 0`); the action scrolls to and
  focuses the conditions shortlist. Redundant count/plan card lines were
  removed/relocated (not the safety qualifier) so the hierarchy fits without
  shrinking fonts below the mobile target floor.
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
npx playwright test      -> 16 passed (V4 now full-bounding-box for 3 profiles)
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

## R2 focused repair — FDN-008-V5-01 (readable mobile draft prefills)

The V4 above-fold repair left a V5 draft-usability regression: at 390×844 the
prefilled `Draft review` fields did not show their full initial content. A
direct Playwright DOM probe (390×844, after start → profile → review conditions
→ add a concern) measured internal scrolling on every prefilled field.

RED (probe, vite preview :4173, 390x844, scrollY=0):

```
Wheelchair user
  Your position      valueLen=135  clientHeight=59  scrollHeight=102  (vertical scroll)
  Requested change   valueLen=145  clientHeight=59  scrollHeight=102  (vertical scroll)
  Open questions     valueLen=162  clientWidth=318  scrollWidth=1177  (horizontal scroll, one-line input)
School-pickup parent
  Your position      valueLen=141  clientHeight=59  scrollHeight=102
  Requested change   valueLen=151  clientHeight=59  scrollHeight=102
  Open questions     valueLen=168  clientWidth=318  scrollWidth=1220
Cyclist
  Your position      valueLen=128  clientHeight=59  scrollHeight=102
  Requested change   valueLen=138  clientHeight=59  scrollHeight=102
  Open questions     valueLen=155  clientWidth=318  scrollWidth=1114
```

Root cause: `Your position`/`Requested change` were fixed `rows={2}` textareas
that clipped ~135–151-character prefills to two visible rows, and `Open questions`
was a single-line `<input type="text">` so a ~155–168-character joined prefill
required horizontal scrolling.

Repair (resize-safe form control, not truncation): the three draft fields are now
auto-sizing textareas (`AutoTextarea` in `src/ui/DraftReviewPanel.tsx`). On every
value change a `useLayoutEffect` sets the height to the content `scrollHeight`, so
each prefilled field grows to show its full initial text with no internal scroll.
The `Open questions` one-line input became a wrapping textarea, removing the
horizontal scroll. `resize: none` + `overflow: hidden` keep the auto-sized box
stable; the 44px mobile touch-target floor is preserved for the submit button
(textareas are content-sized). Generated prefill text, labels, editability,
keyboard use, revision invalidation, and resident-only approve/export are
unchanged. A focused browser test
(`tests/e2e/route-verdict-flow.spec.ts`, `FDN-008-V5-01`) was added that measures
the real `scrollHeight`/`clientHeight` and `scrollWidth`/`clientWidth` of all
three prefilled fields for wheelchair, school-pickup parent, and cyclist at
390×844 (after start → profile → review conditions → add a concern), asserts
`scrollHeight <= clientHeight` and `scrollWidth <= clientWidth` with non-empty
prefill, and re-checks editability plus resident-only approval/export. This test
failed before the repair (above) and passes after.

GREEN (probe, vite preview :4173, 390x844, scrollY=0):

```
Wheelchair user
  Your position      valueLen=135  clientHeight=118  scrollHeight=118  clientWidth=318  scrollWidth=318
  Requested change   valueLen=145  clientHeight=118  scrollHeight=118  clientWidth=318  scrollWidth=318
  Open questions     valueLen=162  clientHeight=118  scrollHeight=118  clientWidth=318  scrollWidth=318
School-pickup parent
  Your position      valueLen=141  clientHeight=118  scrollHeight=118  clientWidth=318  scrollWidth=318
  Requested change   valueLen=151  clientHeight=118  scrollHeight=118  clientWidth=318  scrollWidth=318
  Open questions     valueLen=168  clientHeight=140  scrollHeight=140  clientWidth=318  scrollWidth=318
Cyclist
  Your position      valueLen=128  clientHeight=118  scrollHeight=118  clientWidth=318  scrollWidth=318
  Requested change   valueLen=138  clientHeight=118  scrollHeight=118  clientWidth=318  scrollWidth=318
  Open questions     valueLen=155  clientHeight=118  scrollHeight=118  clientWidth=318  scrollWidth=318
```

For every profile and field: `scrollHeight == clientHeight` and
`scrollWidth == clientWidth` — the full prefill is readable without internal
vertical or horizontal scrolling.

Gates (R2, all exit 0):

```
npm run workflow:check   -> WORKFLOW GUARD PASS
npm run fixture:check    -> FIXTURE VALIDATION PASS
npm run tdd:check        -> TDD GUARD PASS (14 exported names covered)
npm run test             -> 142 passed (15 files)
npm run typecheck        -> ok
npm run lint             -> ok
npm run build            -> built in 323ms
npx playwright test      -> 22 passed (V5-01 added 6: 3 profiles x 2 projects)
git diff --check 88f02f3..HEAD -> clean
```

## R2 honest limits / residual claim ceiling

- Only the reproducible FDN-008-V5-01 draft-readability regression was repaired.
  No V1–V7 assertion was relaxed, no fixture claim changed, no WebMCP
  tool/authority altered, no new dependency added.
- This is a private candidate; it was not pushed and no remote/visibility/history
  was changed.
- Auto-sizing measures `scrollHeight` on initial render; in jsdom (vitest) layout
  is unavailable so the resize is a no-op there — this is acceptable because the
  readable-prefill contract is enforced by the real-browser Playwright probe, not
  the unit tests.
- The verdict remains illustrative and fixture-bound; it does not verify
  accessibility, confirm a project impact, state a construction timeline, or
  represent a DBKL commitment.
