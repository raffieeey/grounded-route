# Grounded Route — Progress

## Baseline

- **Branch:** `main`
- **Baseline commit:** `b19e70d36bc886761678600b40b2ef6e5ee2212c`
- **Current phase:** Foundation / M0 fixture freeze
- **Primary outcome:** A resident and agent share a source-labelled route workspace without unsupported civic claims or agent-side export authority.
- **Current usability baseline:** No application code exists yet.
- **Minimum usable threshold for M1:** A human-only local app can select one profile/route, view evidence versus curated interpretation, stage/clear an overlay, and see revision-bound draft status without a WebMCP runtime.

## Invariants

See `docs/TECHNICAL_DESIGN.md` and `docs/IMPLEMENTATION_PLAN.md`.

## Current ticket

`FDN-001` — bootstrap the project, create the M0 fixture, deterministic contracts/actions, guard scripts, and RED→GREEN evidence.

## Verified state

- TDD v0.2 includes Sol review and focused verification PASS.
- No runtime implementation exists at this commit.
- M0 remains blocked until a traceable fixture and its validation are committed.

## Do not change without an explicit design decision

- Add a backend/FastMCP server.
- Send resident data, comments, or audit state to a network service.
- Treat OSM tags/mapping as certified accessibility or official DBKL segment facts.
- Allow tool handlers to export/publish/copy resident text.
