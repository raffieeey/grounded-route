# FDN-003 WebMCP Rescue — Evidence

Branch: `feat/webmcp-glm-rescue` (clean from `main` baseline `70d2607`).
Scope: browser-native WebMCP layer + smallest shared domain extension for
auditable, labelled drafts and human-vs-agent audit events. No React UI,
backend, FastMCP, persistence, or deployment.

## Official API evidence (live-checked shape used directly)

```ts
await document.modelContext.registerTool({
  name: "tool_name",
  description: "...",
  inputSchema: { type: "object", properties: {}, required: [] },
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  execute: async (input, { signal }) => "plain text or JSON string",
}, { signal: controller.signal });
```

`exposedTo` is intentionally NOT modelled or set. `document.modelContext.executeTool`
is supported for isolation tests via the fake document in the test suites.

## Strict TDD — RED

Tests written before production files. To reproduce a clean RED, the production
edits were temporarily reverted (`git stash` of `src/contracts/types.ts` and
`src/domain/actions.ts`) and `src/webmcp/` moved aside, then the new tests ran
against the `main` baseline:

Command:

```bash
npx vitest run tests/webmcp tests/evals tests/domain
```

Output (verbatim tail):

```
 Test Files  3 failed (3)
      Tests  10 failed | 17 passed (27)
   Start at  10:45:26
   Duration  2.38s (transform 199ms, setup 0ms, collect 198ms, tests 42s, environment 4.71s, prepare 716ms)
```

The 17 passing are the pre-existing `main` domain tests; the 10 failing are the
new WebMCP/eval/structured-draft tests failing on missing imports
(`@/webmcp/index.ts`), missing `agentPort.createStructuredDraft` /
`agentPort.clearStagedMappings`, and missing `actor` on `AuditEvent`.

## Strict TDD — GREEN

After implementing the contract, domain, and adapter, all suites pass:

Command:

```bash
npx vitest run
```

Output (verbatim tail):

```
 ✓ tests/domain/actions.test.ts (27 tests) 30ms
 ✓ tests/evals/webmcp-evals.test.ts (9 tests) 19ms
 ✓ tests/webmcp/adapter.test.ts (23 tests) 38ms
 ✓ tests/data/fixture.test.ts (9 tests) 13ms

 Test Files  4 passed (4)
      Tests  68 passed (68)
```

## Gates

All required gates pass:

```bash
npm run workflow:check   # WORKFLOW GUARD PASS: foundation phase checks complete
npm run fixture:check   # FIXTURE VALIDATION PASS
npm run tdd:check        # TDD GUARD PASS: 9 exported names covered by tests
npm run test            # 68 passed (68)
npm run typecheck       # tsc -b --noEmit — clean
npm run lint            # eslint . — clean
npm run build           # tsc -b && vite build — built in 255ms
```

## Tool inventory (exactly six)

| Tool | Annotations | Hint |
|------|------------|------|
| `get_route_context` | `{ readOnlyHint: true }` | inspection |
| `find_plan_evidence` | `{ readOnlyHint: true, untrustedContentHint: true }` | evidence lookup |
| `stage_impact_overlay` | `{}` | mutation |
| `clear_staged_overlay` | `{}` | mutation |
| `draft_public_comment` | `{}` | mutation |
| `get_review_status` | `{ readOnlyHint: true }` | inspection |

No `approve`, `export`, `publish`, `copy`, `download`, `chat`, or `run` tool.
No tool sets `exposedTo`. All input schemas are `type: "object"` with `required`
arrays.

## Authority boundary

- `AuditActor = "human" | "agent-tool"`; not selectable by tool/user input.
- Raw/resident actions (raw `selectScenario`, `setActiveSegments`,
  `removeStagedMapping`, `approveDraft`) audit as `human`.
- `agentPort` mutation wrappers (`selectScenario`, `selectProfile`,
  `setActiveSegments`, `stageMapping`, `removeStagedMapping`, `createDraft`,
  `createStructuredDraft`, `clearStagedMappings`) audit as `agent-tool`.
- `agentPort` exposes no `approveDraft`/`requestExport`/`copy`/`download`.
- The adapter never calls `bridge.replaceState` on failure; invalid/stale/
  cross-scenario/duplicate calls return structured `INVALID_INPUT`,
  `PRECONDITION_FAILED`, or `STALE_CONTEXT` with no success audit and no
  bridge mutation. Successful mutations call `replaceState` exactly once.
- `DraftStatement` classes are exactly `source-quote`, `curated-interpretation`,
  `resident-position`, `open-question`. Curated interpretations retain
  `rationale` and `uncertainty`; source quotes carry `sourceClaimId`; no
  direct source quote can become an impact mapping (mapping IDs and source
  claim IDs are validated against separate scenario allowlists).
- Mutations invalidate the exact-revision approval snapshot; approval/export
  remain resident-only.

## Remaining browser/UI limits

This rescue scope delivers only the headless adapter + contract/domain
extension. It does NOT include: a React UI to render the workspace bridge,
wiring the adapter into a real `document.modelContext` at runtime, resident
approve/export UI, persistence, deployment, or any network access. The bridge
is an in-memory interface; a real host page must construct it and call
`registerWebMcpTools(document, bridge)`.
