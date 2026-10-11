import type { ContentEntry, LifeStage, Verification } from '../../types/models';

export const adultAges: LifeStage[] = ['young-adult', 'adult', 'elder'];
export const schoolAges: LifeStage[] = ['child', 'teen'];
export const supportedAges: LifeStage[] = [...schoolAges, ...adultAges];
export const slug = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
export const verified = (...sources: string[]): Verification => ({
  status: 'verified',
  sources,
  notes:
    'Checked 2026-10-10. Verification applies to names and game dependencies; creative associations are authored.',
});
export const entry = (
  domain: string,
  name: string,
  description: string,
  extra: Partial<ContentEntry> = {},
): ContentEntry => ({
  id: `library:${domain}:${slug(name)}`,
  name,
  description,
  origin: 'roleplay',
  requiredPacks: [],
  verification: { status: 'not-applicable', sources: [] },
  categories: [],
  tags: [],
  weight: 1,
  commonness: 0.7,
  adultOnly: false,
  themes: [],
  ...extra,
});
/** Compact, checked authoring rows; pipes separate fields, semicolons separate list items. */
export function rows(text: string, columns: number): string[][] {
  return text
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => {
      const fields = line.split('|').map((field) => field.trim());
      if (fields.length !== columns || fields.some((field) => !field))
        throw new Error(
          `Malformed authored row (${columns} fields expected): ${line}`,
        );
      return fields;
    });
}
export const list = (text: string) =>
  text === '-' ? [] : text.split(';').map((part) => part.trim());
