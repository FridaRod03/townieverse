import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { catalog, simData, twists } from '../src/data/library';
import { aesthetics as phase5Styles } from '../src/data/library/aesthetics';
import { starterCatalog } from '../src/data/starter';
import { inspectContent, nearDuplicateNames } from '../src/data/validation';
import { styleTypeOf, rarityOf } from '../src/data/aestheticTaxonomy';
import { defaultPreferences } from '../src/data/defaults';
import { matchesDiscovery } from '../src/utils/aestheticDiscovery';
import {
  matchesWorld,
  selectAesthetic,
  blendAesthetics,
} from '../src/generators/aesthetics';
import { eligibleEntries } from '../src/generators/eligibility';
import { generateSim, traitsCompatible } from '../src/generators/sims';
import { createSeededRandom } from '../src/utils/random';
import {
  BOARD_KEY,
  exportJson,
  newEntry,
  parseBoard,
  readBoard,
} from '../src/utils/casting';
import { defaultSettings, validStoredSettings } from '../src/utils/preferences';
import { aestheticText } from '../src/utils/resultText';
import { entryOf } from './casting-fixtures';
import { ENTRY_TYPES } from '../src/types/casting';
const preferences = defaultPreferences();
const full = {
  ...preferences,
  ownedPacks: catalog.packs.map((pack) => pack.id),
};
const world = (name: string) =>
  catalog.worlds.find((item) => item.name === name)!;

