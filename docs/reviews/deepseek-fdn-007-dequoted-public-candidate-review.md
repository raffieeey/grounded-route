# DeepSeek V4 Pro Review — FDN-007 De-quoted Public Candidate

## Verdict
BACKLOG_ONLY

## Candidate
- baseline: `41c8507011c1a11869280bbdc0c8de4d71448001`
- candidate: `d029d264fd531d4ff9ef1bf466d9ac725ddbfe46`
- diff scope: 32 files changed (+553 / −687); source fixtures, contracts, domain, WebMCP adapter, UI/CSS, validation script, tests, and docs.

## Deterministic evidence
- `npm run workflow:check` → exit 0 (`WORKFLOW GUARD PASS`)
- `npm run fixture:check` → exit 0 (`FIXTURE VALIDATION PASS`)
- `npm run tdd:check` → exit 0 (`TDD GUARD PASS: 9 exported names covered`)
- `npm run test` → exit 0 (13 test files, **116 tests passed**, 0 failed)
- `npm run typecheck` → exit 0
- `npm run lint` → exit 0
- `npm run build` → exit 0 (34 modules, production build written)
- `npx playwright test --reporter=line` → exit 0 (4 passed, desktop + mobile)
- `git diff --check 41c8507011c1a11869280bbdc0c8de4d71448001..HEAD` → exit 0
- `python3 /tmp/grounded-route-private-dequoted-audit.py .` → exit 0; `tracked_text_files_scanned: 75`, `former_source_body_count_checked: 12`, `violations: {}`, `pass: true`

Note: dependencies were not present in the worktree; `npm install` (238 packages, 0 vulnerabilities) was run before the test/typecheck/build/Playwright gates. No tracked files were modified by the review.

## Frozen criteria
- C1: PASS — `data/source_claims.json` now contains only `id`, `category`, `document`, `documentUrl`, `page`, `retrievedDate`, `boundaryNote`; `quoteMs`/`quoteEn`/`notes` are gone. The private audit found zero former field tokens and zero of the 12 former source-body strings across 75 tracked text files. Boundary notes explicitly label each record as a project-level reference, not project-authored research. No semantically equivalent rewording of the six records remains in source fixtures. (Backlog note: see DSK-PUB-001 for residual "excerpt" terminology in historical/design docs.)
- C2: PASS — `EvidenceBoard` heading is "Official source references"; cards render document title, category, page, official link, retrieval date, and boundary note. The badge/class is `source-reference`, visibly distinct from `curated-interpretation`/`resident-position`/`open-question`. No "our research found" or "independent research" occurs in tracked product/docs text (audit + `rg`).
- C3: PASS — exactly six tool names preserved (`get_route_context`, `find_plan_evidence`, `stage_impact_overlay`, `clear_staged_overlay`, `draft_public_comment`, `get_review_status`). `find_plan_evidence` returns only reference metadata (document/page/URL/retrieval date/boundary note); `draft_public_comment` emits `source-reference` statements. No approval/export/copy/download/publish capability and no fetch/XHR/WebSocket/localStorage/clipboard egress introduced.
- C4: PASS — new tests (`source-reference-fixture`, `source-reference-semantics`, `source-reference-ui`, `source-reference-adapter`) plus updated existing tests assert no legacy quote fields/body content, transparent reference cards/tool results/drafts, and exactly-six/human-only authority. 116 tests pass; WebMCP eval/lifecycle coverage retained. (Backlog note: RED→GREEN evidence is a bare claim without recorded failing output — DSK-PUB-002.)
- C5: PASS — OSM attribution remains visible (`LocalRouteMap.tsx`) and exported (`export-payload.ts`). README/PROGRESS/manifest state the candidate is private, source-reference-only, and does not clear the DBKL gate. No runtime egress, geometry, scenario behavior, or authority invalidation changed. (Backlog note: see DSK-PUB-001 for stale "excerpt" wording in manifest/fixture/design/history docs.)

## Findings
- DSK-PUB-001 — BACKLOG — C1/C5 — LOW — `docs/evidence/fdn-005-public-release-rights-review.md:15`, `docs/TECHNICAL_DESIGN.md:68`, `docs/TECHNICAL_DESIGN.md:177`, `data/THIRD_PARTY_DATA_MANIFEST.md:27`, `data/fixture_manifest.json:52`
  - Reproduction: `rg -n -i "excerpt|currently ships|exact short" --glob '!node_modules/**' --glob '!dist/**' .`
  - Result: stale quotation-era wording remains in tracked docs; notably `docs/evidence/fdn-005-public-release-rights-review.md:15` states in present tense "Grounded Route currently ships six exact short PTKL2040 excerpts … and renders them in the evidence board/draft flow," which is now false, and `docs/TECHNICAL_DESIGN.md` still specifies `SourceClaim` records with "exact excerpts." `data/THIRD_PARTY_DATA_MANIFEST.md:27` says curated assets are "Compiled from verified source excerpts" while the same manifest's release-exclusion notice says "source references, not copied excerpts" (internal contradiction).
  - Required repair: correct these tracked docs to reflect the source-reference-only candidate (references, not excerpts/quotes) so they no longer misrepresent the current tree; the residual wording does not embed or paraphrase any source body text, so this is non-blocking.
- DSK-PUB-002 — BACKLOG — C4 — LOW — `docs/evidence/fdn-007-dequoted-public-candidate.md:42`
  - Reproduction: read the "RED → GREEN evidence" section.
  - Result: it asserts tests were written first but records no actual RED (failing) output; C4 asks for honest, non-quoting RED→GREEN evidence.
  - Required repair: record the observed pre-implementation failure output (field/token/semantic failures) for the focused tests.

## Claim ceiling
The candidate tree is de-quoted: no embedded DBKL/PTKL2040 quotation fields or body strings remain, and the UI/WebMCP/draft surfaces emit transparent source-reference metadata only. This review does not decide copyright/ODbL scope, DBKL permission, or authorize public release; the repository remains private and the DBKL rights gate stays unresolved. Findings above are documentation-consistency backlog, not defects that defeat the de-quoting outcome.
