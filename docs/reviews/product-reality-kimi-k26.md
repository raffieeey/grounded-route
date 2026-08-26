# Product Reality Review — Kimi K2.6

## Lived-experience verdict
- Would I use this? **only after changes**
- Overall score: **3/10**
- One-sentence reason: It is a technically honest fixture with solid uncertainty labeling and audit plumbing, but as a wheelchair-using parent I am greeted by developer jargon, given a profile button that changes nothing, asked to decipher the word “Stage,” and forced to write my own civic comment from a blank form after scrolling through nearly 9,000 pixels of raw evidence.

## Five-minute journey

| Moment | What I see/feel | Friction | Evidence |
|--------|-----------------|----------|----------|
| 0:00 — Landing | A stark page titled “Saloma Link Active-Mobility Corridor — Illustrative Demo.” A warning box full of liability language. A blue button: “Load illustrative demo.” | I do not see my route, my child’s school, or why I should care. The words *illustrative* and *fixture* make it feel like a lab experiment, not a civic tool. | `src/App.tsx` header and disclaimer; `mobile-initial.png` shows no personal hook. |
| 0:15 — Load | A long page appears: map, segment list, evidence board. I tap “Wheelchair user.” | Nothing on the page changes except a small label under the buttons. The map, segments, and evidence stay identical. | `src/App.tsx:75-78` profile selection only sets `profileId`; `RouteSegmentList.tsx` does not filter by profile; `mobile-loaded.png` shows identical content after profile selection. |
| 1:00 — Map & Segments | A static SVG diagram with tiny labels. Below it, ten segment cards with OSM tags like `steps`, `bridge`, `footway`. Each card has a “Stage” button next to an opaque ID like “map-01.” | I do not know what “Stage” means. It sounds like construction staging. I cannot zoom the map. I must read every card to spot `steps` tags that matter to a wheelchair. | `src/ui/RouteSegmentList.tsx:36-58` renders mapping rows with “Stage”/“Clear” and no explanation; `route_segments.geojson` contains tags like `steps` but they are not surfaced as warnings. |
| 2:30 — Evidence | A wall of six identical-looking source-reference cards citing PTKL2040 pages 37 and 38, followed by curated interpretations. | I cannot tell which source applies to which segment without cross-referencing IDs. The “Curated interpretations” dump segment IDs in monospace. It reads like a data manifest, not an answer to “will my route have ramps?” | `src/ui/EvidenceBoard.tsx` lists sources and mappings without segment-level grouping; `mobile-evidence.png` shows dense text with no visual hierarchy. |
| 3:45 — Draft | I open the draft panel and see three empty fields: “Your position,” “Requested change,” “Open questions.” | After all that reading, the tool gives me a blank form. It has not synthesized anything from my profile, my staged segments, or the evidence. I feel like I am doing the agent’s homework. | `src/ui/DraftReviewPanel.tsx` inputs are empty by default; `mobile-draft.png` shows form with no pre-fill. |
| 4:45 — Export | I create a draft, click Approve, then Export. A `.txt` file downloads. | The file is a JSON blob of statements and source IDs. It is not a formatted comment I can paste into a council portal. It does not even include my profile in a human-readable way. | `src/ui/export-payload.ts` builds a raw payload; `AuditConsentStrip.tsx` requires approval before export. |

## Product failures by severity

### P0 — Broken promise / unreadable core action
- **Profile choice is a dead label.** Selecting “Wheelchair user” or “School-pickup parent” only changes a single line of description text. It does not filter segments, highlight risks, re-order evidence, or change draft content. The user is explicitly asked to identify, then ignored. (`src/App.tsx:75-78`, `RouteSegmentList.tsx` lacks profile filtering.)
- **“Stage” is opaque jargon with no explanation or affordance.** A normal resident cannot guess that “Stage map-01” means “highlight this segment as potentially affected.” The button sits next to an opaque ID in monospace, offering no sentence, no tooltip, no consequence preview. (`RouteSegmentList.tsx:36-58`; `mobile-loaded.png`.)
- **Mobile experience is an 8,800-pixel scroll report.** The journey JSON records a mobile rendered height of 8,845px. There are no collapsible sections, no summary cards, and no sticky action bar. A parent on a 390px phone would scroll endlessly past the map, ten segments, six source references, three curated interpretations, and an audit log before they could act. (`journey.json`; `mobile-loaded.png`.)

