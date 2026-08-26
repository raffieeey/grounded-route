# FDN-002 Visual QA Evidence

## Scope

This record covers the bounded visual/accessibility repair for the FDN-002
frontend (local route diagram, workspace controls, audit strip). It documents
the baseline defects, the remedies applied, the test evidence, and the limits
of model-side verification. No application or test behavior was changed by
this pass; it only closes out the existing work-in-progress.

## Baseline screenshot defects

The local route diagram and workspace controls rendered with the following
visible defects on desktop and mobile viewports:

- Map labels for corridor segments piled on top of the route line, causing
  adjacent labels to overlap each other and the route line.
- The mobile diagram was small and cramped: the square `800×800` viewBox left
  little vertical room, and the map had no minimum height on narrow viewports.
- Mobile controls were small and narrow: primary/secondary buttons and the
  profile selectors fell below comfortable touch-target size and wrapped
  poorly.
- The audit trail badge rows were not aligned; the actor badge and the action
  text sat on inconsistent baselines with ad-hoc whitespace.

## Remedies

All remedies are purely presentational; no domain, contract, or navigation
behavior changed.

- `src/ui/LocalRouteMap.tsx`
  - Taller `800×1000` viewBox with uniform scale and extra vertical headroom
    (`padY > padX`) so labels have room above/below the corridor.
  - Corridor segment labels alternate sides (`data-stagger="up"`/`"down"` per
    `idx % 2`) so adjacent labels never share a vertical band.
  - Each segment label and the staged-segment badge paint a white halo
    (`stroke="#ffffff"`, `strokeWidth=3`, `paint-order="stroke fill"`) behind
    the dark fill for legibility over the route line and grid.
- `src/ui/WorkspaceControls.tsx`
  - Load, Clear, and each profile selector get the `touch-target` class; the
    active profile selector keeps `profile-button touch-target active`.
- `src/ui/AuditConsentStrip.tsx`
  - Approve/Export buttons get the `touch-target` class.
  - Each audit event row uses a `.audit-row` flex container with the action
    text wrapped in `.audit-row-text`, so the actor badge and text align on
    a shared baseline.
- `src/styles/main.css`
  - `.audit-row` / `.audit-row-text` flex alignment for audit rows.
  - `.map-header` gains `gap` and `flex-wrap` for a wrapped header on narrow
    viewports.
  - Mobile (`max-width: 600px`) block: `#root` padding, `.local-route-map`
    `min-height: 420px`, and `.map-disclaimer`/`.map-staged-badge`
    `white-space: normal`.
  - Mobile touch-target block: `button.touch-target` / `.btn-small`
    `min-height: 44px` (WCAG 2.2 Target Size, Minimum); `.profiles` becomes a
    two-column grid with full-width centered profile buttons;
    `.consent-actions` wraps and its `.touch-target` actions grow.

## Test evidence

`tests/ui/visual-layout.test.tsx` (new, unit-level, no browser) verifies the
remedies structurally:

- "preserves the explicit illustrative-not-navigation label for assistive tech"
  — the `svg.local-route-map` keeps `role="img"`, an `aria-label` matching
  `/illustrative local route diagram/i`, and the visible
  "Illustrative local route diagram — not navigation" text.
- "staggered segment labels alternate above/below the route line with a
  readable halo" — every `.segment-label` carries `data-stagger` of `up` or
  `down`, both sides are used, adjacent labels never share a side, and every
  label has a white stroke with `paint-order` including `stroke`.
- "profile selectors keep full readable labels and toggle semantics" — the
  profile `group` exposes a labelled button per profile with
  `aria-label={p.label}`, and the active profile is `aria-pressed="true"`
  while others are `aria-pressed="false"`.
- "clear-session control is a labelled, touch-friendly secondary action" —
  the Clear button has `btn-secondary` and `touch-target`.

## Honesty / limits of model-side verification

Screenshot visual reinspection was **not** performed by this model. This
model endpoint has no image input, so it cannot visually verify rendered
pixels. The verification above is structural: it checks the markup, ARIA,
class, and geometry attributes that produce the intended visuals, plus the
existing unit/typecheck/lint/build gate. A human (or a model with image
input) should perform the final pixel-level screenshot QA before sign-off.

## Closeout commands

The following focused commands were run as the closeout gate (no full gate
suite, no browser/image tools):

```bash
npm run test
npm run typecheck
npm run lint
git diff --check
```

Results are recorded separately with the commit.
