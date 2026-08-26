# Grounded Route

> **See how a city plan changes the route you actually live — and speak with evidence, not guesswork.**

Grounded Route is a WebMCP-native civic planning workspace for the OpenMCP Challenge.

A resident starts a 30-second **route-impact check**: they select a mobility profile and immediately see a deterministic, illustrative verdict on whether a narrowly scoped Kuala Lumpur planning scenario raises route conditions they should investigate, why, and what is unknown. They review a plain-language conditions shortlist, add the ones that matter to an editable pre-filled civic comment, and alone approve and export it. A browser assistant using WebMCP can inspect, stage reversible overlays, and draft in the same shared workspace; the resident sees every proposed change as a concise assistant-activity summary and remains the sole approver/exporter. The verdict is a fixture-bound planning/review prompt — not navigation, verified accessibility, a confirmed project impact, a construction timeline, or a DBKL commitment.

## What we are building

This is **not** an autonomous city-planning system or a live government-submission service.

The first MVP is:

- one small Kuala Lumpur demonstration area;
- one carefully curated scenario based on public DBKL Kuala Lumpur Development Plan 2040 material;
- route geometry from OpenStreetMap;
- a resident-first route-impact verdict and conditions shortlist (illustrative, not a verified impact);
- a source-linked evidence board (disclosed, not the default view);
- three demo profiles — wheelchair user, school-pickup parent, and cyclist — each with a deterministic, materially different illustrative route and verdict;
- browser-native WebMCP tools that update the shared map state visibly and reversibly, surfaced as concise assistant-activity summaries;
- a pre-filled, editable public-comment draft with an explicit, human-only approve/export step.

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
- Official source references to the DBKL Kuala Lumpur Development Plan 2040 are used as curated evidence, providing document title, page, and official link — not copied source text. Citation-as-reference only; see [the third-party data manifest](data/THIRD_PARTY_DATA_MANIFEST.md).

## Getting started

Requirements: Node.js 20+ and npm. No backend, no API keys, no network services — the app is a static build that runs entirely on local fixture data.

```bash
npm install
npm run dev        # local dev server
# or
npm run build && npm run preview   # production build served locally
```

### For judges: testing the WebMCP path

The app works fully without WebMCP (human-only flow). To see the human-agent shared workspace, the browser must expose `document.modelContext`:

- **Easiest:** open the app in **ChatGPT's in-app browser**, which supports WebMCP natively — ask ChatGPT to "check the route impact for the wheelchair profile and stage the plan overlay" and watch the shared workspace react.
- **Chrome:** enable the WebMCP flag (Chrome 146+; see `chrome://flags` — search "WebMCP", and note the flag name can change between releases; see [Chrome's WebMCP docs](https://developer.chrome.com/docs/ai/webmcp)), then use any MCP client against the page.

What to look for: six tools register (`get_route_context`, `find_plan_evidence`, `stage_impact_overlay`, `clear_staged_overlay`, `draft_public_comment`, `get_review_status`). When the agent stages an overlay, the corridor sweeps into a glowing proposed state, an "Agent is acting" banner appears, and the verdict updates — while approve/export stays disabled until you, the human, approve.

### Verify the build

```bash
npm run test            # 154 unit tests
npx playwright test     # 22 browser tests (desktop + mobile)
npm run workflow:check && npm run fixture:check && npm run tdd:check
npm run typecheck && npm run lint && npm run build
```

## Project status

- **Stage:** M0 fixture, human-first workspace, WebMCP adapter, native local-Chrome execution proof, OSM visible attribution, and the FDN-009 visible-agent wow pass are implemented and verified on `main`.
- **Repository visibility:** public. Third-party terms are resolved — see [the third-party data manifest](data/THIRD_PARTY_DATA_MANIFEST.md) (OSM ODbL attribution implemented; DBKL resolved as citation-as-reference with no copied content).
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

MIT. See [LICENSE](LICENSE). The MIT license covers project-authored code/documentation; third-party data/references are governed by their own documented terms. See [the data manifest](data/THIRD_PARTY_DATA_MANIFEST.md).

**Public-release status:** public. Third-party terms are resolved: OSM attribution is implemented in the app and exports (ODbL), and DBKL source references are bibliographic citations only (title/page/URL, no copied content) — see the [release decision](data/THIRD_PARTY_DATA_MANIFEST.md).
