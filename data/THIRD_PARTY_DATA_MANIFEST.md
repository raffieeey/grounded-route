# Third-Party Data and Attribution Manifest

**Status:** M0 fixture freeze complete. Public release is **EXCLUDED** pending verification of all third-party terms.

## Purpose

This manifest separates project-authored code/documentation (MIT) from external data, references, and assets. It is required before a fixture or app build becomes public.

## Required fields per shipped asset

| Field | Required value |
|---|---|
| Asset / fixture file | Exact repository path or package asset name |
| Source | Canonical source URL and organization |
| Retrieval date | ISO date of the exact extraction/download |
| Transformation | What was filtered, simplified, referenced, or derived |
| Attribution location | Where a user sees source/attribution in app, export, README, or NOTICE |
| License / terms evidence | URL and date checked; do not rely on memory |
| Release status | `verified`, `pending`, or `excluded` |

## M0 fixture assets

| Asset / fixture | Source | Transformation | Attribution location | License / terms status | Release decision |
|---|---|---|---|---|---|
| `data/source_claims.json` records | DBKL Kuala Lumpur Development Plan 2040 documents; https://ppkl.dbkl.gov.my/en/muat-turun/ | Official source references only (document title, page, URL, retrieval date, boundary note); no copied source text | Evidence card + exported draft + README | **Resolved 2026-08-26:** records are bibliographic citations only (title/page/URL/retrieval date + boundary note); no DBKL text, images, maps, or tables are reproduced anywhere in the repo. DBKL's copyright notice (https://www.dbkl.gov.my/notis-hak-cipta/, checked 2026-08-26) reserves rights over its content, which we do not copy. Citing a publicly published government planning document by title/page/URL is standard reference practice and is exactly what the DBKL public-comment process expects of residents. Decision recorded per owner direction (government agency; publicly available information; citation only). | **Verified for release** — citation-as-reference only; no copied content |
| `data/route_segments.geojson` and `data/places.geojson` | OpenStreetMap / Overpass extraction; https://www.openstreetmap.org/ and https://overpass-turbo.eu/ | Small bounded illustrative geometry subset, simplified for a demo | Map/list attribution (`src/ui/LocalRouteMap.tsx`) + exported draft (`src/ui/export-payload.ts`) + README/NOTICE | **Verified:** OSM data is ODbL (https://api.openstreetmap.org/copyright, checked 2026-08-26) and requires credit to OpenStreetMap and contributors. Required attribution is **implemented** in app UI and export metadata. | **Verified** — attribution display implemented and upstream terms verified in build |
| `data/fixture_manifest.json`, `data/demo_scenarios.json`, `data/route_profiles.json`, `data/scenario_impact_mappings.json` | Project-authored curation | Compiled from verified source references and illustrative geometry | README/NOTICE | Project-authored (MIT) | **Verified** — all upstream terms resolved (OSM verified; DBKL resolved as citation-as-reference) |

## Public-release checklist

- [x] Every committed fixture asset appears in this manifest.
- [x] Source URL, retrieval date, and transformation are recorded.
- [x] License/terms were verified from an authoritative current source and linked here (OSM).
- [x] Required attribution is visible in the app and export, not only in internal notes (map UI + export payload implemented).
- [x] Anything with unresolved terms is excluded from the public repository/build.
- [x] A reviewer records the final release decision in `data/fixture_manifest.json` at M0.

**Rule:** a reference URL alone is not a license decision. Until terms are verified, the asset is `pending` and cannot ship publicly.

## Release decision — 2026-08-26

Public release is **APPROVED**. The final unresolved gate (DBKL source-reference rights) is resolved as follows: `data/source_claims.json` contains only bibliographic citations — document title, page number, official URL, retrieval date, and a boundary note deferring to the original document. No DBKL text, images, maps, or tables are reproduced anywhere in the repository (verified by inspection of the fixture: each record carries only `id`, `category`, `document`, `documentUrl`, `page`, `retrievedDate`, `boundaryNote`). DBKL's copyright notice covers its content, which is not copied here; citation of a publicly published government planning document by title/page/URL is standard reference practice and is what the plan's own public-comment process expects of residents. OSM terms were already verified with in-app and export attribution implemented. All fixture assets are therefore `verified` for public release. Decision recorded per owner direction.

## Release status

Public release was **approved 2026-08-26** (see "Release decision" above). The former exclusion notice is superseded: the DBKL gate is resolved as citation-as-reference, and OSM attribution is implemented and verified.
