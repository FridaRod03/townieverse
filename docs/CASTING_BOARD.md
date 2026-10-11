# Casting Board · Phase 6

Implemented October 10, 2026. Local-only; no backend or account. Phase 5's library counts and verification remain unchanged.

## Stored data

`townieverse.casting-board.v1` stores `{ schemaVersion: 1, entries: [...] }`. It never writes the preference or theme keys.

Every entry contains a persistent UUID, one of six types (`household`, `sim`, `aesthetic`, `relationship`, `storyline`, `world`), editable title, creation and modification ISO timestamps, notes, tags, optional world name, favorite boolean, manual progress, and per-member progress. The `content` object is separate: an independent JSON snapshot of the generated result, readable original text, and member IDs/names. It includes nested traits, aspirations, careers, styles, household genealogy, optional twists, world/neighborhood/lot details, and custom lots where present. Saving copies the actual result; it never rerolls or looks up a later catalog entry to reconstruct it.

An aesthetic blend stores both displayed styles. An individual Sim saved from a household includes that Sim and the household's aesthetic. Snapshots contain no live references to the generator state. Metadata edits update only metadata and modification time. A duplicate retains the original snapshot and copied metadata but receives a new ID and new dates. Progress is not automatically inferred from household or member status.

## Organization

Search covers title, notes, tags, world association, and readable original generated content. Filters intersect entry type, world, status, tag, and favorites. Sorting supports newest, oldest, alphabetically, and last modified. Tags are comma-separated, optional leading `#` is removed, and case-insensitive duplicates retain the first spelling. Up to 30 tags of 40 characters are supported. Titles are required and limited to 120 characters; notes allow 10,000 characters; world associations allow an existing or user-defined name of up to 120 characters.

Each entry starts at Idea. The other states are Planning, Creating in CAS, Created in CAS, Placed in World, and Playing. Every household member and individual Sim starts at Idea independently. Overall and member progress are editable without affecting one another.

## Export and import

Single-entry and full-board JSON use the same envelope:

```json
{
  "format": "townieverse-casting-board",
  "schemaVersion": 1,
  "exportedAt": "2026-10-10T12:00:00.000Z",
  "entries": []
}
```

JSON preserves all snapshots and metadata. TXT presents titles, type, favorites, progress, world, tags, notes, dates, individual member statuses, and original text. TXT cannot be re-imported. UTC timestamps appear in download filenames.

The complete import is parsed and validated before any board change. Runtime checks validate the envelope, supported schema, safe recursive JSON, metadata lengths/types/dates, known entry types and statuses, generated result shapes, nested game/content fields, roster/member IDs and progress keys, duplicate IDs, and entry count. Dangerous object keys (`__proto__`, `constructor`, `prototype`) are rejected at any depth. Content is rendered as React text, never HTML. No source URLs from imports are executed. Imports are limited to 10 MB, 2,000 entries, bounded array sizes, and 50 nesting levels.

Preview shows counts by type, total entries, duplicate IDs against the current board, and the selected import mode. Selecting another file clears the preview; slower earlier reads cannot override a newer file's preview.

- **Merge:** existing entries are untouched. Entries with new IDs are added. An incoming entry with the same ID and identical data is skipped. An incoming entry with the same ID but different data receives a new UUID and is added, preserving both versions. An invalid file or duplicate IDs within the file is rejected as a whole.
- **Replace:** validated incoming entries replace the board only after the user confirms a separate accessible dialog. An empty backup also requires confirmation before replacement. Failed writes leave the existing board and browser data intact.

Saving the same generator result repeatedly does not add duplicate entries. An intentional Duplicate action creates an independent alternate. Imported entries with different IDs are not silently deduplicated by content: they may represent deliberate alternate metadata or progress.

## Persistence, compatibility, and recovery

