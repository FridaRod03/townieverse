import type {
  ContentCatalog,
  ContentEntry,
  PersonalityProfile,
  Storyline,
} from '../types/models';
import { LIFE_STAGES } from '../types/models';
import { defaultPreferences } from './defaults';
import { validateCatalog, validateEntries } from '../generators/eligibility';
import { composeHousehold } from '../generators/households';
import { createSeededRandom } from '../utils/random';
import { styleCategories, styleTypes, rarityNames } from './aestheticTaxonomy';

export interface ContentIssue {
  severity: 'error' | 'review';
  code: string;
  ids: string[];
  message: string;
}
export interface ContentReport {
  counts: Record<string, number>;
  issues: ContentIssue[];
}
export const normalizedName = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
const tokens = (text: string) =>
  new Set(text.toLowerCase().match(/[a-z]{3,}/g) ?? []);
/** One-edit spelling variants flag likely duplicate concepts, not parent/substyles. */
export function nearDuplicateNames(first: string, second: string): boolean {
  const a = normalizedName(first),
    b = normalizedName(second);
  if (
    Math.min(a.length, b.length) < 8 ||
    Math.abs(a.length - b.length) > 1 ||
    a === b
  )
    return false;
  let i = 0,
    j = 0,
    edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (a.length >= b.length) i++;
    if (b.length >= a.length) j++;
  }
  return edits + (a.length - i) + (b.length - j) === 1;
}
/** Jaccard overlap flags candidates for human review, never deletes entries. */
export function descriptionSimilarity(first: string, second: string): number {
  return tokenSimilarity(tokens(first), tokens(second));
}
function tokenSimilarity(a: Set<string>, b: Set<string>): number {
  if (Math.min(a.size, b.size) < 10) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return intersection / (a.size + b.size - intersection);
}
export function inspectContent(
  catalog: ContentCatalog,
  personalities: readonly PersonalityProfile[],
  twists: readonly Storyline[],
): ContentReport {
  const issues: ContentIssue[] = [];
  const add = (
    code: string,
    ids: string[],
    message: string,
    severity: ContentIssue['severity'] = 'error',
  ) => issues.push({ severity, code, ids, message });
  const groups: Record<string, readonly ContentEntry[]> = {
    worlds: catalog.worlds,
    neighborhoods: catalog.worlds.flatMap((world) => world.neighborhoods),
    lots: catalog.worlds.flatMap((world) => world.lots),
    households: catalog.households,
    aesthetics: catalog.aesthetics,
    traits: catalog.traits,
    aspirations: catalog.aspirations,
    careers: catalog.careers,
    relationships: catalog.relationships,
    backgrounds: personalities,
    maturePrompts: twists,
  };
  const entries = Object.values(groups).flat();
  const packIds = new Set(catalog.packs.map((pack) => pack.id));
  const ids = new Map<string, string>();
  const packNames = new Map<string, string>();
  for (const pack of catalog.packs) {
    const key = normalizedName(pack.name);
    if (packNames.has(key))
      add(
        'duplicate-pack-name',
        [packNames.get(key)!, pack.id],
        'Pack names collide after normalization.',
      );
    packNames.set(key, pack.id);
  }
  for (const item of [...catalog.packs, ...entries]) {
    if (ids.has(item.id))
      add('duplicate-id', [item.id], 'ID occurs more than once.');
    ids.set(item.id, item.name);
  }
  const structural = validateCatalog(catalog);
  if (!structural.success)
    add('catalog', structural.error.details, structural.error.message);
  const extras = validateEntries([...personalities, ...twists]);
  if (!extras.success)
    add('extra-entries', extras.error.details, extras.error.message);
  for (const [group, items] of Object.entries(groups)) {
    const names = new Map<string, string>();
    for (const item of items) {
      // Repeated neighborhood names across different worlds can be valid.
      const key =
        normalizedName(item.name) +
        (group === 'neighborhoods'
          ? `:${(item as { worldId?: string }).worldId}`
          : '');
      if (names.has(key))
        add(
          'duplicate-name',
          [names.get(key)!, item.id],
          `Normalized ${group} names collide.`,
        );
      names.set(key, item.id);
      if (!item.description.trim())
        add('missing-description', [item.id], 'Description is required.');
      if (!['official', 'custom', 'roleplay'].includes(item.origin))
        add('classification', [item.id], 'Invalid origin classification.');
      if (
        !Number.isFinite(item.weight) ||
        item.weight <= 0 ||
        !Number.isFinite(item.commonness) ||
        item.commonness < 0 ||
        item.commonness > 1
      )
        add(
          'weight',
          [item.id],
          'Weight must be positive and commonness must lie in [0,1].',
        );
      if (
        item.requiredPacks.some((id) => !packIds.has(id) && id !== 'base-game')
      )
        add('pack-reference', [item.id], 'Unknown required pack.');
      if (
        item.allowedAges &&
        (!item.allowedAges.length ||
          item.allowedAges.some((age) => !LIFE_STAGES.includes(age)))
      )
        add('ages', [item.id], 'Allowed ages are missing or invalid.');
      if (
        item.origin === 'official' &&
        (item.verification.status !== 'verified' ||
          !item.verification.sources.length)
      )
        add(
          'official-verification',
          [item.id],
          'Unverified official content cannot enter the active catalog.',
        );
      if (item.verification.status === 'unverified')
        add('unverified', [item.id], 'Entry needs source review.', 'review');
      if (
        !['verified', 'unverified', 'not-applicable'].includes(
          item.verification.status,
        )
      )
        add('verification-status', [item.id], 'Invalid verification status.');
      if (
        item.verification.status === 'verified' &&
        !item.verification.sources.length
      )
        add('missing-source', [item.id], 'Verified entries need a source.');
      if (
        item.verification.sources.some((source) => !/^https:\/\//.test(source))
      )
        add('source-url', [item.id], 'Sources must use HTTPS URLs.');
      if (
        item.themes.length &&
        (!item.adultOnly ||
          !item.allowedAges?.length ||
          item.allowedAges.some(
            (age) => !['young-adult', 'adult', 'elder'].includes(age),
          ))
      )
        add(
          'mature-classification',
          [item.id],
          'Mature entries require explicit adult-only life stages.',
        );
      if (
        item.adultOnly &&
        item.allowedAges?.some(
          (age) => !['young-adult', 'adult', 'elder'].includes(age),
        )
      )
        add('adult-ages', [item.id], 'Adult-only entry includes minors.');
    }
    if (
      [
        'households',
        'aesthetics',
        'backgrounds',
        'relationships',
        'maturePrompts',
      ].includes(group)
    ) {
      // Tokenize each description once, rather than once per comparison.
      const descriptions = items.map((item) => tokens(item.description));
      for (let i = 0; i < items.length; i++)
        for (let j = i + 1; j < items.length; j++)
          if (tokenSimilarity(descriptions[i], descriptions[j]) >= 0.72)
            add(
              'similar-description',
              [items[i].id, items[j].id],
              `Possible near duplicate in ${group}; compare meaning before editing.`,
              'review',
            );
    }
  }
  for (const pack of catalog.packs)
    if (
      !pack.name.trim() ||
      !['base-game', 'expansion', 'game', 'stuff', 'kit'].includes(pack.type) ||
      pack.verification.status !== 'verified' ||
      !pack.verification.sources.length
    )
      add(
        'pack-fields',
        [pack.id],
        'Pack name/type/source verification is incomplete.',
      );
  const adultPreferences = {
    ...defaultPreferences(),
    ownedPacks: [...packIds],
    allowedAges: [...LIFE_STAGES],
    maximumHouseholdSize: 8,
    allowAdultRomance: true,
    allowCrime: true,
    allowSubstanceUse: true,
  };
  for (const household of catalog.households) {
    const composed = composeHousehold(
      household,
      adultPreferences,
      createSeededRandom(household.id),
    );
    if (!composed.success)
      add(
        'household-composition',
        [household.id, ...composed.error.details],
        composed.error.message,
      );
    if (
      !household.financialSituation.trim() ||
      !household.livingArrangement.trim() ||
      !household.backstory.trim() ||
      household.memberSlots.some((slot) => !slot.name.trim())
    )
      add(
        'household-fields',
        [household.id],
        'Household roles, finances, home, and backstory are required.',
      );
  }
  const worldIds = new Set(catalog.worlds.map((world) => world.id));
  const categories = new Set<string>(styleCategories);
  const fashionNames = new Map<string, string>();
  for (let i = 0; i < catalog.aesthetics.length; i++)
    for (let j = i + 1; j < catalog.aesthetics.length; j++) {
      if (
        nearDuplicateNames(
          catalog.aesthetics[i].name,
          catalog.aesthetics[j].name,
        )
      )
        add(
          'similar-concept-name',
          [catalog.aesthetics[i].id, catalog.aesthetics[j].id],
          'Near-identical fashion names need review; no records were removed.',
          'review',
        );
    }
  for (const style of catalog.aesthetics) {
    if (!style.styleType || !(style.styleType in styleTypes))
      add(
        'aesthetic-classification',
        [style.id],
        'Active styles must specify a supported classification.',
      );
    if (!style.rarity || !rarityNames.includes(style.rarity))
      add(
        'aesthetic-rarity',
        [style.id],
        'Active styles must specify a valid rarity.',
      );
    if (
      ['established', 'internet', 'historical'].includes(
        style.styleType ?? '',
      ) &&
      (!style.verification.sources.length ||
        style.verification.status === 'not-applicable')
    )
      add(
        'fashion-source',
        [style.id],
        'Claimed fashion terminology needs a verifiable source.',
      );
    if (
      style.styleType === 'original' &&
      style.verification.status === 'verified'
    )
      add(
        'original-verification',
        [style.id],
        'Original concepts cannot be verified as established terminology.',
      );
    if (
      style.allowedAges &&
      style.suggestedAges.some((age) => !style.allowedAges!.includes(age))
    )
      add(
        'suggested-ages',
        [style.id],
        'Suggested ages must obey hard age restrictions.',
      );
    if (
      !categories.has(style.category) ||
      !style.casSuggestions.length ||
      !style.suggestedAges.length ||
      style.suggestedAges.some((age) => !LIFE_STAGES.includes(age))
    )
      add(
        'aesthetic-fields',
        [style.id],
        'Category, clothing suggestions, and valid suggested ages are required.',
      );
    if (style.worldAssociations.some((id) => !worldIds.has(id)))
      add(
        'world-reference',
        [style.id],
        'Aesthetic references an unknown world.',
      );
    if (
      !style.hairSuggestions?.length ||
      !style.makeupSuggestions?.length ||
      !style.accessories?.length ||
      !style.culturalContext?.trim()
    )
      add(
        'styling-details',
        [style.id],
        'Styling entries require hair, makeup, accessories, and context.',
      );
    for (const name of [style.name, ...(style.aliases ?? [])]) {
      const key = normalizedName(name);
      if (!key)
        add(
          'empty-alias',
          [style.id],
          'Canonical names and aliases must contain searchable characters.',
        );
      if (fashionNames.has(key) && fashionNames.get(key) !== style.id)
        add(
          'alias-collision',
          [fashionNames.get(key)!, style.id],
          'Canonical name or alias belongs to multiple entries.',
        );
      fashionNames.set(key, style.id);
    }
  }
  for (const trait of catalog.traits)
    for (const id of trait.conflictsWith)
      if (!catalog.traits.some((other) => other.id === id))
        add('trait-reference', [trait.id, id], 'Unknown conflict trait.');
      else if (
        id === trait.id ||
        !catalog.traits
          .find((other) => other.id === id)!
          .conflictsWith.includes(trait.id)
      )
        add(
          'trait-conflict',
          [trait.id, id],
          'Trait conflicts must be symmetric and cannot reference self.',
        );
  for (const world of catalog.worlds) {
    for (const child of [...world.neighborhoods, ...world.lots]) {
      if (
        child.origin === 'official' &&
        world.requiredPacks.some((pack) => !child.requiredPacks.includes(pack))
      )
        add(
          'world-pack-inheritance',
          [world.id, child.id],
          'Official world content must require its world pack.',
        );
    }
  }
  for (const aspiration of catalog.aspirations)
    if (
      aspiration.traitRequirements.some(
        (id) => !catalog.traits.some((trait) => trait.id === id),
      )
    )
      add('aspiration-reference', [aspiration.id], 'Unknown required trait.');
  for (const lot of catalog.worlds.flatMap((world) => world.lots)) {
    if (
      !lot.lotType.trim() ||
      !lot.size ||
      !Number.isInteger(lot.size.width) ||
      !Number.isInteger(lot.size.height) ||
      lot.size.width <= 0 ||
      lot.size.height <= 0
    )
      add(
        'lot-fields',
        [lot.id],
        'Exact lots need a type and positive integer dimensions.',
      );
  }
  for (const relationship of catalog.relationships)
    if (
      !['positive', 'neutral', 'negative'].includes(relationship.tone) ||
      ![
        'family',
        'romantic',
        'friendship',
        'rivalry',
        'coworkers',
        'neighbors',
        'ex-partners',
        'estranged-relatives',
        'chosen-family',
        'business-partners',
      ].includes(relationship.kind)
    )
      add(
        'relationship-fields',
        [relationship.id],
        'Invalid relationship kind/tone.',
      );
  for (const profile of personalities)
    if (
      !profile.hobbies.length ||
      !profile.personalGoal.trim() ||
      !profile.flaw.trim() ||
      profile.likes.some((like) => profile.dislikes.includes(like))
    )
      add(
        'background-fields',
        [profile.id],
        'Background hobbies, goal, optional flaw text, and nonconflicting preferences are required.',
      );
  for (const twist of twists)
    if (!twist.themes.length || !twist.adultOnly || !twist.allowedAges?.length)
      add(
        'twist-fields',
        [twist.id],
        'Mature prompt must have a theme and explicit adult ages.',
      );
  return {
    counts: {
      packs: catalog.packs.length,
      ...Object.fromEntries(
        Object.entries(groups).map(([group, items]) => [group, items.length]),
      ),
      officialEntries: entries.filter((item) => item.origin === 'official')
        .length,
      roleplayEntries: entries.filter((item) => item.origin === 'roleplay')
        .length,
      customEntries: entries.filter((item) => item.origin === 'custom').length,
      verifiedEntries: entries.filter(
        (item) => item.verification.status === 'verified',
      ).length,
      unverifiedEntries: entries.filter(
        (item) => item.verification.status === 'unverified',
      ).length,
    },
    issues,
  };
}
