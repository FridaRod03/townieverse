import type { Aesthetic } from '../types/models';

export const styleTypes = {
  established: 'Established fashion / subculture',
  internet: 'Recognized internet aesthetic',
  historical: 'Historical fashion',
  practical: 'Practical wardrobe guide',
  original: 'Original creative concept',
} as const;
export const styleCategories = [
  'Everyday',
  'Alternative',
  'Vintage',
  'Formal',
  'Fantasy',
  'Japanese street fashion',
  'Streetwear',
  'Clubwear',
  'Historical',
  'Workwear',
  'Sportswear',
  'Internet',
] as const;
export const rarityNames = ['common', 'uncommon', 'rare'] as const;
export const styleTypeOf = (style: Aesthetic) =>
  style.styleType ??
  (style.id.startsWith('starter:')
    ? 'original'
    : style.verification.status === 'verified'
      ? 'established'
      : 'practical');
export const rarityOf = (style: Aesthetic) =>
  style.rarity ??
  (style.commonness >= 0.7
    ? 'common'
    : style.commonness >= 0.3
      ? 'uncommon'
      : 'rare');
