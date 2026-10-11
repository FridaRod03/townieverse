# Townieverse engine · Phase 3

The engine is independent of React, browser storage, and the UI. Import its public API from `src/generators/index.ts`. Only typed data and a supplied random source are needed. The homepage, navigation, and theme components are unchanged.

## Data models

`src/types/models.ts` defines Household, HouseholdMember, HouseholdDynamic, HouseholdPrompt, IndividualSim, Personality, PersonalityProfile, Aesthetic, Relationship, GeneratedRelationship, World, Neighborhood, Lot, Trait, Aspiration, Career, GamePack, GeneratorPreferences, GeneratedResult, and ContentCatalog.

Content entries share an ID, name, description, origin, required pack IDs, verification status/sources, categories, tags, non-negative weight, commonness from 0 to 1, optional hard age compatibility, adult-only flag, and independent content themes. IDs must be unique across a catalog, including nested worlds/neighborhoods/lots and pack entries. Member slots and dynamic templates have IDs local to their household prompt. Generated member/dynamic IDs include their prompt ID.

`origin` distinguishes verified official game options from custom content and explicitly labeled roleplay suggestions. Unverified official records may be stored as metadata, but cannot be selected. A verified official entry must provide sources; the engine does not itself verify the truth of those sources. Authors must check them before marking content verified.

All life stages are modeled, including Newborn as a special case. Names in code use lowercase keys, such as `young-adult`. Age suggestions on aesthetics are separate from hard `allowedAges` restrictions.

No production content libraries have been populated. `tests/fixtures.ts` contains small fictional roleplay records and a fictional test pack, never imported by the application UI. Those fixtures do not represent official traits, aspirations, worlds, or lots.

## Randomness and modes

`createSeededRandom(seed)` hashes the text form of a seed with FNV-1a and uses Mulberry32 to produce values in `[0, 1)`. It does not use `Math.random`. Numeric seed `1` and text seed `"1"` intentionally normalize to the same stream. These are creative random draws, not cryptographic randomness.

All low-level generators receive a `RandomSource`. Recreate the source at the start of a reproducible run. Reusing a source advances its stream; it will not repeat its first roll. Reproducibility requires the same ordered data, seed, preferences, generator settings, and call order. Changes to content or engine algorithms can change results.

`rollCoreResult` creates separate streams from `[seed, iteration, field]`. This prevents locking world from shifting household randomness. Increment `iteration` to reroll reproducibly; repeating the same iteration repeats the same roll. It orchestrates world, household, aesthetic, and optional blend fields. Dedicated functions handle Sim/personality/career, neighborhood/lot, relationship, and optional storyline results. It deliberately rejects unrelated fields it cannot validate.

| Mode             | Selection behavior                                                                                                                       |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `random`         | Uniform selection among eligible entries, regardless of rarity or commonness. Zero rarity weight does not disable an entry in this mode. |
| `world-inspired` | Aesthetic base weight × 6 for explicit world associations or matching world tags. Other entries remain possible.                         |
| `balanced`       | Choose a bucket first: 75% inspired, 20% outsider, 5% wildcard. Then choose within that bucket using rarity and soft age weights.        |
| `realistic`      | Base weight × `(1 + 9 × commonness)` favors common households and everyday styles.                                                       |
| `chaos`          | Base weight × `(1 + 9 × (1 − commonness))` favors unusual content while retaining every hard filter.                                     |

Wildcard aesthetics have their own bucket even if they also match a world. Inspired and outsider buckets exclude wildcard entries. Empty buckets, including those with no positive selection weight, are removed and remaining bucket probabilities are normalized proportionally. Without a selected world or matching associations, inspired is empty; outsiders/wildcards receive 80/20 if both exist. With only one nonempty bucket, it receives 100%.

Aesthetic age suggestions multiply weighted selection by 1.5 when the selected age matches; they do not exclude other ages and do not affect uniform mode. Aesthetic category filters and case-insensitive search are applied before drawing. An empty category list means all categories. `blendAesthetics` picks distinct IDs, combines unique tags and CAS suggestions, and supports locking either or both halves.

`weightedSelect` rejects negative, NaN, and infinite weights, empty pools, and all-zero weighted pools. It scales large finite weights before summing. Custom random sources returning values outside `[0, 1)` receive a typed error. `uniformSelect` and `shuffled` use the same supplied random source.

## Packs, ages, and content controls

`defaultPreferences()` returns a fresh object, with an eight-Sim maximum and all three mature-theme controls off. Base-game requirements are always available, even when `ownedPacks` is empty. Every other required pack must be owned. Gameplay requirements belong on the content entry and on any affected household member slot. Catalog validation rejects unknown pack references. Custom and roleplay options have separate controls.

`eligibleEntries` validates preferences and metadata before filtering; `eligibilityReasons` explains why an individual entry is disabled. Caller-specified participant ages must be permitted by both preferences and the content's hard age compatibility.

Adult romance/sexual themes require the adult-romance toggle and explicitly identified Young Adult, Adult, or Elder participants. No Newborn, Infant, Toddler, Child, or Teen can participate. Crime and substance themes have separate toggles and honor each entry's own age compatibility. Enabling one control never enables another.

`generateStoryline` receives explicit participants and assigns only those IDs to its result. `validateStorylines` rejects missing, duplicate, or unknown participants. An ordinary family household can include an adult private storyline when only the adults are participants. The household cannot be labeled adult-only while containing a minor. Story prompts should remain narrative and non-explicit; validation cannot interpret natural-language text, so content review remains necessary.

## Household composition

