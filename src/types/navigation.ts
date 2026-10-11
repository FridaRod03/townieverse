export type GeneratorId =
  'household' | 'sim' | 'aesthetic' | 'world' | 'relationship' | 'mature';
export type PageId = 'home' | 'casting' | 'population' | 'web' | GeneratorId;

export interface GeneratorSection {
  id: GeneratorId;
  number: string;
  icon: string;
  title: string;
  description: string;
  preview: string[];
  adultOnly?: boolean;
}
