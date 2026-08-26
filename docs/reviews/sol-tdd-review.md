# Sol Review — Grounded Route Technical Design

## Review scope

I reviewed `README.md`, `docs/TECHNICAL_DESIGN.md`, `data/README.md`, and `LICENSE` as design artifacts only, against product scope, WebMCP leverage, architecture, provenance, human authority, accessibility, evaluation, and submission readiness. I did not use web research or assume undocumented WebMCP behavior.

## Confirmed strengths

- The one-area, one-scenario, static-fixture boundary is credible for a hackathon and still differentiated by the shared map/evidence artifact.
- WebMCP is central to the intended interaction: tools inspect live user context and create visible, reversible state through the same domain layer as the UI.
- No backend, no real addresses, no live PDF parsing, and no submission integration form a coherent privacy and delivery strategy.
- The design repeatedly rejects certified-accessibility, safety, legal, and city-wide claims, while preserving OSM as base geometry/tags only.
- Progressive enhancement, a structured map alternative, an audit trail, and a public-repository/live-demo milestone are all correctly recognized.

## Findings

### SOL-001 — BLOCKER — Official evidence and curated spatial interpretation are conflated
- **TDD section:** `5.2 Data classes`; `5.3 plan_claims.json contract`; `5.4 OSM use and limits`; `7.2 Tool design`
- **Problem:** `PlanClaim` is typed only as `source-confirmed` but also contains `affectedSegmentIds`. That makes a project-authored plan-to-segment mapping look like part of the official claim. The overlay and draft tools also accept agent-written `summary`, `position`, and `requestedChange` without a defined statement-level provenance model.
- **Why it matters:** A citation can be genuine while the claimed route impact is still an interpretation. The current model can launder curated mapping or model prose into an apparently DBKL-confirmed route claim.
- **Concrete recommendation:** Split immutable `SourceClaim` records from `ScenarioImpactMapping` records. Give mappings `sourceClaimIds`, `segmentIds`, `mappingType: "curated-interpretation"`, rationale, uncertainty, reviewer, and review date. Represent overlay/draft assertions as structured statements classified as source quote, curated interpretation, model inference, user position, or unknown; render those labels in the workspace and export.
- **Acceptance check:** A source excerpt alone cannot produce a `source-confirmed` segment impact; invalid mappings fail fixture validation; every exported factual or impact statement exposes its class and supporting IDs.

### SOL-002 — BLOCKER — Review consent is not bound to the exported draft revision
- **TDD section:** `6. Domain model and state machine`; `6.1 Allowed state transitions`; `7.2 Tool design`
- **Problem:** Consent is stored as booleans. The design does not require those booleans to reset after a resident edit, a later agent draft, evidence changes, or route/scenario changes. A previously reviewed flag could therefore authorize different content.
- **Why it matters:** This breaks the core claim that only the resident controls the exact text leaving the app.
- **Concrete recommendation:** Add monotonically increasing overlay/draft revision IDs and store approval against the exact draft revision (and its evidence/route/scenario snapshot). Every relevant mutation must invalidate approval. Keep export/copy outside the WebMCP action surface and require a direct, visible user activation plus a matching current revision; document that the export capability is not reachable from tool handlers.
- **Acceptance check:** Tests prove that agent redrafting, human editing, citation changes, and route/scenario changes after review all disable export; a tool call or programmatic domain-action call cannot export; re-review of the current revision restores readiness.

### SOL-003 — IMPORTANT — The truth fixture is still an unresolved prerequisite
- **TDD section:** `2.1 In scope for MVP`; `11. Delivery milestones`; `12. Open questions to resolve before implementation`
- **Problem:** The exact area and planning scenario—the material that determines route geometry, source excerpts, and mappings—remain open, yet there is no pre-implementation fixture milestone or acceptance gate.
- **Why it matters:** UI and tool work can advance against invented relationships and later require rework, while the hardest provenance question remains deferred.
- **Concrete recommendation:** Add an M0 “fixture freeze” before M1: name the bounded area and scenario, enumerate the profiles/routes and 6–12 excerpts, record mapping rationale and review status, and validate all referenced IDs. Clarify whether “parent using a wheelchair” is one composite preset or two of the three stated presets.
- **Acceptance check:** The checked-in fixture manifest passes schema/reference validation and a reviewer can trace every scenario-to-segment relationship before feature implementation begins.

### SOL-004 — IMPORTANT — Tool availability is treated as an authorization boundary
- **TDD section:** `7.1 Progressive enhancement`; `7.3 Registration lifecycle`; `12. Risks and mitigations`
- **Problem:** Conditional registration/unregistration is sensible UX, but stale tool discovery or calls are not addressed. The documents intentionally defer the exact WebMCP API, so it is uncertain whether unregistration behaves as assumed.
- **Why it matters:** A stale context-sensitive tool must fail closed even if registration lifecycle behavior differs in the supported environment.
- **Concrete recommendation:** State that registration controls discoverability only. Every handler must independently check current route/scenario, evidence membership, ID allowlists, state revision, and transition legality immediately before mutation. Define an adapter contract so API-specific registration is replaceable, then verify it early in the named supported environment.
- **Acceptance check:** Calls captured before reselection or clearing state return a structured stale/precondition error and produce no mutation or misleading audit event, regardless of whether unregister is supported.