describe('Phase 7 content and discovery', () => {
  it('reports exact five-way classification and official coverage', () => {
    const count = (type: string) =>
      catalog.aesthetics.filter((style) => styleTypeOf(style) === type).length;
    expect(
      ['established', 'internet', 'historical', 'practical', 'original'].map(
        count,
      ),
    ).toEqual([57, 17, 19, 75, 32]);
    expect(
      inspectContent(catalog, simData.personalities, twists),
    ).toMatchObject({
      issues: [],
      counts: {
        aesthetics: 200,
        traits: 42,
        aspirations: 36,
        careers: 49,
        worlds: 34,
        neighborhoods: 98,
        lots: 14,
        officialEntries: 250,
        verifiedEntries: 345,
      },
    });
  });
  it('gives every style complete CAS metadata and source scope', () => {
    for (const style of catalog.aesthetics) {
      expect(style.styleType, style.name).toBeDefined();
      expect(style.rarity, style.name).toBeDefined();
      expect(style.aliases).toBeInstanceOf(Array);
      expect(style.hairSuggestions?.length).toBeGreaterThan(0);
      expect(style.makeupSuggestions?.length).toBeGreaterThan(0);
      expect(style.accessories?.length).toBeGreaterThan(0);
      if (
        ['established', 'historical', 'internet'].includes(styleTypeOf(style))
      )
        expect(style.verification.sources.length).toBeGreaterThan(0);
      if (styleTypeOf(style) === 'original')
        expect(style.verification.status).toBe('not-applicable');
    }
  });
  it('flags invalid classification, rarity, missing references and age metadata without mutation', () => {
    const data = structuredClone(catalog);
    Object.assign(data.aesthetics[0], {
      styleType: 'invented-movement',
      rarity: 'impossible',
    });
    data.aesthetics[1].verification.sources = [];
    data.aesthetics[2].aliases = [''];
    data.aesthetics[3].allowedAges = ['adult'];
    data.aesthetics[3].suggestedAges = ['child'];
    const before = JSON.stringify(data);
    expect(
      inspectContent(data, simData.personalities, twists).issues.map(
        (issue) => issue.code,
      ),
    ).toEqual(
      expect.arrayContaining([
        'aesthetic-classification',
        'aesthetic-rarity',
        'missing-source',
        'fashion-source',
        'empty-alias',
        'suggested-ages',
      ]),
    );
    expect(JSON.stringify(data)).toBe(before);
  });
  it('flags near-identical concept names rather than deleting them', () => {
    expect(nearDuplicateNames('Traditional Goth', 'Traditional Got')).toBe(
      true,
    );
    expect(nearDuplicateNames('Gothic Fashion', 'Victorian Goth')).toBe(false);
    const data = structuredClone(catalog);
    data.aesthetics[1].name = data.aesthetics[0].name + 'x';
    expect(inspectContent(data, simData.personalities, twists).issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'similar-concept-name',
          severity: 'review',
        }),
      ]),
    );
    expect(data.aesthetics).toHaveLength(200);
  });
  it('audits all pack names and types with stable IDs', () => {
    expect(new Set(catalog.packs.map((pack) => pack.id)).size).toBe(116);
    expect(new Set(catalog.packs.map((pack) => pack.name)).size).toBe(116);
    expect(
      ['base-game', 'expansion', 'game', 'stuff', 'kit'].map(
        (type) => catalog.packs.filter((pack) => pack.type === type).length,
      ),
    ).toEqual([1, 21, 12, 20, 62]);
    expect(catalog.packs.some((pack) => /Coach/.test(pack.name))).toBe(false);
  });
  it('excludes every exclusive official field when its pack is disabled', () => {
    const entries = [
      ...catalog.traits,
      ...catalog.aspirations,
      ...catalog.careers,
      ...catalog.worlds,
      ...catalog.worlds.flatMap((w) => [...w.neighborhoods, ...w.lots]),
    ];
    for (const pack of catalog.packs.filter(
      (pack) => pack.type !== 'base-game',
    )) {
      const result = eligibleEntries(
        entries,
        { ...full, ownedPacks: full.ownedPacks.filter((id) => id !== pack.id) },
        ['adult'],
      );
      expect(result.success).toBe(true);
      if (result.success)
        expect(
          result.value.some((entry) => entry.requiredPacks.includes(pack.id)),
          pack.name,
        ).toBe(false);
    }
  });
  it('does not impose DLC requirements on authored wardrobe advice', () => {
    expect(
      catalog.aesthetics.every((style) => style.requiredPacks.length === 0),
    ).toBe(true);
  });
  it('validates inherited world packs and symmetric trait conflicts', () => {
    const data = structuredClone(catalog);
    world('Moonwood Mill').neighborhoods.forEach((n) =>
      expect(n.requiredPacks).toEqual(['werewolves']),
    );
    data.worlds.find((w) => w.name === 'Moonwood Mill')!.lots[0].requiredPacks =
      [];
    data.traits.find((t) => t.name === 'Active')!.conflictsWith = [];
    expect(
      inspectContent(data, simData.personalities, twists).issues.map(
        (issue) => issue.code,
      ),
    ).toEqual(
      expect.arrayContaining(['world-pack-inheritance', 'trait-conflict']),
    );
  });
  it.each([
    [
      'Moonwood Mill',
      ['Grunge', 'Biker Roadwear', 'Punk', 'Forest Goth Layering'],
    ],
    [
      'Windenburg',
      [
        'Indie Sleaze',
        'Gothic Vintage Wardrobe',
        'European City Casual',
        'Minimal Clubwear',
      ],
    ],
    ['San Myshuno', ['Y2K Futurism', 'Techwear Commuter', 'Hip-Hop Style']],
    ['Henford-on-Bagley', ['Cottagecore', 'Rural Work Layers', 'Mori Kei']],
    ['Ravenwood', ['Whimsigoth', 'Gothic Vintage Wardrobe', 'Romantic Goth']],
  ])('matches relevant styles in %s and retains outsiders', (name, names) => {
    const selected = world(name as string);
    for (const styleName of names as string[])
      expect(
        matchesWorld(
          catalog.aesthetics.find((style) => style.name === styleName)!,
          selected,
        ),
        styleName,
      ).toBe(true);
    expect(
      catalog.aesthetics.some(
        (style) => !style.wildcard && !matchesWorld(style, selected),
      ),
    ).toBe(true);
    expect(catalog.aesthetics.some((style) => style.wildcard)).toBe(true);
  });
  it('provides multiple styles and neighborhoods for every official map world', () => {
    for (const item of catalog.worlds.filter((w) => w.origin === 'official')) {
      expect(item.neighborhoods.length, item.name).toBeGreaterThan(0);
      expect(
        catalog.aesthetics.filter((style) => matchesWorld(style, item)).length,
        item.name,
      ).toBeGreaterThan(2);
    }
  });
  it.each([
    ['forest girl', 'Mori Kei'],
    ['TRAD GOTH', 'Traditional Goth'],
    ['kogyaru', 'Kogal'],
    ['millennium futurism', 'Y2K Futurism'],
  ])('searches %s through canonical aliases', (query, expected) => {
    const found = catalog.aesthetics.filter((style) =>
      matchesDiscovery(style, { ...preferences, aestheticSearch: query }),
    );
    expect(found.map((style) => style.name)).toEqual([expected]);
  });
  it('normalizes accents in search and uses the same filters for locks', () => {
    const style = { ...catalog.aesthetics[0], aliases: ['Café Layers'] };
    expect(
      matchesDiscovery(style, {
        ...preferences,
        aestheticSearch: 'cafe layers',
      }),
    ).toBe(true);
    expect(
      blendAesthetics(
        [style, catalog.aesthetics[1]],
        preferences,
        () => 0,
        { styleType: 'original' },
        { first: style },
      ),
    ).toMatchObject({ success: false, error: { code: 'LOCK_CONFLICT' } });
  });
  it.each([
    'established',
    'internet',
    'historical',
    'practical',
    'original',
  ] as const)(
    'combines category, rarity, world and %s classification filters',
    (styleType) => {
      const eligible = catalog.aesthetics.find(
        (style) =>
          style.styleType === styleType &&
          !style.adultOnly &&
          style.worldAssociations.length,
      )!;
      const settings = {
        styleType,
        rarity: rarityOf(eligible),
        worldFilter: catalog.worlds.find(
          (w) => w.id === eligible.worldAssociations[0],
        )!,
      };
      const filtered = {
        ...preferences,
        aestheticCategories: [eligible.category],
      };
      const result = selectAesthetic(
        catalog.aesthetics,
        filtered,
        createSeededRandom(styleType),
        settings,
      );
      expect(result.success).toBe(true);
      if (result.success)
        expect(matchesDiscovery(result.value, filtered, settings)).toBe(true);
    },
  );
  it('blends distinct eligible styles and retains both metadata records', () => {
    const result = blendAesthetics(
      catalog.aesthetics,
      preferences,
      createSeededRandom('phase7-blend'),
      { styleType: 'original', rarity: 'rare' },
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.value.first.id).not.toBe(result.value.second.id);
      expect([
        result.value.first.styleType,
        result.value.second.styleType,
      ]).toEqual(['original', 'original']);
      expect(result.value.casSuggestions.length).toBe(
        new Set([
          ...result.value.first.casSuggestions,
          ...result.value.second.casSuggestions,
        ]).size,
      );
    }
  });
  it('returns an explicit empty pool for contradictory filters', () => {
    expect(
      selectAesthetic(
        catalog.aesthetics,
        { ...preferences, aestheticSearch: 'no-such-style' },
        () => 0,
        { styleType: 'historical' },
      ),
    ).toMatchObject({ success: false, error: { code: 'EMPTY_POOL' } });
  });
});