Each prompt supplies an explicit set of member slots, slot age choices, relationships, minimum/maximum size, and optional age-count requirements. `composeHousehold` shuffles age choices deterministically, then searches for a valid assignment with relationship and age-count pruning. `generateHousehold` considers only successfully composable prompts before choosing using the mode's household weights. Impossible prompts produce helpful errors rather than changing the rules.

Every household must have 1–8 members (or the smaller user limit) and at least one Teen or older. Newborns are supported in accompanied family compositions. Members and relationships need valid IDs; every relationship must reference two different existing members.

Biological parent compatibility uses a conservative stage table:

- Young Adult parent: Newborn through Child.
- Adult parent: Newborn through Young Adult.
- Elder parent: Newborn through Adult.

Adoptive and step parents must be adults in a later life stage than their child. Chosen-family ties are not biological ancestry. The engine rejects ancestry cycles, more than two biological parents, conflicting family ties, parent/sibling romance, ancestor/descendant romance, and romantic partners sharing a known ancestor. Ordinary partners must be two adults or two Teens; the latter can never receive sexual themes.

Category checks enforce single-member singles, two-member couples with a partner tie, families with a parent tie, exactly one resident parent for single-parent prompts, biological/adoptive plus step ties for blended families, adult roommates with a roommate tie, a three-generation ancestry chain for multigenerational prompts, only elders in elder households, an occult member in occult households, and adults-only membership/classification for adult-only prompts. Pack-specific occult members need explicit pack requirements; ghost is a base-compatible special case. Content authors remain responsible for accurate pack IDs.

## Sims, relationships, and lots

`generateSim` chooses an eligible aspiration, compatible trait combination, personality profile, and career. It satisfies aspiration trait requirements and excludes conflicting traits and identical likes/dislikes. Personality text is drawn from a separate typed dataset. Basic trait-count caps are one for Infant/Toddler/Child, two for Teen, and three for adults. Newborn standalone Sim generation is unsupported; it returns an age/configuration error instead of inventing aspirations or traits. Earned, reward, and additional-trait systems are not yet modeled.

`generateRelationship` takes two existing members, filters prompts for both ages, and checks directed parent/child compatibility. Family prompts must identify their family tie. Pass the containing household to check known genealogy and conflicting relationship assignments; the engine cannot infer unseen family history from two IDs alone. The function returns a narrative relationship and does not mutate the household graph. Positive, neutral, and negative tones are preserved as content metadata.

`selectWorld`, `selectNeighborhood`, and `selectLot` honor parent world eligibility, nested associations, and pack filters. Exact lot selection requires positive integer dimensions and verified official metadata; enabled custom/roleplay lots may use author-supplied sizes. Unverified official lots and unknown sizes are omitted. Previously rolled lot IDs can be excluded, and exhaustion returns an explanation. The custom lot editor is future UI work; the engine accepts custom records now.

## Locks and error handling

Every generator returns `EngineResult<T>`: either `{ success: true, value }` or `{ success: false, error: { code, message, details } }`. Handle both branches; do not assume a result exists.

`rerollFields` performs an atomic shallow draft update in the requested field order. Locked/untouched values are retained and locked generator callbacks are not called. Callbacks must be pure and must not mutate nested objects. A validator runs before and after updates. An optional `validateRetained` callback permits replacement of invalid unlocked values while validating locks and untouched fields. Without that callback, the generic helper conservatively validates the entire previous object first.

`rollCoreResult` and `rerollSimFields` supply retained-field validation. Changed filters that invalidate a locked value produce `LOCK_CONFLICT`; they never overwrite the lock. An invalid unlocked field may be replaced explicitly. Request dependencies in order (world before aesthetic; aspiration before personality when rerolling both). Sim aspiration-only rerolls choose among options compatible with retained traits. A reroll can validly produce the same option when pools are small; forced novelty is not implemented.

## Adding content

1. Add typed records under `src/data/`, separate from UI and engine functions. Use stable namespaced IDs, such as `roleplay:household:studio-neighbors`.
2. Provide all shared metadata. Keep cultural identities distinct from clothing/style choices; describe respectful CAS styling without reducing identities to costumes or personality traits.
3. For official content, confirm exact names, pack requirements, life-stage availability, lot dimensions, and source links. Keep uncertain records unverified.
4. Use `allowedAges` for actual restrictions, `suggestedAges` for aesthetic preferences, and separate theme tags for each independent control.
5. Specify household member slots, pack dependencies, and relationship directions explicitly. The slot roster is fixed in Phase 3: to support multiple sizes, author distinct meaningful compositions, rather than filler copies.
6. Run `validateCatalog` for the combined content catalog, `validateEntries` for personality/storyline data, and composition validation for household templates. Add regression tests for any special constraints.
7. Run `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm test`, and `npm run build`.

Example use with an author-supplied catalog:

```ts
import { defaultPreferences, rollCoreResult } from './src/generators';

const result = rollCoreResult(catalog, defaultPreferences(), 'my-save', {
  iteration: 0,
});
if (result.success) {
  console.log(result.value);
} else {
  console.error(result.error.message, result.error.details);
}
```

## Known limitations and next phase

No complete official content catalog exists, and the engine has not been wired into generator pages. Phase 4 should add controls and results views without changing these hard constraints. LocalStorage generator preferences/results, import/export validation, favorites, offline installation, custom lot editor, and hosting remain future work.

Household life-stage rules cannot represent exact chronological age differences or all real-life adoption situations. Templates use fixed slot rosters. Exact genealogy checks only cover provided relationships. The backtracking solver and trait-combination enumeration prioritize correctness for small datasets; larger catalogs should be profiled before UI integration. Engine metadata validation is for typed content, not a complete security/schema validator for arbitrary imported JSON.