### SOL-005 — IMPORTANT — “No backend” does not yet define the network/privacy boundary
- **TDD section:** `4.1 MVP architecture decision`; `4.2 Proposed stack`; `8.3 Privacy and safety requirements`
- **Problem:** The tile/style/font source for MapLibre is unspecified. Static hosting, map assets, source links, and browser integrations can still make network requests even without an application backend. Local-storage duration also conflicts with “demo session only.”
- **Why it matters:** Privacy and reproducibility claims need an explicit egress model, not only the absence of a server component.
- **Concrete recommendation:** Add a network inventory naming every runtime origin and payload, choose bundled or explicitly disclosed map assets, prohibit route/draft/user-note data in requests, and define a CSP. Use in-memory/session storage by default or state an exact local-storage retention/clear policy.
- **Acceptance check:** An automated browser test asserts the runtime request allowlist and that route, draft, and notes never leave the browser; clearing local data removes all persisted workspace and approval state.

### SOL-006 — IMPORTANT — The non-map experience lacks testable equivalence
- **TDD section:** `8.1 Page layout`; `8.2 Accessibility requirements`; `9.1 Deterministic tests`
- **Problem:** A structured list is promised, but its required content, focus behavior, and ability to perform the full route/evidence/review flow are not specified. “Keyboard operable” and screen-reader announcements have no acceptance details.
- **Why it matters:** The accessibility-oriented story fails if critical segment impact, evidence, uncertainty, undo, or consent exists only on the map.
- **Concrete recommendation:** Specify a canonical ordered segment list containing route order, names/IDs, observed tags with caveats, staged impacts, certainty, and evidence links. Require all review/edit/undo/approve actions without map interaction, logical focus after mutations, labelled controls, and named live-region messages.
- **Acceptance check:** A keyboard-only, map-hidden Playwright flow completes profile selection through draft review/export readiness; automated accessibility checks pass and a manual screen-reader script confirms state-change announcements.

### SOL-007 — IMPORTANT — Evaluations need exact safety oracles
- **TDD section:** `9.1 Deterministic tests`; `9.2 WebMCP evaluations`; `9.3 Manual evidence for submission`
- **Problem:** The evaluation themes are right, but “8–12 cases” does not define fixtures, expected tool sequences, state diffs, audit records, or forbidden output. Prompt-like text in excerpts/user notes, invalid cross-scenario IDs, stale revisions, and post-approval mutation are not explicit cases.
- **Why it matters:** A polished happy-path video would not prove the provenance and human-authority claims that distinguish the product.
- **Concrete recommendation:** Add a versioned eval table with prompt, initial state, allowed tools, expected calls/results, exact state/audit delta, required provenance labels, and forbidden claims/side effects. Include adversarial fixture text, unknown evidence, cross-scenario IDs, stale state, attempted export, and approval invalidation.
- **Acceptance check:** All cases run deterministically and fail on unsupported factual prose, missing uncertainty labels, unauthorized state transitions, unescaped rendered content, or any publication/network side effect.

### SOL-008 — IMPORTANT — Repository license does not cover third-party data disposition
- **TDD section:** `5.4 OSM use and limits`; `10.1 Stages`; `13. References`
- **Problem:** The MIT file clearly licenses project code, but the design does not specify attribution, source snapshot metadata, or licensing treatment for OSM-derived geometry and DBKL excerpts. A references list is not a data-license manifest.
- **Why it matters:** Public-repository readiness includes being explicit about which content is project-owned and which remains governed by its source terms. Exact source obligations cannot be proven from the supplied documents and should be verified before publication.
- **Concrete recommendation:** Add a third-party data/attribution manifest with dataset/file, source URL, retrieval date, transformation, attribution display location, and verified license/terms status; exclude any asset whose reuse status is unresolved.
- **Acceptance check:** Each shipped fixture and map asset has a manifest entry, required attribution is visible in the app/export where applicable, and the release checklist records a completed terms review.

## Required changes before implementation

Resolve SOL-001 and SOL-002 in the TDD before building the core loop. Also add the M0 fixture gate (SOL-003), fail-closed handler rules (SOL-004), explicit network/storage boundary (SOL-005), non-map acceptance path (SOL-006), deterministic eval matrix (SOL-007), and third-party data release checklist (SOL-008) before their corresponding implementation work begins.

## Optional backlog

- Keep PDF export out of the MVP unless plain text/Markdown is complete and tested.
- Consider audit-log redaction/size limits and a user-readable export of the audit after the judged build.
- Defer additional neighborhoods, live routing, accounts, collaboration, and field-report verification workflows.

## Verdict

**Conditional approval.** The scope and architecture can produce a strong, demonstrable WebMCP project, and the current private repository is correctly described as an interim state rather than a valid final submission. Implementation should not start on the agent drafting/export path until provenance is split at the data-model level and consent is revision-bound. With those blockers corrected and the important acceptance details patched, the design is buildable within the stated MVP boundary.
