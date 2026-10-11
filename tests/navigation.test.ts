import { describe, expect, it } from 'vitest';
import { generatorSections, pageFromHash } from '../src/data/navigation';

describe('section navigation', () => {
  it('resolves every generator deep link', () => {
    for (const section of generatorSections)
      expect(pageFromHash(`#/${section.id}`)).toBe(section.id);
  });
  it('returns home for unknown routes and home anchors', () => {
    for (const hash of [
      '',
      '#/home',
      '#/unknown',
      '#generators',
      '#main-content',
    ])
      expect(pageFromHash(hash)).toBe('home');
  });
});
