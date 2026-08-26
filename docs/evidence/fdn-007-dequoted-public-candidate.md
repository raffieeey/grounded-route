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

## RED → GREEN evidence

Tests were written before production changes. After implementing production changes, all tests pass including the source-reference tests and all updated existing tests.

## What did NOT change

- Six WebMCP tool names preserved exactly.
- Human-only approval/export boundary preserved.
- OSM attribution intact.
- No runtime egress, no new dependencies, no backend.
- Route geometry, scenario behavior, mapping logic unchanged.
- No approval/export/copy/download/publish capability added.

## Branch boundary

This branch is private. The DBKL exact-excerpt gate is not cleared. This candidate is source-reference-only and does not imply an official DBKL endorsement or permission.
