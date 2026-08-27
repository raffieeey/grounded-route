# FDN-010 — Real map tiles under the route overlay

## What changed

`LocalRouteMap` now renders a Leaflet map fitted to the real fixture bounds in
the Saloma Link / KLCC area. It uses the OSM Carto tile URL
`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`, Leaflet's tile
attribution, and the existing visible OSM attribution/disclaimer below the
map. Route paths and named place markers are rendered above the tiles; the
map's zoom buttons are styled to 44px and scroll-wheel zoom is disabled so the
page remains easy to scroll.

The old hand-rolled SVG has been retained as `LocalRouteMap`'s internal
fallback. A TileLayer `tileerror` switches to that schematic, preserving the
route, named places, attribution, disclaimer, and staged review chip when
tiles cannot load.

## RED → GREEN proof

RED, before the implementation:

```text
npm run test -- tests/ui/real-map-tiles.test.tsx
4 tests: 1 passed, 3 failed
- no Leaflet map container
- no staged Leaflet overlay path
- no TileLayer error trigger/fallback
```

GREEN, after implementation:

```text
npm run test
17 files passed, 158 tests passed

npx playwright test --reporter=line
PASS (22) FAIL (0)
```

The focused FDN-010 tests cover the Leaflet container and route overlays,
staged-path semantic hook, tile-error fallback, visible attribution, and the
staged-review chip. The Playwright network assertion was revised from the
former no-network rule to allow only OSM Carto tile PNG URLs; no other
third-party request is permitted.

## Staged sweep and reduced motion

Each staged segment receives two Leaflet polylines: a 9px, 20%-opacity blue
glow underneath and a 5px `#0075de` foreground line. After Leaflet creates its
SVG path, the foreground receives `data-staged` plus
`segment-path--staged`, whose 600ms dash-offset CSS animation sweeps the path
in. When `prefers-reduced-motion: reduce` is active, that foreground instead
receives `segment-path--staged-reduced`, with no animation.

## Judge-visible result

A viewer now sees actual OSM streets and buildings for the Saloma Link area,
not a blank schematic canvas. The ordinary route is drawn directly over those
streets, while a proposed route change arrives as a broad glowing blue overlay
with the existing review chip. If OSM tiles are unavailable, the interface
automatically presents the familiar schematic rather than a failed or empty
map.
