# Character Relationship Web — Phase 9

Open **Relationship Web** in navigation and select an existing Townieverse save-file profile. Assign households in World Population or add standalone Sims. The six generators, Casting Board and original generated snapshots remain independent. This planner never reads or changes actual Sims 4 game files.

## Characters and profile isolation

Assigned characters use `member:<encoded saved household ID>:<encoded member ID>` identifiers. Names are display labels, never identity keys. Alternate household rolls with repeated template member IDs remain distinct when their saved household IDs differ. Every web belongs to one profile; switching profiles never combines populations. Duplicating a profile deep-copies its web with the same character IDs in a separate profile scope.

Cards show saved member names, household title, available aesthetic/life stage/world, and optional local label, icon, color and favorite. Missing source details remain unspecified. Assigned life stages come from snapshots and are read-only in the character editor; standalone life stages are user-authored. Local labels and styling do not change generated snapshots. Household title/world follow their current assignment; saved positions and edited labels persist.

Removing a household from a profile retains its characters and connections. The Character list labels these nodes **Orphaned**. Keep their history, reassign the original household, detach them as standalone characters, or confirm deletion of the character and attached connections. Detaching gives a new standalone UUID and remaps connections and family constraints. Assigned characters cannot be deleted while their source household remains assigned, because source reconciliation would restore them. Deleting a whole profile requires confirmation and removes its web too.

## Graph controls and accessible list

- Drag a card with a pointer or touch to reposition it. Position is saved on release, rather than on every pointer move. Cancelled gestures do not save a move.
- Focus a card and use arrow keys to move it 20 board units. The Character editor also offers numeric horizontal/vertical position fields.
- Drag empty canvas space to pan; directional Pan buttons offer the same action. Zoom in/out controls range from 20% to 300%. Fit graph adjusts the viewport without changing character positions.
- Reset layout requires confirmation and replaces all positions with a spaced grid. Ordinary rerenders and profile switches never reset saved positions.
- Select a card or connection to inspect it. Connections support Enter/Space as well as pointer selection. The Relationship list contains full notes, description, strength, date, tags, status and edit/delete controls.
- **List view only** removes the graph while retaining all creation, editing and deletion actions. Dragging is never required. **Simplified graph** hides card details and line labels; this also happens below 60% zoom and above 100 visible characters.

The board uses themed cards, focus/selection outlines and line styles: solid family, thick romance, dashed friendship, dotted conflict and thin other connections. Colors are optional decoration. A text legend identifies styles. No animation is required; reduced-motion preferences are supported. Parallel connections may overlap visually; their separate records remain accessible in the list.

## Relationships and validation

Create a connection by choosing two Sims in the current profile. For Parent / child and Grandparent / grandchild, the first Sim is the ancestor. Family, romance, friendship, conflict, coworker/neighbor/business/mentor/roommate and custom categories are available. Each record stores a stable edge UUID, endpoints, type, label, description, notes, status, optional strength 0–5, optional start date and up to 30 tags. Strength is a story scale and has no correspondence to in-game relationship scores.

Validation runs for editing, storage and imports:

- Existing endpoints, distinct Sims, unique record IDs and no identical reciprocal connection duplicates.
- Conservative known life-stage compatibility for parent/child, compatible grandparent stages and no directed ancestry cycles. Exact ages are unavailable; unknown stages cannot prove impossible parent ages and remain incomplete. Life stages approximate ancestry rather than proving a biological genealogy.
- All romance and adult intimate relationship types require known Young Adult, Adult or Elder stages plus explicit confirmation of adult consent. Teen romance is conservatively unsupported in this phase. No sexual narratives are generated.
- Family-connected Sims cannot have romantic edges. Biological/adoptive/step-parent and sibling ties recorded in source household snapshots are preserved as separate constraints, without creating romantic edges. Manual family edges also block indirect family romance. Chosen family is a social tie and does not imply biological kinship.
- Source and manual family constraints remain relevant even after unassignment or ending a family edge. Planned family ties are also conservative restrictions. This can block distant or ambiguous kinship: review the family history instead of assuming a complete genealogy.
- Active ex/current romance, distinct active dating/engaged/married states for the same pair, former/current friendship and active friendship/conflict states cannot contradict. Ancestor and sibling ties for the same pair cannot coexist. End an older record to preserve history; Complicated romance and custom Other labels support nuanced stories. Multiple friendships and consenting adult romances with different Sims remain allowed.
- Custom labels require an explicit category. Recognizable romance/intimacy terms require the Romance category; Custom Romance uses the same adult/consent/family checks, and Custom Family participates in family restrictions. The app cannot infer every meaning of free-text labels, descriptions or fictional histories. Choose the correct category; this is not natural-language moderation.
- Valid finite positions/view values, safe color syntax, valid dates, text limits and no unsupported future web schema. Unsupported data is preserved for recovery rather than silently discarded.

## Discovery

Expand Search and filter connections to search names, household labels, aesthetics, icons, relationship labels/descriptions/notes/tags. Filter by source household, world, connection type/status, an individual Sim or character favorites. Focus mode shows one Sim and directly adjacent connections. An isolated focused Sim still appears. Combining endpoint filters shows edges only when both endpoints are visible; clear filters to inspect the entire web. Favorites are local character favorites, initially seeded from a favorite source household.

Filters, focus and graph/list preferences persist per profile. Clearing filters does not remove data. Hidden connections remain available after filters change.

## Storage and migration

