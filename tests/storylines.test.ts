import { describe, expect, it } from 'vitest';
import { defaultPreferences } from '../src/data/defaults';
import { generateStoryline } from '../src/generators/storylines';
import { entry } from './fixtures';

describe('optional storyline engine', () => {
  const mature = entry('private-story', { themes: ['adult-romance'] });
  it('defaults to disabled and enables adult-only explicitly assigned participants', () => {
    expect(
      generateStoryline(
        [mature],
        [{ id: 'parent', age: 'adult' }],
        defaultPreferences(),
        () => 0,
      ).success,
    ).toBe(false);
    expect(
      generateStoryline(
        [mature],
        [{ id: 'parent', age: 'adult' }],
        { ...defaultPreferences(), allowAdultRomance: true },
        () => 0,
      ),
    ).toMatchObject({ success: true, value: { participantIds: ['parent'] } });
  });
  it('never includes minors in sexual themes, even with the toggle enabled', () => {
    expect(
      generateStoryline(
        [mature],
        [
          { id: 'parent', age: 'adult' },
          { id: 'teen', age: 'teen' },
        ],
        { ...defaultPreferences(), allowAdultRomance: true },
        () => 0,
      ),
    ).toMatchObject({ success: false, error: { code: 'EMPTY_POOL' } });
  });
  it('keeps crime, substance use, and adult romance independently gated', () => {
    const prompts = [
      mature,
      entry('crime', { themes: ['crime'] }),
      entry('substance', { themes: ['substance-use'] }),
    ];
    expect(
      generateStoryline(
        prompts,
        [{ id: 'adult', age: 'adult' }],
        { ...defaultPreferences(), allowCrime: true },
        () => 0,
      ),
    ).toMatchObject({ success: true, value: { id: 'crime' } });
  });
  it('rejects unidentified, duplicate, and missing participants and empty datasets', () => {
    expect(
      generateStoryline([mature], [], defaultPreferences(), () => 0).success,
    ).toBe(false);
    expect(
      generateStoryline(
        [mature],
        [{ id: '', age: 'adult' }],
        defaultPreferences(),
        () => 0,
      ).success,
    ).toBe(false);
    expect(
      generateStoryline(
        [mature],
        [
          { id: 'a', age: 'adult' },
          { id: 'a', age: 'adult' },
        ],
        defaultPreferences(),
        () => 0,
      ).success,
    ).toBe(false);
    expect(
      generateStoryline(
        [],
        [{ id: 'a', age: 'adult' }],
        defaultPreferences(),
        () => 0,
      ),
    ).toMatchObject({ success: false, error: { code: 'EMPTY_POOL' } });
  });
});
