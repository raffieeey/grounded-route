# FDN-004 — Live Browser WebMCP Evidence

## Verdict

**PASS for local Chrome WebMCP development-host integration.**

## Date

2026-08-26

## Browser and host

- Browser: Chrome `151.0.7922.108` on Linux, launched headed under Xvfb with an isolated profile.
- Local-development flag: `chrome://flags/#enable-webmcp-testing` set to **Enabled**, then browser relaunched.[1]
- Application: the production build of Grounded Route served locally at `http://127.0.0.1:4173/`.
- The page was a secure context. Its native browser APIs exposed both `document.modelContext` and `navigator.modelContextTesting`.
- This verifies the imperative `document.modelContext` path used by the application, not a server MCP substitute.[2]

## Native registration evidence

After the application loaded, native `document.modelContext.getTools()` and `navigator.modelContextTesting.listTools()` each returned exactly six registered tools:

1. `get_route_context`
2. `find_plan_evidence`
3. `stage_impact_overlay`
4. `clear_staged_overlay`
5. `draft_public_comment`
6. `get_review_status`

No approval, export, copy, download, publication, submission, or generic catch-all tool appeared in the native browser registry.

## Live native execution evidence

The testing sequence used the browser-native `document.modelContext.executeTool(tool, jsonArgs)` API against the actual rendered application state:

1. The resident loaded the illustrative demo and selected the wheelchair profile through the human UI. Native `get_route_context` returned scenario `saloma-link-active-mobility-demo`, profile `profile-wheelchair`, revision `2`, and no staged mapping.
2. Native `find_plan_evidence` for `sc-01` returned the fixture-bound source quote and no mutation.
3. Native `stage_impact_overlay` for fixture-approved `map-01` at revision `2` succeeded and returned revision `3`.
   - The rendered UI showed `Staged: 1`.
   - The rendered audit trail showed one controlled `agent-tool` action.
4. Native `draft_public_comment` at revision `3` succeeded and returned a structured local draft containing all four required statement classes: `curated-interpretation`, `source-quote`, `resident-position`, and `open-question`.
5. Native `get_review_status` after the draft reported `human: 2`, `agentTool: 2`, `hasDraft: true`, and `approvalValid: false`.
6. Native `clear_staged_overlay` at revision `4` succeeded and returned revision `5`; the rendered `Staged: 1` indicator disappeared and review status showed no staged mappings.

The tool test deliberately did not approve or export anything: those capabilities remain resident-only direct UI actions and are absent from the WebMCP registry.

## Prior deterministic gates retained

Before the live-host proof, the merged private `main` branch passed:

```bash
npm run workflow:check
npm run fixture:check
npm run tdd:check
npm run test
npm run typecheck
npm run lint
npm run build
npx playwright test --reporter=line
```

The suite reported 91 tests passing and four Playwright flows passing across desktop Chromium and Mobile Chrome.

## Claim ceiling

- This is a real native Chrome development-host proof with the documented local testing flag enabled. It is not yet an origin-trial/public-deployment or third-party agent-client demonstration.
- Local native execution proves registration, typed state changes, and rendered UI synchronization; it does not claim a particular external AI client will choose the tools correctly.
- Human approval/export behavior remains covered by the resident UI and deterministic tests; this live WebMCP run correctly did not invoke those prohibited agent capabilities.
- Browser-local Blob export readiness is tested, but download bytes are not independently asserted.

## Sources

[1] https://developer.chrome.com/docs/ai/webmcp — Chrome WebMCP overview
[2] https://developer.chrome.com/docs/ai/webmcp/imperative-api — Chrome WebMCP Imperative API