`SaveProfile.relationshipWeb` is optional inside the existing `townieverse.planning.v1` storage envelope. Its nested schema is version 1 with `nodes`, `edges`, optional `knownFamily`, `filters` and `view`. Phase 8 profiles without this field load as empty webs; visiting a profile reconciles its assigned members and adds the field only after a successful validated write. Existing IDs, snapshots, notes, custom lots and unrelated fields are retained. Legacy planner v0 and Casting Board formats continue through their respective existing importers.

Standalone nodes have UUIDs and empty household/member IDs; assigned nodes have their composite ID plus source references. World reassignment updates display metadata without changing IDs or edges. Recovery snapshots in profile assignments supply household details if the live Casting Board is unavailable or has conflicting content.

Planner protections apply to the entire profile, including the web: corruption/future versions block edits and preserve raw data; quota/storage failures keep prior data; storage events disable stale edits; comparison against the last loaded raw value catches missed events before writes. Recovery is available through Population backups and recovery. As documented in WORLD_POPULATION.md, localStorage has no true cross-process transaction and a narrow simultaneous comparison/write race remains possible.

Limits are 2,000 characters and 10,000 connections per web, 100 profiles, and 10 MB imported JSON. Browser quota may be lower. Storage is browser/profile/origin-specific; no backend, synchronization or undo history exists. Export backups before deletion, replacement, clearing browser data or changing origins.

## Import/export compatibility

Population backups now carry each profile's optional relationship web together with assignments and household recovery snapshots. Old population and Casting Board backups remain importable; neither importer silently replaces generated snapshots.

Relationship backups export one profile or all profiles as `townieverse-relationship-web`, schema 1. Import validates every node/edge and previews profile names, character counts and individual connections. Known profile IDs target that profile; unknown IDs create new planning profiles with preserved web history and no automatic household assignments. Web-only imports do not contain complete household snapshots; use population backups to transfer whole plans, and Casting Board backups to preserve unassigned entries/favorites.

Merge adds new characters/edges, skips equivalent edges, keeps current character positions/view preferences and blocks conflicting character styling/labels or relationship details. Errors leave all existing profiles unchanged. Replacement requires confirmation and replaces only webs whose profile IDs occur in the preview; household assignments, other profile webs, preferences and Casting Board remain intact. Assigned source characters reconcile back into a replaced web. No operation automatically matches different profile IDs or different character IDs by display name.

The documented web-only v0 envelope accepts nodes/edges without view/filter fields and supplies defaults in memory. Nested unsupported future schemas are rejected. Unsafe JSON keys, oversized imports and invalid graph references fail before persistence.

## Phase 9 file manifest

Created:

- src/types/web.ts
- src/utils/web.ts
- src/components/RelationshipWeb.tsx
- src/components/web/ConnectionEditor.tsx
- src/components/web/NodeEditor.tsx
- src/components/web/RelationshipGraph.tsx
- src/components/web/WebBackup.tsx
- src/components/web/HouseholdWebLink.tsx
- src/styles/web.css
- tests/web.test.ts
- tests/web-interfaces.test.tsx
- docs/RELATIONSHIP_WEB.md

Modified: src/types/planning.ts, src/utils/planning.ts, src/types/navigation.ts, src/data/navigation.ts, src/App.tsx, src/components/Header.tsx, src/components/Home.tsx, src/components/CastingBoard.tsx, src/components/planning/ProfileControls.tsx, src/components/planning/PlanningBackup.tsx and README.md. Build output is regenerated inside the project. Existing content libraries and 310 previous tests are unchanged.

## Performance and remaining limits

The graph uses existing React and native SVG/Pointer Events; no graph dependency was needed. Drag feedback updates only the active card and persistence happens on release. Tests cover 50/100/200-character chains, validation/filtering and component rendering. The 200-character view automatically simplifies details; filtering, focus and list mode remain available. Benchmarks are local test-machine measurements, not real-device frame-rate guarantees. The accessible list is not virtualized, and dense/parallel edges may overlap. No automatic force layout, pinch zoom, genealogical age inference, actual game relationship values or game-file integration is provided.

Phase 10 requires approval.

## Verification

The 310 previous tests are preserved with 84 new tests: 59 unit/compatibility/validation tests and 25 interface, pointer, storage and rendering tests. The full suite contains 394 tests in 21 files. TypeScript, ESLint, Prettier, content validation and production build are required checks; the content library remains unchanged with zero validator issues.

Production-browser checks covered desktop 1280 pixels and mobile 390/320 pixels, both themes, character/connection forms, native pointer dragging and canvas panning, keyboard movement/edge selection, fit/zoom, saved positions/view state after reload, mobile list editing, focus mode and a real project-local JSON import preview/merge into an isolated profile. No horizontal page overflow or console warnings/errors were observed. Synthetic pointer tests cover touch-style dragging; physical touchscreen hardware was not tested. Download controls and JSON serialization are tested without writing browser downloads outside the project.

Local component benchmarks for 50/100/200-character chains rendered in about 57/109/131 ms in jsdom. Validation plus focus filtering took about 3.5/4.2/12.7 ms in the final full run. These measurements exclude human interaction and are not browser frame-rate guarantees. Large graphs automatically simplify; full connection details remain available in the list.

Proof artifacts: docs/phase-9-preview.png, docs/phase-9-mobile.png and docs/phase-9-import-example.json. The import example contains standalone demonstration data, separate from official content libraries.
