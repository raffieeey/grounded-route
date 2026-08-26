# FDN-009 — WOW pass evidence

Private branch `feat/wow-pass`; no push performed. This pass keeps the six WebMCP
tools, fixture data, deterministic verdict derivation, and resident-only approval
and export boundaries unchanged.

## WOW-1 — staged overlay sweep and visual language

Changed `src/ui/LocalRouteMap.tsx:21-166` and `src/styles/main.css:530-584`.
Newly staged fixture-linked segments receive `data-staged`, a reduced-motion-safe
animation class, a 600ms dash sweep, and a separate broad glow stroke. The former
plain count badge is now the accessible `Staged — awaiting your review` chip;
its accessible label retains the staged count without exposing mapping IDs.

Before: staging silently changed a thin dark line to a blue line. After: a
thicker blue overlay draws into place and reads as a proposed layer. On a 390×844
screen a judge sees the chip immediately above the route diagram; on desktop the
glow and draw-in make the changed corridor legible at a glance. All animation
rules have a `prefers-reduced-motion` fallback.

RED proof, run before implementation:

```text
$ npx vitest run tests/ui/wow-pass.test.tsx -t 'WOW-1'
Tests  3 failed | 2 passed | 7 skipped (12)
expected 0 to be greater than 0
expect(received).toBeInTheDocument() ... Received ... null
```

GREEN proof:

```text
Test Files  1 passed (1)
Tests  5 passed | 7 skipped (12)
```

The contract is in `tests/ui/wow-pass.test.tsx:43-141`.

## WOW-2 — sticky agent activity banner

Changed `src/ui/AssistantActivity.tsx:7-45` and `src/styles/main.css:986-1078,
1179-1185`. The existing `summarizeAgentActivity` text is retained, while its
rendering is now a sticky banner (a fixed mobile banner), with AI pulse, per-event
entrance class, and relative event time. No activity still returns `null`.

Before: agent proof was ordinary content in document order. After: when an agent
acts, a judge at 390×844 sees `Agent is acting` without scrolling; desktop keeps
the card sticky in the workspace. Motion is confined to `no-preference` media
queries and has a no-motion fallback.

RED proof, run before implementation:

```text
$ npx vitest run tests/ui/wow-pass.test.tsx -t 'WOW-2'
Tests  2 failed | 1 passed | 9 skipped (12)
... .assistant-banner ... Received ... null
expected 'Assistant activityA browser assistant…' to match /2 min ago|just now/
```

GREEN proof:

```text
Test Files  1 passed (1)
Tests  3 passed | 9 skipped (12)
```

The contract is in `tests/ui/wow-pass.test.tsx:146-190`.

## WOW-3 — staged-overlay verdict response

Changed `src/ui/VerdictCard.tsx:3-58`, `src/App.tsx:306-312`, and
`src/styles/main.css:774-797`. The UI intersects staged IDs with the already
computed `planRelevantMappingIds`, then counts only existing condition segments
linked to that intersection. It does not change `computeRouteVerdict` or invent
conditions; the delta preserves the illustrative/unverified limitation and
disappears after the staging set is cleared.

Before: the headline and card were byte-identical after staging. After: the card
adds `With the staged plan overlay: N areas under review (+M areas linked …)` with
a brief reduced-motion-safe highlight. At 390×844 and desktop, the agent action
now has a visible, qualified consequence in the verdict card.

RED proof, run before implementation:

```text
$ npx vitest run tests/ui/wow-pass.test.tsx -t 'WOW-3'
Tests  2 failed | 1 passed | 9 skipped (12)
Unable to find an element with the text: /With the staged plan overlay/i
```

GREEN proof:

```text
Test Files  1 passed (1)
Tests  3 passed | 9 skipped (12)
```

The UI contract is `tests/ui/wow-pass.test.tsx:194-252`; the real injected
WebMCP browser path is asserted in `tests/e2e/route-verdict-flow.spec.ts:118-164`.
The final browser run reported `PASS (22) FAIL (0)`.

## WOW-4 — landing hero polish

Changed `src/App.tsx:260-283`, `src/ui/WorkspaceControls.tsx:21-29`, and
`src/styles/main.css:33-80,716-726,1158-1178`. The landing view gets a compact,
hand-rolled decorative SVG route motif, stronger hierarchy, and a 48px CTA. It
uses no remote image, map tile, or fabricated screenshot. Once a session starts,
the hero compactly removes its landing-only motif and value proposition on mobile
to preserve the established first-screen verdict contract.

Before: the landing view was text, disclaimer, and a default blue button with
large unused space. After: a judge sees a small honest route anchor beside the
headline and a more deliberate CTA; desktop receives the same static motif at a
larger scale.

RED proof, run before implementation:

```text
$ npx vitest run tests/ui/wow-pass.test.tsx -t 'WOW-4'
Tests  1 failed | 11 skipped (12)
Unable to find an element by: [data-testid="landing-route-motif"]
```

GREEN proof:

```text
Test Files  1 passed (1)
Tests  1 passed | 11 skipped (12)
```

The contract is in `tests/ui/wow-pass.test.tsx:256-267`.

## Final verification

Executed on the finished worktree:

```text
npm run test            -> 16 passed files, 154 passed tests
npx playwright test --reporter=line -> PASS (22) FAIL (0)
npm run workflow:check  -> WORKFLOW GUARD PASS: foundation phase checks complete
npm run fixture:check   -> FIXTURE VALIDATION PASS: all cross-file IDs, attribution records, and schema checks succeeded
npm run tdd:check       -> TDD GUARD PASS: 14 exported names covered by tests
npm run typecheck       -> exit 0
npm run lint            -> exit 0
npm run build           -> ✓ built in 314ms
```
