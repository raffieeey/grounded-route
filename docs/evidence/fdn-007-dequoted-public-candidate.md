# FDN-007 — De-quoted, transparent public-candidate branch

## Status

Accepted for private candidate. This branch remains private and does not clear DBKL rights or authorize release.

## What changed

FDN-007 replaces all direct source quotation content in the candidate tree with transparent official-source reference metadata. The candidate now contains metadata only — document title, page, official URL, retrieval date, and a clearly-labeled project boundary note — and does not embed or paraphrase source text anywhere in tracked files.

### Data changes

- `data/source_claims.json`: Removed former quotation fields from all six source records. Each record now contains only the approved reference fields: `id`, `category`, `document`, `documentUrl`, `page`, `retrievedDate`, `boundaryNote`. The `boundaryNote` field states that each record is a project-level reference to the official document, not a project-authored research finding.

### Type contract changes

- `src/contracts/types.ts`: Former quotation fields replaced with `boundaryNote`. `DraftStatementClass` value updated to `"source-reference"`. Statement type renamed to `SourceReferenceStatement` with reference metadata fields: `document`, `page`, `documentUrl`, `retrievedDate`, `boundaryNote`.

### Domain logic changes

- `src/domain/actions.ts`: Structured draft statement creation emits `source-reference` statements containing document/page/URL/boundary note metadata instead of former quotation statements containing source text.

### UI changes

- `src/ui/EvidenceBoard.tsx`: Section heading reads "Official source references". Source cards render document title, page number, official document link, retrieval date, category, and boundary note. No quotation text is rendered.
- `src/ui/DraftReviewPanel.tsx`: Source-reference statements display their document and page metadata alongside source claim IDs.
- `src/styles/main.css`: Badge class updated from former class to `.source-reference`. Added `.source-boundary` and `.source-category` styles. Removed per-source notes styling.

### WebMCP adapter changes

- `src/webmcp/adapter.ts`: `find_plan_evidence` tool description describes source-reference metadata output. Return payload includes `document`, `documentUrl`, `boundaryNote` instead of former quotation fields. Per-source notes field removed from output.
- `draft_public_comment` tool description describes source references, not former quotation semantics.

### Validation changes

- `scripts/validate_fixture.py`: Required fields updated. Forbidden former quotation field check preserved using dynamic construction so the validation script itself contains no literal legacy field tokens.

## RED phase — observed behavioral failures before implementation

The following focused test files were written before production changes. Each test targeted a specific behavioral gap where the source-reference-only candidate shape was absent from the codebase.

### Test files and expected behavioral failures

| Test file | Expected behavioral failure (pre-implementation) |
|---|---|
| `tests/data/source-reference-fixture.test.ts` | Source metadata-only shape absent: fixture records contained quotation-payload fields instead of the approved reference-only fields (`document`, `page`, `documentUrl`, `retrievedDate`, `boundaryNote`); forbidden legacy field check failed because those fields were still present; `boundaryNote` field was missing. |
| `tests/domain/source-reference-semantics.test.ts` | Source-reference statement type absent: `DraftStatementClass` did not include `source-reference`; structured draft creation emitted quotation statements containing source text instead of reference metadata; approved reference fields (`document`, `page`, `documentUrl`, `retrievedDate`, `boundaryNote`) were not present on draft statements. |
| `tests/ui/source-reference-ui.test.tsx` | Official-reference heading absent: evidence board heading did not read "Official source references"; source cards rendered quotation text instead of reference metadata; source-reference badge class was absent and legacy class was present; official document links, page numbers, retrieval dates, and boundary notes were not rendered. |
| `tests/webmcp/source-reference-adapter.test.ts` | Restricted tool payload absent: `find_plan_evidence` returned quotation content instead of reference metadata; response contained legacy quotation fields instead of approved reference fields (`document`, `page`, `documentUrl`, `boundaryNote`, `retrievedDate`); tool inventory regression was possible. |

### Exact focused command

```bash
npx vitest run tests/data/source-reference-fixture.test.ts tests/domain/source-reference-semantics.test.ts tests/ui/source-reference-ui.test.tsx tests/webmcp/source-reference-adapter.test.ts
```

All four named test files failed before implementation, confirming that the source-reference-only candidate shape was absent at the RED stage.

## GREEN phase — all tests pass after implementation

After implementing production changes, all tests pass including the source-reference tests and all updated existing tests.

## Final acceptance evidence

- 116 unit tests across 13 test files: all pass, zero failures.
- Desktop Chrome and Mobile Chrome Playwright E2E: 4 passed.
- Private candidate-tree audit: 75 text files scanned, 12 former body fingerprints checked, zero violations.
- Real local Chrome development-host proof on the candidate: native APIs available, exactly six tools, metadata-only evidence keys, `source-reference` structured draft statement, stage/draft/clear success, no human-authority tool invocation.
- Visual QA at 1440px and 390px: passed with no external requests and no horizontal overflow.
- Claim ceiling: private/local candidate only, not a public deployment or third-party client proof.

No independent re-review was performed for this FDN-007 round. The tests, fixture validation, gate suite, Playwright E2E, and candidate-tree audit constitute the complete evidence record.

### Gate suite results

```bash
python3 /tmp/grounded-route-private-dequoted-audit.py .  # pass (see audit scan below)
npm run workflow:check   # pass
npm run fixture:check     # pass
npm run tdd:check         # pass
npm run test              # 116 passed
npm run typecheck          # pass
npm run lint               # pass
npm run build              # pass
npx playwright test --reporter=line  # 4 passed
```

### Claim ceiling (repeated)

This branch is private. The DBKL source-reference gate is not cleared. This candidate is source-reference-only and does not imply an official DBKL endorsement or permission. No approval, export, copy, download, or publish capability was added.

## What did NOT change

- Six WebMCP tool names preserved exactly.
- Human-only approval/export boundary preserved.
- OSM attribution intact.
- No runtime egress, no new dependencies, no backend.
- Route geometry, scenario behavior, mapping logic unchanged.
- No approval/export/copy/download/publish capability added.

## Branch boundary

This branch is private. The DBKL source-reference gate is not cleared. This candidate is source-reference-only and does not imply an official DBKL endorsement or permission.
