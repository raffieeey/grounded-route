# Grounded Route

> **See how a city plan changes the route you actually live — and speak with evidence, not guesswork.**

Grounded Route is a WebMCP-native civic planning workspace for the OpenAI WebMCP Challenge.

A resident selects a route and a mobility profile, then explores how a narrowly scoped Kuala Lumpur planning scenario may affect that route. An agent can inspect the same live map and evidence board, stage reversible route-impact overlays, and prepare a source-linked public-comment draft. The resident sees every proposed change, corrects it, and alone chooses whether to export it.

## What we are building

This is **not** an autonomous city-planning system or a live government-submission service.

The first MVP is:

- one small Kuala Lumpur demonstration area;
- one carefully curated scenario based on public DBKL Kuala Lumpur Development Plan 2040 material;
- route geometry from OpenStreetMap;
- a source-linked evidence board;
- three demo profiles: wheelchair user, school-pickup parent, and cyclist;
- browser-native WebMCP tools that update the shared map state visibly and reversibly;
- an explicit, human-only export step for a public-comment draft.

## Why WebMCP is essential

A normal chatbot could describe a plan. It cannot naturally share the user's active map state, selected route, staged overlay, and evidence board in the same visible page.

Grounded Route uses WebMCP tools to let an agent operate on that shared artifact while preserving human agency:

1. inspect current route context;
2. retrieve curated plan evidence;
3. stage an impact overlay;
4. draft a cited comment;
5. let the resident review, edit, reject, or export it.

## Attribution and data

- Route geometry and tags are derived from **OpenStreetMap** (ODbL). A visible `© OpenStreetMap contributors` notice appears wherever the map is rendered, with a link to the [OSM copyright page](https://www.openstreetmap.org/copyright). Any exported draft includes the same attribution in machine-readable metadata. The geometry and tags are illustrative local fixture context, not navigation or certified accessibility data.
- Official source references to the DBKL Kuala Lumpur Development Plan 2040 are used as curated evidence, providing document title, page, and official link — not copied source text. Their public-release terms are unresolved; see [the third-party data manifest](data/THIRD_PARTY_DATA_MANIFEST.md).

## Project status

- **Stage:** M0 fixture, human-first workspace, WebMCP adapter, native local-Chrome execution proof, and OSM visible attribution are implemented and verified on private `main`.
- **Repository visibility:** private; public release is blocked by the unresolved DBKL exact-excerpt permission/removal/legal path. It must not become public until that separate gate is cleared and the user explicitly approves the transition.
- **Canonical design:** [docs/TECHNICAL_DESIGN.md](docs/TECHNICAL_DESIGN.md)
- **Independent design review:** [docs/reviews/sol-tdd-review.md](docs/reviews/sol-tdd-review.md)
- **Data contract:** [data/README.md](data/README.md)
- **Fixture gate:** [data/FIXTURE_FREEZE_CHECKLIST.md](data/FIXTURE_FREEZE_CHECKLIST.md)
- **Third-party data manifest:** [data/THIRD_PARTY_DATA_MANIFEST.md](data/THIRD_PARTY_DATA_MANIFEST.md)

## Principles

- **Evidence before inference:** distinguish official source text, curated spatial interpretation, model inference, user report, and unknowns.
- **Human authority:** the agent can propose and stage; it cannot submit a public comment or bypass current-revision review.
- **Small, auditable scope:** one scenario and a curated fixture beat a fake all-city GIS.
- **Human-first:** the page remains useful without WebMCP.
- **No false accessibility claim:** map data identifies possible features; field verification remains necessary.

## Primary sources

- [DBKL Kuala Lumpur Development Plan 2040 downloads](https://ppkl.dbkl.gov.my/en/muat-turun/)
- [PTKL2040 Executive Summary](https://ppkl.dbkl.gov.my/wp-content/uploads/2025/07/RINGKASAN-EKSEKUTIF-PTKL2040.pdf)
- [PTKL2040 Land Use Zone and Intensity Map](https://ppkl.dbkl.gov.my/wp-content/uploads/2025/06/2.-VOLUME-1-PART-2_LAND-USE-ZONE-AND-INTENSITY-MAPKLDCP2024.pdf)
- [OpenStreetMap](https://www.openstreetmap.org/) / [Overpass Turbo](https://overpass-turbo.eu/)
- [WebMCP specification](https://webmachinelearning.github.io/webmcp/)
- [Chrome WebMCP documentation](https://developer.chrome.com/docs/ai/webmcp)

## License

MIT. See [LICENSE](LICENSE). The MIT license covers project-authored code/documentation; third-party data/excerpts are governed by their own documented terms. See [the data manifest](data/THIRD_PARTY_DATA_MANIFEST.md).

**Public-release status:** The repository remains **private** because the DBKL source-reference rights path needs separate resolution. This candidate contains only official source references (document title, page, URL), not direct quotations. OSM attribution is implemented, but that does **not** clear the DBKL gate or authorize public release.
