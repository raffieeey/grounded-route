# FDN-002 Frontend Evidence

## RED phase — tests added before production UI code

### Date
2026-08-26

### Commands
```bash
npm run test
```

### Results
- Domain tests: 32 passed (including 5 new humanPort tests)
- WebMCP adapter tests: 23 passed
- Evaluation tests: 9 passed
- Fixture tests: 9 passed
- UI tests: 11 added, all failed because App.tsx was minimal shell
- Total: 73 passed, 9 failed (expected RED)

### Domain tests (humanPort) — passed
- humanPort exposes same actions as agentPort but audits as human
- humanPort.stageMapping stages and audits as human
- humanPort.createStructuredDraft creates draft and audits as human
- humanPort.clearStagedMappings clears and audits as human
- humanPort does not expose approveDraft or requestExport

### UI tests (RED — expected failures)
- `tests/ui/workspace-flow.test.tsx` — 6 tests, 4 failed (UI not yet implemented)
- `tests/ui/provenance-and-authority.test.tsx` — 6 tests, 4 failed (UI not yet implemented)

Failures were all due to missing UI elements in current App shell:
- "Load illustrative demo" button not found
- Workspace region not found
- Route segments list not found
- Draft review form not found
- Evidence board not found

## GREEN phase — after implementation

### Commands
```bash
npm run test
```

### Results
- Domain tests: 32 passed
- WebMCP adapter tests: 23 passed
- Evaluation tests: 9 passed
- Fixture tests: 9 passed
- UI tests: 11 passed
- Total: 84 passed, 0 failed

### E2E tests
```bash
npx playwright test tests/e2e/human-first-flow.spec.ts
```

Results: 4 passed (2 desktop chromium + 2 mobile chrome)

## Map implementation choice

**SVG local coordinate map** — chosen over maplibre-gl because:
- No external tile/font/style URL required
- No runtime fetch for map assets
- Renders actual fixture segment IDs and geometry accurately
- Clearly labelled "Illustrative local route diagram — not navigation"
- Staged mappings highlighted in accent blue (#0075de)
- All 14 segments and 4 places rendered from bundled GeoJSON fixtures
- Supplemental to the canonical ordered segment list (requirement #6 satisfied)

## WebMCP host wiring proof

App.tsx contains:
```typescript
useEffect(() => {
  const mc = (document as unknown as Record<string, unknown>).modelContext;
  if (!mc) return;
  const controller = new AbortController();
  void registerWebMcpTools(document, bridge, { signal: controller.signal });
  return () => {
    controller.abort();
  };
}, [bridge]);
```

- Feature-gated: returns early if `document.modelContext` absent
- The `bridge` object identity is stable across renders (`useWorkspaceBridge`
  memoizes the bridge over stable `getState`/`replaceState`/`announce`
  callbacks backed by a state ref), so this effect runs once per mount and does
  not re-register on load/profile/stage/draft state changes
- An `AbortController` cancels in-flight registration on a StrictMode remount
  and unregisters the tool batch on real unmount via the documented
  `{ signal }` option passed to each `modelContext.registerTool` call
- Uses the same `bridge` that the UI uses for state; adapter mutations update
  identical UI state via `replaceState`
- No manual agent tool invocation from UI

### Registration lifecycle evidence (DSK-UI-001 / DSK-UI-002 correction)

**RED (before fix):** The original `useWorkspaceBridge` constructed a fresh
`bridge` object literal on every render and `App` depended the registration
effect on `[bridge]`. With `document.modelContext` present and React
StrictMode, the focused lifecycle test (`tests/ui/workspace-bridge-lifecycle.test.tsx`)
showed duplicate `registerTool` calls: the six tools registered twice on the
StrictMode double-mount, and re-registered again on every resident state
change (load/profile/stage/draft). The effect cleanup only set a local
`cancelled` flag and never unregistered or aborted tools, so an unmount left
the active tool batch in place. This duplicated the agent-facing tool surface
and made the shared `DomainState`/tool surface non-deterministic — exactly the
DSK-UI-001 defect. The previous evidence claiming "exactly once on mount
(stable `bridge` dependency)" was materially false and is corrected here
(DSK-UI-002).

**GREEN (after fix):** `npx vitest run tests/ui/workspace-bridge-lifecycle.test.tsx`
(3 tests) passes:
- A `<App />` mounted under React `StrictMode` with a fake
  `document.modelContext` settles to exactly six active registrations
  (`get_route_context`, `find_plan_evidence`, `stage_impact_overlay`,
  `clear_staged_overlay`, `draft_public_comment`, `get_review_status`) — no
  duplicates from the StrictMode double-mount. The raw `registerTool` call
  count is exactly **6** after the settled mount (RED was **7**: the first
  interrupted setup's initial tool call plus the settled six-tool batch).
- Triggering resident load and profile-select state mutations through the same
  bridge produces no new `registerTool` calls (raw count stays **6**) and
  leaves the active count at 6.
- Unmount drives the abort signal so the active registration count drops to 0
  (no duplicate/leftover active tools).
- The `modelContext`-absent path remains safe (human-only, no throw).

## Accessibility

- Keyboard-only flow completes load → profile → inspect → stage → draft → approve → export
- All interactive elements have visible focus rings
- Semantic labels on all regions, lists, forms, and buttons
- `aria-live="polite"` announcer region for staged/draft/approval/clear events
- `aria-pressed` on profile buttons
- No map interaction required for full workflow

## Privacy / egress

- No fetch/XHR/WebSocket/localStorage/third-party calls
- Component tests verify no external requests during render
- E2E tests confirm zero external network requests during full workflow
- Export uses browser-local Blob and download link

## Remaining live-browser/visual limits

- Playwright E2E tests run against production build and pass
- No live WebMCP browser environment with real `document.modelContext` exercised
- Visual map is an illustrative SVG diagram, not interactive pan/zoom
- OSM tags are displayed as unverified context labels, never as certified accessibility data
