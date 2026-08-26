# FDN-007 — De-quoted, transparent public-candidate branch

## Status

Accepted for private candidate. This branch remains private and does not clear DBKL rights or authorize release.

## What changed

FDN-007 replaces all direct DBKL/PTKL2040 quotation content (`quoteMs`, `quoteEn`) in the candidate tree with transparent official-source reference metadata. The candidate now contains metadata only — document title, page, official URL, retrieval date, and a clearly-labeled project boundary note — and does not embed or paraphrase PTKL2040 source text anywhere in tracked files.

### Data changes

- `data/source_claims.json`: Removed `quoteMs` and `quoteEn` fields from all six source records. Added `boundaryNote` field stating that each record is a project-level reference to PTKL2040, not a project-authored research finding. The original document is the authoritative source.
- `scripts/validate_fixture.py`: Updated required fields from `{quoteMs, quoteEn}` to `{boundaryNote}`. Added a check that `quoteMs` and `quoteEn` fields must not appear in any source claim record.

### Type contract changes

- `src/contracts/types.ts`: `SourceClaim.quoteMs` and `SourceClaim.quoteEn` replaced with `SourceClaim.boundaryNote`. `DraftStatementClass` value `"source-quote"` renamed to `"source-reference"`. `SourceQuoteStatement` renamed to `SourceReferenceStatement` with additional reference metadata fields: `document`, `page`, `documentUrl`, `retrievedDate`, `boundaryNote`.

### Domain logic changes

- `src/domain/actions.ts`: Structured draft statement creation now emits `source-reference` statements containing document/page/URL/boundaryNote metadata instead of `source-quote` statements containing quotation text.

### UI changes

- `src/ui/EvidenceBoard.tsx`: Section heading changed from "Direct source quotes" to "Official source references". Source cards now render document title, page number, official document link, retrieval date, category, and boundary note. Blockquote rendering of source text removed.
- `src/ui/DraftReviewPanel.tsx`: Source-reference statements display their document and page metadata alongside source claim IDs.
- `src/styles/main.css`: Badge class `.source-quote` renamed to `.source-reference`. `.source-quote-text` replaced with `.source-reference-meta`. Added `.source-boundary` and `.source-category` styles.

### WebMCP adapter changes

- `src/webmcp/adapter.ts`: `find_plan_evidence` tool description updated to describe source-reference metadata output instead of quotes. Return payload now includes `document`, `documentUrl`, `boundaryNote` instead of `quoteMs`, `quoteEn`.

## RED → GREEN evidence

### RED phase

Tests were written before production changes. The following tests were observed to fail:

1. `tests/data/source-reference-fixture.test.ts`: "source claims contain no quoteMs or quoteEn fields" — FAILED because `quoteMs` and `quoteEn` still existed.
2. `tests/data/source-reference-fixture.test.ts`: "source claims contain boundaryNote field" — FAILED because `boundaryNote` did not exist.
3. `tests/domain/source-reference-semantics.test.ts`: "DraftStatementClass includes source-reference, not source-quote" — FAILED because `source-quote` was still the class.
4. `tests/ui/source-reference-ui.test.tsx`: "evidence board heading says 'Official source references'" — FAILED because heading still said "Direct source quotes".
5. `tests/webmcp/source-reference-adapter.test.ts`: "find_plan_evidence returns reference metadata, not quote fields" — FAILED because payload still contained `quoteMs`/`quoteEn`.

### GREEN phase

After implementing production changes, all 115 tests pass including the new FDN-007 tests and all updated existing tests.

## What did NOT change

- Six WebMCP tool names preserved exactly.
- Human-only approval/export boundary preserved.
- OSM attribution intact.
- No runtime egress, no new dependencies, no backend.
- Route geometry, scenario behavior, mapping logic unchanged.
- No approval/export/copy/download/publish capability added.

## Branch boundary

This branch is private. The DBKL exact-excerpt gate is not cleared. This candidate is source-reference-only and does not imply an official DBKL endorsement or permission.
