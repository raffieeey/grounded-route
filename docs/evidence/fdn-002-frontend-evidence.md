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
  registerWebMcpTools(document, bridge).then(() => {
    // Registration complete
  });
}, [bridge]);
```

- Feature-gated: returns early if `document.modelContext` absent
- Called exactly once on mount (stable `bridge` dependency)
- Uses same `bridge` that the UI uses for state
- Adapter mutations update identical UI state via `replaceState`
- No manual agent tool invocation from UI

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