describe('Phase 7 backward compatibility and performance', () => {
  it('retains every Phase 5 style ID and canonical name', () => {
    for (const previous of [...phase5Styles, ...starterCatalog.aesthetics])
      expect(
        catalog.aesthetics.find((style) => style.id === previous.id)?.name,
      ).toBe(previous.name);
  });
  it('imports the actual Phase 6 browser-exported backup without rewriting content or metadata', () => {
    const raw = readFileSync(
      new URL('../docs/phase-6-backup-check.json', import.meta.url),
      'utf8',
    );
    const original = JSON.parse(raw) as { entries: unknown[] };
    const loaded = parseBoard(raw);
    expect(loaded.entries).toEqual(original.entries);
    expect(parseBoard(exportJson(loaded.entries)).entries).toEqual(
      original.entries,
    );
  });
  it.each(ENTRY_TYPES)(
    'loads old %s snapshots without requiring new style fields',
    (type) => {
      const previous = entryOf(type);
      const raw = exportJson([previous]);
      const loaded = readBoard({
        getItem: (key) => (key === BOARD_KEY ? raw : null),
      });
      expect(loaded.blocked).toBe(false);
      expect(loaded.board.entries).toEqual([previous]);
    },
  );
  it('round trips new directory favorites with authored metadata', () => {
    const style = catalog.aesthetics.find(
      (item) => item.name === 'Moonlit Greenhouse',
    )!;
    const saved = newEntry(
      'aesthetic',
      style.name,
      {
        snapshot: {
          styles: [style],
          userMetadata: { customLabel: 'My wardrobe' },
        },
        text: aestheticText(style),
        members: [],
      },
      'Ravenwood',
      true,
    );
    saved.notes = 'Personal changes to try';
    saved.tags = ['MyStyle'];
    expect(parseBoard(exportJson([saved])).entries).toEqual([saved]);
  });
  it('accepts old preferences and new categories without migrations', () => {
    const stored = defaultSettings();
    expect(validStoredSettings(stored)).toBe(true);
    stored.preferences.aestheticCategories = [
      'Japanese street fashion',
      'Sportswear',
    ];
    expect(validStoredSettings(stored)).toBe(true);
  });
  it('builds only one chosen personality per Sim roll', () => {
    let draws = 0;
    const result = generateSim(
      simData,
      full,
      () => {
        draws++;
        return 0.4;
      },
      { id: 'performance', name: 'Performance', age: 'adult', traitCount: 3 },
    );
    expect(result.success).toBe(true);
    expect(draws).toBe(4);
  });
  it('generates 20 full-catalog Sims within a generous interactive performance budget', () => {
    const start = performance.now();
    for (let i = 0; i < 20; i++) {
      const result = generateSim(simData, full, createSeededRandom(i), {
        id: `perf:${i}`,
        name: 'Performance',
        age: 'adult',
        traitCount: 3,
      });
      expect(result.success).toBe(true);
      if (result.success)
        expect(traitsCompatible(result.value.personality.traits)).toBe(true);
    }
    expect(performance.now() - start).toBeLessThan(2500);
  });
});
