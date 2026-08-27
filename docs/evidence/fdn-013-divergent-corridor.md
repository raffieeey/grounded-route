# FDN-013 — Divergent 2 km real-route corridor

## Corridor selected

The shared origin is the mapped north Kampung Baru access at **3.1650483, 101.7010417** (near Jalan Raja Bot); the shared destination is the mapped KLCC Park west approach at **3.1568216, 101.7120667**. The wheelchair route is an extracted **2,021 m** route through Saloma Link; the parent is **2,038 m** because it traverses the short stair way; the cyclist takes the physically distinct **2,490 m** Jalan Raja Abdullah–Jalan Sultan Ismail road-and-cycleway detour. This keeps Saloma Link as the scenic centrepiece while making the alternate route a genuine west-side street corridor rather than an offset line.

Geometry was retrieved from the Overpass API on **2026-08-27**. Long fixture segments are ordered connected composites: every vertex is from an extracted OSM way and every constituent way is recorded in `osmWayIds`; no synthetic interpolation or diagonal shortcut is used.

## Per-segment truth table

| Fixture segment | Real street / facility | OSM way IDs | Profile use |
|---|---|---|---|
| `seg-kampung-baru-north-access` | Kampung Baru access via Jalan Raja Bot, Jalan Daud, Jalan Raja Alang, Jalan Raja Muda Musa and connecting footways | 1224684945, 157203550, 1221744626, 1218681805, 1215718668, 604138343, 816654451, 1246220437, 512608702, 169064889, 1112304750, 512608698, 1466665232, 1246220443, 512608711, 512608710, 169064905 | Wheelchair and parent |
| `seg-saloma-north-access-footway` | Saloma north access footway | 765200305 | Wheelchair and parent |
| `seg-saloma-north-stairs` | Saloma Link north stair shortcut (`highway=steps`) | 765200304 | Parent only |
| `seg-saloma-elevator-bridge-approach` | Pintasan Saloma elevator-connected bridge approach | 1237772915; lift node 7146945539 | Wheelchair and parent |
| `seg-saloma-link-main-bridge` | Pintasan Saloma / Saloma Link bridge | 765200301 | Wheelchair and parent |
| `seg-saloma-south-slope` | Pintasan Saloma south sloping approach | 765200306 | Wheelchair and parent |
| `seg-saloma-to-klcc-park-step-free-approach` | Jalan Saloma, Jalan Ampang crossings and KLCC Park approach footways | 507063859, 766409728, 777843219, 615057435, 615057437, 137918335, 732632239, 732632236, 732632238, 1344488622, 1363236019, 768745243, 768745239, 1465166066, 836257531, 768745268, 165500670, 526585596, 1095850533 | Wheelchair and parent |
| `seg-jalan-raja-abdullah-sultan-ismail-cycling-detour` | Jalan Raja Abdullah, Jalan Sultan Ismail, mapped cycleways and Jalan Ampang/ KLCC approach | 1224684945, 157203550, 1221744626, 1218681805, 1215718668, 1193791714, 1466372517, 1086403291, 1203480554, 777761220, 1160097378, 1160097375, 900774383, 900774380, 1181333474, 900774378, 782211534, 310047957, 1196633436, 1191314317, 164030048, 164030050, 1194672122, 604444106, 676209657, 1356386886, 648785210, 1218157394, 1218157395, 1218157396, 1217567807, 1217567808, 1444092881, 1444092880, 1331842860, 847442148, 1331842865, 699373158, 778047738, 103777537, 1217567815, 732632235, 732632239, 732632236, 732632238, 1344488622, 1363236019, 768745243, 768745239, 1465166066, 836257531, 768745268, 165500670, 526585596, 1095850533 | Cyclist only |

## Measured divergence and stair proof

`tests/data/fdn-013-divergence.test.ts` builds each full profile polyline from the fixture and measures the greatest point-to-polyline separation with Haversine angular distance and a great-circle cross-track calculation.

| Measurement | FDN-012 baseline | FDN-013 result |
|---|---:|---:|
| Wheelchair point → cyclist polyline | 10 m maximum (reported pre-change) | **448.1 m** |
| Cyclist point → wheelchair polyline | 10 m maximum (reported pre-change) | **595.0 m** |
| Wheelchair → parent | near-identical except access choice | **3.0 m** maximum; distinct real stepped sub-path |

The parent route includes `seg-saloma-north-stairs`, which records OSM way **765200304** tagged `highway=steps`. The wheelchair route contains no `steps`-tagged segment and instead contains the longer mapped approach, elevator bridge approach (way **1237772915**, node **7146945539**), bridge, slope, and KLCC Park step-free approach.

## Reverse-geocode spot checks

Nominatim reverse checks on 2026-08-27 (coordinates from the fixture) returned:

- `seg-kampung-baru-north-access` start: **57, Jalan Raja Bot, Kampung Periuk, Chow Kit, Kampung Bharu, Kuala Lumpur 50300**.
- `seg-saloma-link-main-bridge` midpoint: **Pintasan Saloma, Kampung Paya, Kampung Bharu, Kuala Lumpur 50400**.
- Cyclist detour at `[101.7077525, 3.1581757]`: **Jalan Ampang, Kampung Hujung Pasir / Kampung Paya / Kampung Cendana, Kuala Lumpur 50250**.

## RED → GREEN and gates

The FDN-012 fixture was RED against this acceptance criterion: its reported wheelchair/cyclist maximum coordinate separation was only 10 m, below the new 150 m threshold. GREEN: `npx vitest run tests/data/fdn-013-divergence.test.ts` passes both 150 m directional assertions and the steps/OSM-ID assertions.

Final gate output (2026-08-27):

- `npm run fixture:check` — PASS.
- `npm run test` — PASS, 19 files / 165 tests.
- `npx playwright test --reporter=line` — PASS.
- `npm run workflow:check` — PASS.
- `npm run tdd:check` — PASS, 14 exported names covered.
- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `npm run build` — PASS.

## Judge-visible note

Select **Wheelchair user** to see the north Kampung Baru–Saloma Link step-free corridor, **School-pickup parent** to see the same corridor with the real north stair shortcut, and **Cyclist** to see the visibly separate road-and-cycleway detour. The violet/amber routes use Saloma Link; the green route leaves it for Jalan Raja Abdullah and Jalan Sultan Ismail, so the distinction remains legible after full-corridor fit-bounds. These remain illustrative route-evidence mappings, not navigation or certified accessibility findings.
