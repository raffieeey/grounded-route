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

## Project status

- **Stage:** technical design and review
- **Repository visibility:** private during design/build; it must become public with a visible license before WebMCP Challenge submission.
- **Canonical design:** [docs/TECHNICAL_DESIGN.md](docs/TECHNICAL_DESIGN.md)
- **Data contract:** [data/README.md](data/README.md)

## Principles

- **Evidence before inference:** distinguish official source text, model interpretation, and user reports.
- **Human authority:** the agent can propose and stage; it cannot submit a public comment.
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

MIT. See [LICENSE](LICENSE).