Loads are safe and do not write storage automatically. The application currently emits schema 1. An explicit compatibility migration accepts schema 0 envelopes with entries already matching the current entry shape; it does not invent missing fields. The legacy `townieverse.casting-board.v0` key is read only when the current key is absent. The old raw value remains untouched; migrated data is saved to the current key only on a successful user action. Future versions are rejected for this client, preserved, and recoverable as raw text.

If storage is corrupt or unsupported, the board enters recovery mode. It does not display a misleading editable empty collection or overwrite the raw stored value. **Export raw recovery data** downloads that original text when it can be read. The user can then import a valid backup with confirmed replacement or explicitly confirm starting a new empty board. Raw recovery exports are for manual inspection/recovery; malformed values are not automatically repairable or importable. If storage access itself is denied, the raw value may not be readable; saves remain unavailable until browser storage access returns.

Every change validates the next board, compares the current raw storage against the version this tab loaded, and writes before committing UI state. A quota error or failed write preserves the previous board and reports that the action did not save. If another tab changed storage, this tab refuses to overwrite it and asks for reload. This protects against ordinary stale-tab edits; LocalStorage does not provide multi-process transactions or real-time synchronization.

Deletion, replacement, and resetting unreadable data require dialogs with Cancel initially focused, keyboard focus kept inside, Escape cancellation, and focus restoration. There is no undo/history or automatic server backup. Users should export before deleting or replacing.

## Files and testing

New implementation: `src/types/casting.ts`, `src/utils/casting.ts`, `src/hooks/CastingContext.ts`, `src/components/CastingProvider.tsx`, `src/components/CastingBoard.tsx`, `src/components/SaveActions.tsx`, `src/components/Confirmation.tsx`, `src/styles/casting.css`.

Integration updates: `src/App.tsx`, `src/components/Header.tsx`, `src/components/Home.tsx`, `src/data/navigation.ts`, `src/types/navigation.ts`, and all six generator components. `vite.config.ts` separates the content-library bundle to keep production chunks below the warning threshold. Documentation: `README.md` and this file. Browser review artifacts: `docs/phase-6-preview.png` and `docs/phase-6-backup-check.json`. No content-library or verification-count changes are required.

Tests: `tests/casting-fixtures.ts`, `tests/casting.test.ts`, `tests/casting-interfaces.test.tsx`. They exercise all six snapshot types, exact content, duplicate prevention, favorites across remount, metadata/tag/progress edits, per-Sim progress, sorting/filtering, duplication, corrupt/future/legacy storage, denied storage, quota errors, stale tabs, JSON/TXT output, filenames, single/full imports, malformed/unsafe imports, merge collisions, deletion and replacement confirmation, cancellation, keyboard focus, and preservation after generator rerolls. Existing suites remain unchanged.

Final results: **219 tests across 15 files passed**, including all 170 existing tests. TypeScript, ESLint, Prettier, and the production build passed. Browser verification covered household and Sim persistence across reload, metadata/favorites/member progress, a real backup export/import merge round trip, keyboard focus/navigation and Escape cancellation, and responsive light/dark layouts at 320, 390, and 1280 pixels. No console errors or warnings were reported. Individual progress controls include numbered Sim labels so identical generated display names remain distinguishable.

## Known limits

- Storage belongs to this browser/profile and origin, including protocol/hostname/port. No cloud/device synchronization exists. Clearing browser data or ending private browsing may remove the board.
- Browser quota is generally reached before the 2,000-entry upper bound for large household snapshots. Export a JSON backup regularly. A rejected save leaves the old board intact and requires the user to resolve storage availability.
- Unsaved generator state, custom-lot pool, and rolled-lot history remain session-only. Saved snapshots preserve selected custom-lot content.
- Generated snapshots are read-only; metadata can be edited or duplicated. Importing does not convert saves into active generator inputs.
- Saved mature content remains part of the collection and its backups independently of current generator toggles. Saving it is an explicit user action; no mature content is added automatically.
- Functional keyboard/mobile checks are not a full assistive-technology audit.
- Phase 5's documented content gaps remain. Phase 7 is not authorized by this implementation.
