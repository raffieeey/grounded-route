# Grounded Route — Implementation Plan

**Status:** Ready for the bootstrap/foundation ticket only. M0 must pass before UI/WebMCP feature work.

## Primary outcome and acceptance threshold

A resident can use a human-first page to inspect a bounded, evidence-labelled route scenario; later, a WebMCP agent can create only visible, reversible drafts using the same deterministic state model. The project is not acceptable if a source quotation can masquerade as an official segment impact, an agent can bypass current-revision approval, or an action leaks resident state off-device.

## Architecture decision

There is **no server backend or FastMCP service in this MVP**. “Backend” work means the local deterministic domain/state layer. “MCP” work means the browser WebMCP adapter. Adding a server/FastMCP component is out of scope unless a later evidence-backed need appears.

## Ticket order

| Ticket | Owner | Value class | Scope | Required acceptance |
|---|---|---|---|---|
| FDN-001 | Kimi K2.6 foundation | Core-value blocker | Scaffold, M0 fixture, schema validation, deterministic domain state/actions, workflow/TDD guards, unit tests | `npm run workflow:check`, `npm run test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass; M0 manifest is traceable. |
| FDN-002 | Kimi K2.6 frontend | Core-value blocker | React UI, map/list equivalence, evidence/draft/approval UI, accessibility and browser tests | Uses FDN-001 contracts without editing domain/data/config; keyboard/map-hidden journey passes. |
| FDN-003 | Kimi K2.6 WebMCP | Core-value blocker | WebMCP adapter, feature-gated tool registration, handler authorization, deterministic evaluation fixtures/tests | No UI/config edits; all stale/cross-scenario/export paths fail closed. |
| INT-001 | Orchestrator + independent review | Essential safeguard | Merge, run full gates, inspect actual WebMCP wiring, cross-family review, one bounded repair if needed | Main branch only after tests, build, static/security checks, and final review evidence. |

## Ownership boundaries

- **FDN-001 only:** `package.json`, lockfile, TypeScript/Vite configuration, `scripts/**`, `data/**`, `src/domain/**`, `src/contracts/**`, baseline WebMCP seam types, `tests/domain/**`, `tests/data/**`, `docs/PROGRESS.md`, and `docs/evidence/**`.
- **FDN-002 only:** `src/ui/**`, `src/App.tsx`, `src/main.tsx`, `src/styles/**`, `tests/ui/**`, `tests/e2e/**`.
- **FDN-003 only:** `src/webmcp/**`, `tests/webmcp/**`, `tests/evals/**`, and its own evidence file.
- No worker may modify another worker’s owned paths, the TDD, review artifacts, data governance documents, or project docs except the explicit progress/evidence paths assigned above.

## Frozen domain invariants

1. `SourceClaim` is an immutable quote and has no segment-impact fields.
2. `ScenarioImpactMapping` is an explicitly reviewed `curated-interpretation` with source IDs, segment IDs, rationale, uncertainty, reviewer, and review date.
3. Every state-changing action is deterministic, revisioned, auditable, and validates current route/scenario/evidence/mapping context.
4. Approval binds to an exact draft revision and snapshot. Any relevant mutation invalidates it.
5. WebMCP registration controls discoverability only; handlers independently fail closed.
6. The MCP layer cannot publish, copy, download, or make arbitrary network requests.
7. Runtime app egress is same-origin-only; user route/draft/note data does not leave the browser.

## Required fixture scope

Foundation must create one clearly labelled **illustrative KLDP2040 route-evidence demo**, not a claim about a live DBKL project. It must use a fictional demo origin/destination, a bounded KL Central civic-corridor geometry fixture, source quotes only when exact pages/URLs are verified, and curated mappings labelled with uncertainty. If direct source terms cannot be verified, mark data assets `pending`/excluded from public release; do not fabricate approval.

## Review/fix budget

- One initial independent final review after integration.
- At most one bounded repair pass for frozen blockers.
- New hardening observations after that become backlog unless they reproduce a core happy-path, confidentiality, or irreversible-integrity failure.
