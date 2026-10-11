# World Population Tracker and save-file profiles

Phase 8, October 10, 2026. Townieverse is a **local planning notebook**. It never reads, writes, imports or edits actual Sims 4 save/game files.

## Profiles and assignments

Open **World Population** and create a named profile. Profiles have unique IDs, editable names/descriptions, creation/modification dates, independent assignments, custom lots and world/neighborhood notes. Switching profiles persists the selected ID. Duplication copies a plan into an independent profile. Deletion requires confirmation and never deletes Casting Board entries.

Save a generated household on Casting Board. Choose **Assign to World** on its card, select a destination profile, and save a world, optional recorded neighborhood/lot, residential arrangement, notes and explicit household placement status. The World Population page offers the same assignment controls. A saved household entry can have one assignment per profile; changing it moves that assignment by ID rather than creating another copy. Names never identify assignments.

Original worlds, backstories, Sims, aesthetics and relationships remain intact. Assignment edits update only planning records. Worlds without verified lots support world/neighborhood assignments. Official and fictional geography retain their existing labels. All 31 official worlds are shown after a profile is created; assigned fictional save concepts are also shown, with labels. Every empty world has zero planned residents.

Search world names or filter empty/partial/completed plans and owned-pack worlds. The owned-pack filter always retains worlds containing saved assignments, even when their pack is disabled. Disabling packs changes generation availability, never deletes plans. Opening a world shows world-level assignments, recorded neighborhood sections, verified lot information, custom lots and planning notes.

## Progress and identity

Member controls use the **existing Casting Board memberProgress** field. Idea appears as Not Started; Planning, Creating in CAS, Created in CAS and Placed in World retain their existing values. Playing is retained as a compatible legacy status. Member progress is shared across profiles because the original saved entry remains the source; household placement is specific to each profile. No automatic progress inference occurs.

- Planned households: assigned saved household IDs in the selected profile/scope.
- Planned Sims: distinct household-member IDs in that scope, never names. Repeated IDs count once and use the highest observed created/placed flags. Repeated concepts trigger a visible review notice.
- Created Sims: member status Created in CAS, Placed in World or Playing.
- Placed Sims: member status Placed in World or Playing. Created in CAS alone does not imply placement.
- Placed households: only assignments explicitly marked placed. This setting does not change member progress.
- Awaiting placement: planned households minus explicitly placed households.
- Empty worlds: displayed catalog worlds with no assignments in the selected profile. Dashboard filters do not change the profile totals.
- Neighborhood coverage: distinct recorded neighborhood IDs containing assignments, compared with recorded neighborhoods. Missing or partial research is not treated as a complete map.
- Completed planned population: every assigned household is explicitly placed and every distinct assigned Sim has a placed status. It does not claim every lot is occupied or an actual save is complete.

World/neighborhood counts are local to each scope. The same ID assigned in multiple worlds can appear on each card; do not add those cards to calculate a unique profile population. The profile total deduplicates across all assignments. Generated IDs can recur across alternate rolls of the same household template; Townieverse cannot infer real in-game identity. Review repeated-ID concepts before placement. Distinct IDs sharing a name remain distinct Sims.

## Custom lots and notes

Custom lots belong to a profile and are separate from official records. Supply a name, world, optional recorded neighborhood, lot type and description. Dimensions are optional; if supplied, both must be integers from 1 to 1000. These user-supplied numbers are not official dimensions. Removing a custom lot requires confirmation and clears only that lot reference on assignments, retaining their world/neighborhood.

Profile descriptions, world notes, neighborhood notes and assignment notes persist locally. Each note form saves explicitly. No missing official lot dimensions or neighborhood names are invented.

## Backup and restoration

Expand **Planning backups and recovery**:

1. Export the selected profile or all profiles as `townieverse-planning` JSON. Files include profile metadata, assignments, notes, custom lots and recovery snapshots of assigned Casting Board households with their latest matching board metadata.
2. Import planning JSON to validate it and preview profile/assignment/lot counts. Merge skips identical profile-ID duplicates and gives conflicting profiles new IDs without overwriting current profiles. Replacement requires an explicit confirmation and affects only the planning store. Preview labels distinguish exact duplicates from conflicting IDs. Because exports refresh recovery metadata, an otherwise unchanged plan may conflict with an older stored snapshot; Merge preserves both versions rather than silently overwriting either.
3. Casting Board backup format/schema and its existing importer remain unchanged. Use Casting Board to import older board backups. Planning JSON and board JSON are distinct formats, clearly labeled.
4. **Export assigned households as Casting Board JSON** produces a compatible board backup from a selected profile. Keep a complete Casting Board backup too: unassigned entries, favorites and other generator types are not contained in planning exports.

Planning imports do not silently overwrite live Casting Board metadata. Matching live board content takes precedence for progress/title; the imported recovery snapshot remains in the plan. If the original board entry is missing, the planner still displays its preserved snapshot and offers **Restore household to Casting Board** as an additive merge. An existing ID pointing to different content is never silently substituted or overwritten; use backups/Casting Board to resolve that conflict before reassignment. Exported plans refresh matching snapshots without mutating stored originals.

## Storage, migration and safety

Planning uses `townieverse.planning.v1`, separate from `townieverse.casting-board.v1`, preferences and themes. It permits up to 100 profiles, 2,000 assignments/custom lots per profile, and a 10 MB JSON import. Real browser quota may be lower; repeated snapshot copies can use space quickly.

Runtime validation checks schemas, dates, IDs, referenced worlds/neighborhoods/lots, household snapshot validity, dimensions, duplicate profile/assignment/custom-lot IDs, text limits and unsafe JSON keys/depth. The documented v0 planning format has the same profile records but lacks selectedProfileId; loading it selects its first profile and migrates to v1 in memory. First successful writes use the v1 key without deleting the legacy key. No migration of existing Casting Board data is needed.

Unreadable or future-version planning data blocks edits and is preserved for raw recovery export. Confirmed reset/replacement is available after exporting that raw value. Storage failures/quota exhaustion leave prior persisted data and in-memory plans unchanged. Cross-tab storage events disable editing; every commit also compares the current raw stored value with the loaded value so missed events cannot silently overwrite another tab's changes. Reload to reconcile. Browser localStorage does not provide a true cross-process transaction: simultaneous writes in the narrow interval between comparison and write cannot be fully eliminated without a different architecture.

Storage is specific to browser/profile/origin (including port), with no server copy, sync or automatic game integration. Export both planning and Casting Board backups before clearing data or changing devices. Confirmed deletion/reset has no undo history.

## Coverage and limitations

Phase 7 content counts are unchanged: 200 styling entries, 31 official worlds, 92 official neighborhoods and 14 exact official lots. Twenty-seven official worlds still have no lot records; hidden areas and all districts are incomplete. See CONTENT_STATUS.md. These gaps never force a fictitious lot assignment. No backend, new dependency, deployment, game-file access or Phase 9 work was added.

## Phase 8 file changes

Created: src/types/planning.ts; src/utils/planning.ts; src/hooks/PlanningContext.ts; src/components/PlanningProvider.tsx; src/components/WorldPopulation.tsx; src/components/planning/AssignmentEditor.tsx; AssignToWorld.tsx; ProfileControls.tsx; PlanningBackup.tsx; CustomLots.tsx; WorldDetail.tsx; src/styles/planning.css; tests/planning.test.ts; tests/planning-interfaces.test.tsx; docs/WORLD_POPULATION.md.

Modified: src/App.tsx; src/types/navigation.ts; src/data/navigation.ts; src/components/Header.tsx; src/components/CastingBoard.tsx; src/components/Home.tsx; README.md; CONTENT_STATUS.md. Build output and browser proof copies are inside Townieverse. One real browser export was saved by the browser to its configured Downloads folder outside the project; its project copy is docs/phase-8-backup-check.json.

## Phase 8 verification

All 310 tests in 19 files pass, preserving the 260 existing tests and adding 50 planning unit/interface tests. TypeScript, ESLint, Prettier, content validation and production build pass. Desktop/mobile browser verification covered persistence, custom lots, assignments, independent member progress, disabled-pack plans, themes, keyboard focus and actual JSON export/import. The preview is docs/phase-8-preview.png. Phase 9 remains subject to approval.
