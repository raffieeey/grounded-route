# M0 Fixture-Freeze Checklist

**Status:** Blocking gate — do not start route/map/WebMCP implementation until all applicable boxes are evidenced.

## Scope freeze

- [x] One exact Kuala Lumpur demonstration corridor named and bounded: north Kampung Baru–Saloma Link–KLCC Park, with a 2.49 km Jalan Raja Abdullah/Jalan Sultan Ismail cyclist detour (FDN-013, 2026-08-27).
- [ ] One named planning scenario chosen; it is clearly labelled as a curated demonstration scenario.
- [ ] Three distinct preset profiles are defined: wheelchair user, school-pickup parent, cyclist.
- [x] Each profile has an explicit fixture route and constraints; no real home address is present.

## Source and mapping freeze

- [ ] `source_claims.json` contains 6–12 official source references with URL, document, page, review date, and boundary note (no copied source text).
- [ ] `scenario_impact_mappings.json` contains every claimed scenario-to-segment relationship.
- [ ] Each mapping has valid source IDs, valid segment IDs, rationale, uncertainty, named reviewer, and review date.
- [ ] No `SourceClaim` itself includes segment mapping or route-impact language.
- [x] `fixture_manifest.json` validates every cross-file ID reference and records a fixture version.

## FDN-013 real-geometry and divergence record

- [x] Every route segment records real OSM way reference(s); no synthetic diagonal geometry remains.
- [x] The Saloma north stair way (765200304) and elevator node (7146945539) were checked in the 2026-08-27 Overpass response.
- [x] The wheelchair route excludes every segment tagged `steps`; the parent traverses real `highway=steps` way 765200304 and the cyclist uses the physically separate Jalan Raja Abdullah/Jalan Sultan Ismail road-and-cycleway detour.
- [x] Fixture-level haversine point-to-polyline test proves at least 150 m wheelchair/cyclist divergence in both directions (448.1 m and 595.0 m respectively).

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
