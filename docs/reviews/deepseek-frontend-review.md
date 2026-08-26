# DeepSeek V4 Pro Review — Grounded Route FDN-002 Frontend

## Verdict
FAIL

## Evidence
- `npm run test` → 84 passed, 0 failed (6 files: 32 domain, 23 adapter, 9 evals, 9 fixture, 6 provenance UI, 5 workspace-flow UI).
- `npm run typecheck` → exit 0.
- `npm run lint` → exit 0.
- `npm run build` → exit 0 (33 modules, dist emitted).
- `npm run workflow:check` → PASS; `npm run fixture:check` → PASS; `npm run tdd:check` → PASS.
- `npx playwright test tests/e2e/human-first-flow.spec.ts` → 4 passed, 0 failed (2 desktop + 2 mobile).
- Source inspection: `src/App.tsx`, `src/ui/useWorkspaceBridge.ts`, `src/webmcp/adapter.ts`, `src/main.tsx`, `docs/evidence/fdn-002-frontend-evidence.md`.

## Findings
### DSK-UI-001 — BLOCKER — WebMCP tools re-register on every render and double-register under StrictMode
- **Criterion:** 2 — "Registration does not duplicate tools/state updates under normal app lifecycle, including React StrictMode if used."
- **Evidence / reproduction:** `src/ui/useWorkspaceBridge.ts:33` constructs a new `bridge` object literal on every render and returns it at `:47`. `src/App.tsx:35-47` runs the WebMCP registration effect with `[bridge]` as its only dependency. Because the object identity changes on every render, the effect tears down and re-runs on every state change (load, profile, stage, clear, draft, approve), each time calling `registerWebMcpTools(...)` and registering all six tools again. The cleanup at `src/App.tsx:44-46` only sets `cancelled = true`; it never unregisters tools. `src/main.tsx` wraps `<App />` in `<StrictMode>`, so in development the mount effect runs twice, registering the six tools twice before any user action.
- **Why it breaks the outcome:** In a real `document.modelContext` environment the agent-facing tool surface accumulates duplicate registrations (6 tools × every state change, plus a StrictMode double-mount), violating the "exactly once" bridge contract and making the shared `DomainState`/tool surface non-deterministic. The human-only path is unaffected only because `modelContext` is absent and the effect returns early, which is why the current tests do not catch it.
- **Required repair:** Make the bridge identity stable (e.g. memoize the `bridge` object with `useMemo`/`useRef`, or depend the effect on the stable `getState`/`replaceState` callbacks rather than the wrapper object), and add an unregister/cleanup path so StrictMode remounts do not leave duplicate tools. Add a test that asserts `registerTool` is invoked exactly once across a mount + state-change sequence under StrictMode.

### DSK-UI-002 — IMPORTANT — Evidence claims a "stable bridge dependency" that does not exist
- **Criterion:** 8 — "UI/e2e evidence is materially truthful … must match the actual source/history rather than mask failures."
- **Evidence / reproduction:** `docs/evidence/fdn-002-frontend-evidence.md` states "Called exactly once on mount (stable `bridge` dependency)". The source shows the opposite: `bridge` is a fresh object each render (`src/ui/useWorkspaceBridge.ts:33`), so the effect re-runs on every render and twice on a StrictMode mount. The claim is materially false and masks the DSK-UI-001 defect.
- **Why it breaks the outcome:** The evidence is the acceptance record for the WebMCP wiring; a false "stable dependency / exactly once" claim would let the duplicate-registration defect pass review unnoticed.
- **Required repair:** Correct the evidence to describe the actual registration lifecycle, and update it after DSK-UI-001 is fixed to document the verified single-registration behavior.

## Confirmed constraints
- Human-only mode works with `document.modelContext` absent; no separate UI-only authority state exists (single `humanPort`/`residentPort` controller).
- WebMCP mutations commit through `bridge.replaceState` to the same `DomainState` the UI renders; no DOM-direct mutation in the adapter.
- Keyboard/list flow (load → profile → evidence → stage/clear → draft → approve → export readiness) passes in unit and Playwright; the `aria-live` region receives meaningful reason text.
- Source quotes, curated interpretations, resident positions, and open questions are visibly separated with stable source/mapping IDs.
- Human actions audit as `human`; agent actions audit as `agent-tool`; `agentPort` exposes no approve/export/copy/download; approval invalidates on material mutation and export is gated on a valid approval snapshot.
- Local SVG map uses bundled fixture geometry/segment IDs, is labelled "Illustrative local route diagram — not navigation", and is supplemental to the semantic `RouteSegmentList`.
- No external map/font/image/API/model request, `localStorage`, unsafe HTML injection, WebMCP approval/export route, or backend/FastMCP was added.

## Claim ceiling
- No live browser `document.modelContext` environment was exercised; the duplicate-registration defect is therefore not covered by the current test suite.
- The E2E flow asserts export *readiness* (button enabled) but does not actually trigger the Blob download.
- FDN-002 modified FDN-001-owned paths (`src/contracts/types.ts`, `src/domain/actions.ts`, `package.json`, `vitest.config.ts`) to add `humanPort` and test dependencies; this is a scope-boundary deviation from `docs/IMPLEMENTATION_PLAN.md` but is not itself a frozen-criterion failure.
