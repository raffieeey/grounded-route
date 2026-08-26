# M0 Fixture-Freeze Checklist

**Status:** Blocking gate — do not start route/map/WebMCP implementation until all applicable boxes are evidenced.

## Scope freeze

- [ ] One exact Kuala Lumpur 5–10 block demonstration area named and bounded.
- [ ] One named planning scenario chosen; it is clearly labelled as a curated demonstration scenario.
- [ ] Three distinct preset profiles are defined: wheelchair user, school-pickup parent, cyclist.
- [ ] Each profile has an explicit fixture route and constraints; no real home address is present.

## Source and mapping freeze

- [ ] `source_claims.json` contains 6–12 exact official excerpts with URL, document, page, and review date.
- [ ] `scenario_impact_mappings.json` contains every claimed scenario-to-segment relationship.
- [ ] Each mapping has valid source IDs, valid segment IDs, rationale, uncertainty, named reviewer, and review date.
- [ ] No `SourceClaim` itself includes segment mapping or route-impact language.
- [ ] `fixture_manifest.json` validates every cross-file ID reference and records a fixture version.

## Public-release readiness

- [ ] Every data/map asset appears in `THIRD_PARTY_DATA_MANIFEST.md`.
- [ ] Current source terms/attribution requirements have been checked and recorded.
- [ ] Any unresolved asset is removed from the public fixture/build.

## M0 acceptance record

When complete, record:

```text
Fixture version:
Area/scenario:
Reviewer:
Review date:
Validation command/output:
Known uncertainties:
```

A visually compelling map is not evidence. M0 passes only when the source → reviewed mapping → route segment chain is traceable for every staged overlay.
