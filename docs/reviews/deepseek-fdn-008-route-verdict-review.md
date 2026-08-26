# DeepSeek V4 Pro Review — FDN-008 Route Verdict

## Verdict
BLOCK

## Candidate
- baseline: `88f02f3e490bc450ab3c302bbb1199167e5a1ede`
- candidate: `6b9fc55` (`feat!: FDN-008 — resident-first route-impact verdict redesign`)
- diff scope: `README.md`, `data/route_profiles.json`, `docs/PROGRESS.md`, `docs/evidence/fdn-008-route-verdict-redesign.md`, `scripts/validate_fixture.py`, `src/App.tsx`, `src/contracts/types.ts`, `src/domain/actions.ts`, `src/domain/verdict.ts` (new), `src/styles/main.css`, `src/ui/AssistantActivity.tsx` (new), `src/ui/AuditConsentStrip.tsx`, `src/ui/ConditionsShortlist.tsx` (new), `src/ui/DraftReviewPanel.tsx`, `src/ui/RouteSegmentList.tsx`, `src/ui/VerdictCard.tsx` (new), `src/ui/WorkspaceControls.tsx`, plus tests. 28 files, +2179/−384.

## Deterministic evidence

All contract gates reproduced locally (fresh `npm install`, then each command):

- `npm run workflow:check` → `WORKFLOW GUARD PASS`
- `npm run fixture:check` → `FIXTURE VALIDATION PASS`
- `npm run tdd:check` → `TDD GUARD PASS: 14 exported names covered by tests`
- `npm run test` → `Test Files 15 passed (15)` / `Tests 142 passed (142)`
- `npm run typecheck` → exit 0 (no output)
- `npm run lint` → exit 0 (no output)
- `npm run build` → `✓ built in 426ms`
- `npx playwright test --reporter=line` → `PASS (16) FAIL (0)`
- `git diff --check 88f02f3e490bc450ab3c302bbb1199167e5a1ede..HEAD` → clean (exit 0)

### Direct 390×844 full-bounding-box probe (Playwright, `vite preview` on 4173)

Flow: `Start a route-impact check` → select each profile → measure full bounding boxes (no scrolling, `scrollY=0`).

| Profile | verdict card bottom | next-action text bottom | first resident action (`Add to my draft`) y |
|---|---|---|---|
| Wheelchair user | **885.1px** | 818.8px | **1767.6px** |
| School-pickup parent | **910.3px** | 844.0px | **1792.8px** |
| Cyclist | **885.1px** | 818.8px | **1767.6px** |

Per-element verdict-card content (Wheelchair user, viewport 844px):

- `.verdict-headline` bottom 670.8px (visible)
- `.verdict-qualifier` bottom 765.3px (visible)
- `.verdict-next-action` bottom 818.8px (visible)
- `.verdict-count` bottom **846.5px** (clipped below fold)
- `.verdict-plan` bottom **870.1px** (clipped below fold)

The verdict card region bottom is 885.1px (wheelchair/cyclist) and 910.3px (parent), all exceeding the 844px viewport. The first resident action is far below the fold in every profile.

## Frozen criteria