### P1 — Makes the user work too hard
- **Draft panel is a blank form that forces manual synthesis.** After the user has selected a profile and flagged segments, the draft form is empty. The tool does not pre-fill “As a wheelchair user, I am concerned about the Saloma Link bridge because…” from the staged mappings and source claims. (`DraftReviewPanel.tsx`; `mobile-draft.png`.)
- **Evidence board dumps source references without segment-level translation.** The user must manually cross-reference `sc-01` to `seg-saloma-link-bridge`. There is no “Why this segment matters” sentence injected into the segment card. (`EvidenceBoard.tsx`; `mobile-evidence.png`.)
- **First screen uses developer vocabulary instead of a resident value proposition.** “Illustrative Demo,” “private-development fixture,” and “Load illustrative demo” frame the product as a proof-of-concept, not a civic action. (`src/App.tsx`; `mobile-initial.png`.)
- **Map is a static, non-interactive SVG.** It cannot be zoomed, panned, or tapped to inspect a segment. On mobile the labels are tiny and the diagram is tall, pushing actionable content far down. (`LocalRouteMap.tsx`; `mobile-loaded.png`.)
- **Export produces a raw JSON text file, not a human-readable comment.** A resident expecting a formatted letter or copy-paste paragraph gets a machine payload of statement IDs and mapping references. (`export-payload.ts`; `AuditConsentStrip.tsx`.)

### Backlog — Noise and missed opportunities
- Audit trail is visible to the resident by default. Good for transparency, but it reads like system logs and adds cognitive load on mobile.
- No “share” or “copy” action for the draft. The only output is a download.
- No progressive disclosure; every section is visible at once, regardless of relevance.

## Three changes that would make me care

1. **Make profiles meaningful: filter, highlight, and summarize by mobility need.**
   When I select “Wheelchair user,” immediately flag segments that violate my constraints (e.g., `steps`, `bridge` without `ramp`). Show a sticky summary card at the top: “2 segments on your route have step hazards — see Evidence.” Preserve uncertainty by labeling each flag with its certainty level and a “Field verification needed” note. This respects the honest-uncertainty principle while actually answering “what matters for my route?”

2. **Replace “Stage” with plain-language “Flag as affecting my route” and auto-synthesize the draft.**
   For each segment, show a simple toggle: “This affects my route.” When I open the draft panel, pre-fill the inputs using my profile, flagged segments, and evidence citations. Let me edit, not invent. The WebMCP tools can still inspect and update the underlying state, but the human sees sentences and consequences, not IDs and system logs.

3. **Collapse the evidence board and segment list behind summary cards on mobile, and add a persistent action bar.**
   On viewports ≤600px, show only the map and a “3 segments need attention” summary card. Tapping expands details. Keep a sticky footer with “X flagged · Review draft” so I never lose context. This turns the 8,800px scroll into a scannable task that fits in the five minutes before school pickup.

## What to remove or demote

- **Remove the visible audit trail from the resident UI.** It adds cognitive load and reads like system logs. Keep it in export metadata or a hidden “Advanced” panel.
- **Demote the full source-reference list from the main view.** Replace it with segment-linked “Why this matters” snippets. The full bibliography can live behind a “Sources” expando.
- **Demote “Load illustrative demo” and “Clear current session” as primary actions.** The product should load the scenario by default and use a subtle “Restart” icon in the header. The current two-state load/clear pattern is an extra tap before value.
- **Remove raw mapping IDs (`map-01`) from segment cards.** They are implementation details, not resident vocabulary.

## What to preserve

- **Explicit uncertainty labeling** (certainty levels, boundary notes, “Field verification required”). This builds trust and differentiates the product from false-precision planning apps.
- **OSM attribution and copyright link.** Correctly placed and legally necessary.
- **Human-only approval/export gate.** The agent can propose but cannot bypass the resident. This is a core WebMCP value and must remain.
- **Browser-native, no-backend architecture.** Keeps the scope auditable, private, and lightweight.
- **Structured data model** (segments, mappings, source claims). It is a solid foundation; the UI simply fails to surface it usefully.

## Product direction

**Thesis:** Grounded Route should be a **resident-first route-risk scanner**, not a data-exploration dashboard. In 60 seconds, a parent must see which segments of their child’s route are affected by a plan, why it matters for their mobility profile, and be able to turn that into a pre-cited civic comment with minimal editing.

**Ordered 3-step redesign sequence:**
1. **Profile-aware filtering and summary cards** — rewire `RouteSegmentList` and `EvidenceBoard` to surface per-profile risks, collapse non-relevant segments, and show a sticky summary.
2. **Plain-language flagging and draft synthesis** — rename “Stage” to “Flag,” pre-fill the draft from profile + flags + evidence, and let the resident edit rather than invent.
3. **Mobile-first layout with sticky actions** — replace the single long column with summary cards, expandable details, and a persistent bottom action bar so the product fits a 390px screen and a 5-minute attention window.

## Evidence and limits

- Evidence is drawn from `src/App.tsx`, `src/ui/*.tsx`, `data/*.json`, and the screenshots in `/tmp/grounded-route-product-review/`. The mobile rendered height of 8,845px is taken from `journey.json`.
- I did not test with a screen reader or assistive technology beyond inspecting `aria-*` attributes in code. I did not run the local preview in a live browser; I relied on the provided screenshots and source analysis.
- I did not evaluate the WebMCP tool implementations (`src/webmcp/`) because the review scope is the human-first experience. The adapter layer may be sound even when the UI fails.
- I did not verify the DBKL source-reference rights path; this review assumes the data manifest is accurate.
