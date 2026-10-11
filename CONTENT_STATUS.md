# Townieverse content status

Phase 7 source snapshot: **October 10, 2026**. This is a curated subset, not an exhaustive game or fashion database. Phase 8 adds planning tools without changing library counts.

## Exact active counts

| Library                                |   Total | Verification / classification                                        |
| -------------------------------------- | ------: | -------------------------------------------------------------------- |
| Established fashion styles/subcultures |      57 | Source-checked terminology                                           |
| Recognized internet aesthetics         |      17 | Source-checked terminology                                           |
| Historical fashion styles              |      19 | Source-checked terminology/period context                            |
| Practical wardrobe guides              |      75 | 2 source-checked photographic contexts; 73 authored guides           |
| Original creative concepts             |      32 | Explicitly authored concepts                                         |
| **All styling entries**                | **200** | **95 source-checked; 105 not-applicable; 0 unverified**              |
| Traits                                 |      42 | 36 official, 6 roleplay                                              |
| Aspirations                            |      36 | 33 official, 3 roleplay                                              |
| Careers / occupations                  |      49 | 44 official, 5 roleplay                                              |
| Worlds                                 |      34 | 31 official (28 residential, 3 destination), 3 fictional             |
| Neighborhoods                          |      98 | 92 official, 6 fictional                                             |
| Lots                                   |      14 | All official; sourced exact dimensions                               |
| Household concepts                     |     300 | Authored roleplay                                                    |
| Relationship prompts                   |     150 | Authored roleplay                                                    |
| Background/personality concepts        |     150 | Authored roleplay                                                    |
| Mature narrative prompts               |      78 | 26 each adult-romance, crime, substance-use; optional adult-only     |
| Pack records                           |     116 | Base game + 21 expansions + 12 game packs + 20 stuff packs + 62 kits |

Excluding packs: **1,151 records**, comprising **250 official**, **901 roleplay**, **0 bundled custom**. **345** source-checked (250 official facts plus 95 aesthetic terminology/context records); **806** not-applicable; **0** active records unverified. These labels describe provenance, not universal expert consensus or exhaustive gameplay verification. All 116 pack records separately retain sources. Aliases and styling tips do not inflate counts.

## Fashion and discovery

The library grew from 100 to **200** individually authored entries. The **400+ target is not reached**; at least 200 additional meaningful entries remain. No arbitrary combinations of outfit modifiers are counted as subcultures.

New browsing categories: Japanese street fashion, Streetwear, Clubwear, Historical, Workwear, Sportswear, Internet. Existing Everyday, Alternative, Vintage, Formal and Fantasy remain. Classification is separate from browsing category: an original gothic concept remains original.

Coverage expands goth/punk/scene, gyaru and Lolita substyles, historical dress, ravewear, western/rural workwear, sportswear, cyber styling, McBling and internet aesthetics. Korean-inspired entries are practical wardrobe guides informed by Seoul street-style photography, not invented established subcultures. Cultural context does not prescribe ethnicity, skin color, gender identity or mental-health identity.

The directory searches names, aliases, descriptions and tags; search is accent-insensitive. Category, classification, editorial rarity and optional associated-world filters apply to browsing, selection and blends. Styling tips/source references expand on demand; 24-card pagination avoids rendering the entire library. Directory favorites save canonical snapshots to Casting Board.

All 31 official worlds have multiple matching styles (range 7–92). Associations are creative, nonexclusive suggestions. Balanced Mode retains category-first **75% world match / 20% outsider / 5% wildcard**, with existing empty-bucket redistribution. Explicit world filtering narrows the pool; leave it unset to retain outsiders. Rarity is an editorial generation weight, not a population statistic.

## Official data and packs

Phase 7 adds **29 traits, 26 aspirations, 6 careers, 55 neighborhoods and 10 lots**. Added careers: Actor, Conservationist, Education, Freelancer, Naturopath, Park Worker, checked against EA Help. Traits/aspirations use Carl's guides; geographic names/dimensions primarily use the Sims Wiki and a world table. Each record retains references and verification notes. Indexed source excerpts were used where direct opening was blocked.

The 116-record inventory was compared with EA expansion/game/stuff/kit listings. No duplicate IDs/names or category errors were found. Country Kitchen remains an official kit even though the current English kit category omits it; its individual EA product page was checked. Maker products, bundles, currency offers and Deluxe upgrades are outside the five current pack types. This scoped inventory does not cover every store product.

Disabled packs exclude their exclusive content. Neighborhoods/lots inherit world requirements. Ordinary aesthetic/roleplay prompts require no unrelated packs. Details: [Phase 7 audit](docs/PHASE_7_AUDIT.md), [source methodology](docs/SOURCES.md), [machine-readable counts and world coverage](docs/content-validation.json).

## Integrity and compatibility

Validation checks duplicate IDs/names, alias collisions, suspicious similar names/descriptions, world/pack references, source/classification consistency, ages, rarity weights and symmetric trait conflicts. Review flags never delete content. Current catalog: **zero flagged issues**. Heuristics cannot prove semantic uniqueness.

All original persistent content IDs are retained. New aesthetic fields are optional on imported snapshots. Casting Board remains schema 1; no migration is needed. Tests load all six legacy entry types, round-trip the actual Phase 6 JSON backup and preserve safe unknown snapshot fields/user metadata. Preferences/themes and save/import code remain intact. Existing seeds may produce different new rolls after library expansion and the Sim engine optimization; saved snapshots are not regenerated.

## Remaining gaps

- **400-style target unfinished.** Further cultural/editorial review remains useful, especially inherited commercial/community terminology sources. Source-checked does not imply universal agreement.
- Traits/aspirations/careers are subsets. New trait/aspiration availability is conservatively young-adult/adult/elder until younger ages are researched. Milestones, occult prerequisites, career branches/agencies and all newer-pack CAS data are incomplete. Noble career coverage remains incomplete.
- All official worlds have neighborhood records, but hidden areas, special career locations and all districts are not comprehensively represented.
- **27 official worlds have no lot records.** Moonwood Mill's five lots are represented; Willow Creek, Oasis Springs and Forgotten Hollow have partial coverage. Unknown dimensions were omitted rather than guessed.
- Verification is a dated manual snapshot, not a live link monitor or an installed-game test. Geography often relies on community sources where EA publishes no complete table.
- No backend, cloud sync, deployment or offline PWA was added. Browser saves still need exported JSON backups for recovery.

Phase 8 was approved with these gaps understood. Its planning tools use the existing verified subset and custom lots. Phase 9 requires explicit approval.