- V1: PASS — First screen renders `Will a city plan change your route?` with a resident value proposition and `Start a route-impact check` CTA; no `fixture`/`Load illustrative demo` jargon leads. Proven by `tests/e2e/route-verdict-flow.spec.ts` V1 and `src/App.tsx`.
- V2: PASS — `selectProfile` sets `activeSegmentIds` to deterministic profile `routeSegmentIds`; three profiles have materially different route sets, and the wheelchair route avoids `steps` segments and uses `seg-wheelchair-alternate` + `seg-saloma-elevator-ramp`. Proven by `tests/domain/verdict.test.ts` and `data/route_profiles.json`.
- V3: PASS — `computeRouteVerdict` derives the headline/count/qualifier/next-action only from fixture segment tags + profile constraints + reviewed mappings; the qualifier states "not a verified project impact, construction timeline, accessibility finding, or DBKL commitment"; conditions use plain segment names with no `seg-*`/`map-*` IDs in resident-facing text. Proven by `tests/domain/verdict.test.ts` and `src/domain/verdict.ts`.
- V4: **BLOCK** — The entire verdict is not visible at 390×844; the verdict card bottom is 885.1–910.3px (see finding FDN-008-V4-01), and the first resident action sits at ~1767–1793px. The existing browser test only asserts the top edge (`box.y < 844`), which is the weaker assertion the contract forbids.
- V5: PASS — `buildDraftPrefill` produces an editable, profile/condition-derived prefill; `DraftReviewPanel` renders separate editable `Your position` / `Requested change` / `Open questions` fields; `createStructuredDraft` emits `curated-interpretation`, `source-reference`, `resident-position`, and `open-question` statement classes and the export text separates all four; the prefill asserts no invented personal experience or confirmed fact; approval/export remain on `ResidentPort` only. Proven by `tests/domain/verdict.test.ts`, `tests/e2e/route-verdict-flow.spec.ts`, `src/domain/actions.ts:316-414`.
- V6: PASS — No in-app LLM/chat; `summarizeAgentActivity` renders concise human-readable summaries from typed agent audit events; absent `modelContext` shows no assistant-activity card; exactly six tools (`get_route_context`, `find_plan_evidence`, `stage_impact_overlay`, `clear_staged_overlay`, `draft_public_comment`, `get_review_status`) register. Proven by `tests/e2e/route-verdict-flow.spec.ts`, `src/webmcp/adapter.ts:26-32`, `src/ui/AssistantActivity.tsx`.
- V7: PASS — OSM credit (`© OpenStreetMap contributors` + copyright link) preserved in `src/ui/LocalRouteMap.tsx:186-190`; source-reference vs curated-interpretation distinction preserved behind disclosure (`src/ui/EvidenceBoard.tsx`); raw IDs/audit trail demoted behind disclosures; mobile `button { min-height: 44px }` touch-target floor preserved (`src/styles/main.css:526-529`); no `fetch`/XHR/WebSocket/localStorage/clipboard egress in the adapter (`src/webmcp/adapter.ts`).

## Findings

### FDN-008-V4-01 — Entire verdict not visible at 390×844 (BLOCK)

- **Criterion:** V4 — "On a 390×844 viewport before disclosure, the user can see the verdict and one meaningful next action"; required evidence mandates full bounding boxes for the verdict, its next-action text, and the first resident action — not a top-edge assertion.
- **Severity:** P1 (frozen acceptance criterion unmet).
- **File/line:** verdict content `src/ui/VerdictCard.tsx:21-31` (`.verdict-count` at line 21, `.verdict-plan` at lines 26-31); mobile CSS `src/styles/main.css:616-651` and `src/styles/main.css:879-894`; weaker test assertion `tests/e2e/route-verdict-flow.spec.ts` (V4 test asserts only `box.y < 844`).
- **Reproduction:**
  ```
  npm run build && npx vite preview --port 4173
  # Playwright: viewport 390x844; click "Start a route-impact check"; click "Wheelchair user"
  verdict.boundingBox() -> bottom 885.1px (> 844)
  verdict.locator('.verdict-count').boundingBox() -> bottom 846.5px (> 844)
  verdict.locator('.verdict-plan').boundingBox() -> bottom 870.1px (> 844)
  page.getByRole('region', { name: 'Conditions to review' }).getByRole('button').first().boundingBox() -> y 1767.6px (off-screen)
  ```
  Same failure reproduces for parent (card bottom 910.3px) and cyclist (885.1px).
- **Required repair:** Make the entire verdict card fit within 844px at 390×844 (e.g. drop/merge the redundant `.verdict-count` line — which duplicates the headline — and the `.verdict-plan` line, or move them into the conditions shortlist / a disclosure), and strengthen the V4 browser test to assert the full bottom edge (`box.y + box.height <= 844`) plus the visibility of the first resident action, instead of the top-edge check.

## Claim ceiling

Review is based on direct source/test reads of the candidate at `6b9fc55` and a fresh local reproduction of every contract command plus a dedicated Playwright/DOM full-bounding-box probe at 390×844 against a local `vite preview` server. No image files were opened. The BLOCK rests on measured geometry (verdict card bottom > 844px) rather than implementation claims. V1–V3 and V5–V7 are assessed from source and passing tests; no live Chrome-native WebMCP invocation was re-executed (the adapter tool surface and the injected-`modelContext` browser path were verified instead).
