# FDN-014 — Works-chip polish

## Finding → fix mapping

| LUNA / TERRA finding | Implemented fix |
| --- | --- |
| Overlapping, identical proposed-works chips read as prototype noise. | Staged segment midpoints within 60m now form one deterministic cluster. The visible chip receives a `+n` badge and its label reads `Proposed works ×N`. |
| A works chip hid the stair shortcut's accessibility label. | The cluster within 75m of the stair marker is suppressed, preserving `Stair shortcut — on your route` or `— your route avoids this`. |
| Top-left chips conflicted with zoom; right/bottom labels were clipped. | The top-left chip is nudged in-map and labels point right; rightmost labels point left and lowest labels point down. |
| The wheelchair title and route did not read as the same purple; cyclist could read as staged blue. | Profile colors are wheelchair `#6d28d9`, parent `#d97706`, and cyclist `#0f766e` in both the route/caption and fallback labels. |
| Roadwork needed a little more presence. | The amber dashed roadwork band opacity is `0.9`. The app renders no red dashed admin boundaries: red dashes in the reference image are OSM tile content, so no app recolor was needed. |
| Staged-state payoff risked falling below a 390×844 fold; disclaimer was visually dense. | The V6 browser test now requires the staged verdict delta's bounding box to finish within 844px. The mobile disclaimer stays fully present in the DOM but is 0.72rem, lighter, and one-line ellipsized. |

## RED → GREEN proof

RED: the focused UI suite failed after the new expectations were added: it
still returned `#7c3aed` / `#059669`, exposed one raw marker per staged
segment, and had no `clusterWorksMarkers` helper.

GREEN: `tests/ui/profile-route-distinction.test.tsx` and
`tests/ui/real-map-tiles.test.tsx` pass with the new route hues, a 60m
two-marker cluster test, a five-chip staged fixture result after the
stairs-adjacent three-marker cluster is suppressed, and the preserved stair
label. The staged browser assertion also passes with the verdict-delta bottom
edge at or above 844px.

## Judge-visible result

At the staged 390×844 map, co-located roadworks now read as one counted work
area instead of a pile of repeated labels, and the stair accessibility story
remains readable. The deeper purple wheelchair route and teal cyclist route
also remain distinct from the blue staged overlay.

## Verification

| Gate | Result |
| --- | --- |
| `npm run test` | PASS — 19 files, 167 tests |
| `npx playwright test` | PASS — 22 checks, 0 failures |
| `npm run workflow:check` | PASS — foundation phase checks complete |
| `npm run fixture:check` | PASS — cross-file IDs, attribution, schema checks |
| `npm run tdd:check` | PASS — 14 exported names covered |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm run build` | PASS — Vite production build |
