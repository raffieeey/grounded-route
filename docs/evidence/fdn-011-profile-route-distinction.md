# FDN-011 — Profile-distinct route visualization

## RED → GREEN proof

RED: `npx vitest run tests/ui/profile-route-distinction.test.tsx` initially
failed all five new tests because the map had neither profile route classes nor
segment identifiers, no resident profile caption, no profile-specific colors or
fading, and no detour label in the fallback.

GREEN: the same focused suite passes all five tests. It covers profile-colored
4px own paths, 1px/0.25-opacity background paths, caption label and note,
wheelchair-to-cyclist recoloring, staged-blue precedence, and fallback parity.

## What changed

- `App` passes the selected profile ID to `LocalRouteMap`.
- Wheelchair routes are purple (`#7c3aed`), school-pickup-parent routes amber
  (`#d97706`), and cyclist routes green (`#059669`). The active route is 4px;
  all other corridor segments remain present but fade to 1px at 0.25 opacity.
- The map header now says `Your route as a …` with a short resident-facing
  route note in the selected route color.
- Active named alternates, detours, and bypasses receive bold, route-colored
  labels. The SVG schematic fallback applies the same color, weight, fade, and
  detour-label rules.

## Before and after

Before, every profile used the same dark route over medium-grey dashes, so the
wheelchair alternate and cyclist west-loop bypass were visually lost at the
edge of a shared corridor. After, the wheelchair user's thick purple line and
the labeled `Wheelchair alternate route avoiding steps` stand apart from the
faded background; switching to Cyclist immediately replaces it with a thick
green line and the labeled `Cyclist bypass west loop`.

## Staged-overlay precedence

When a selected-profile segment is staged, its 14px `#0b8bff` glow and 5px
`#0075de` foreground override the profile color. Its existing `data-staged`,
sweep/reduced-motion behavior, and `Staged — awaiting your review` chip remain
in place; FDN-011 only changes non-staged route semantics.

## Verification

- `npm run test` — 18 files, 163 tests passed.
- `npx playwright test --reporter=line` — passed, including the new browser
  assertion that the caption changes from wheelchair to cyclist.
- `npm run workflow:check`, `npm run fixture:check`, `npm run tdd:check`,
  `npm run typecheck`, `npm run lint`, and `npm run build` — passed.
