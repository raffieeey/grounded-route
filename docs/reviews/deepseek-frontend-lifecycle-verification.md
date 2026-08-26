# DeepSeek Verification — DSK-UI-001 / DSK-UI-002

## Verdict
FAIL

## Exact probe
- A temporary raw-call fake `document.modelContext` rendered `<StrictMode><App /></StrictMode>` and appended one record per `registerTool` invocation.
- The direct Vitest probe failed at `expected 7 to be 6` immediately after settled StrictMode mount.
- The seven raw calls consist of the first interrupted setup's initial tool registration plus the settled setup's six-tool registration batch. Active-name deduplication hides this extra invocation, so it cannot prove exact-once registration.
- The temporary probe was removed; no production or test files were edited.

## Finding status
- DSK-UI-001: STILL BLOCKED — raw StrictMode registration invocation count is 7, not the required exactly 6. Stable bridge identity prevents state-change re-registration, but the initial StrictMode lifecycle still invokes `registerTool` once before abort and then invokes the complete six-tool batch.
- DSK-UI-002: STILL BLOCKED — the current evidence's claim of no duplicates from the StrictMode double-mount is materially false under the raw-count probe.

## Claim ceiling
- The runtime test proves the local fake-host lifecycle behavior. No live browser `document.modelContext` host was available.
