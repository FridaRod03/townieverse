import { useState } from 'react';
import { useSessionState } from './useSessionState';
import { useStudio } from './StudioContext';
import { createSeededRandom } from '../utils/random';
import type { RollContext } from '../types/interface';
export function useRoll(scope: string) {
  const { settings } = useStudio();
  const [counter, setCounter] = useSessionState(`${scope}.counter`, {
    seed: settings.seed,
    value: 0,
  });
  const [stamp, setStamp] = useState('');
  const next = (): RollContext => {
    const iteration = counter.seed === settings.seed ? counter.value : 0;
    setCounter({ seed: settings.seed, value: iteration + 1 });
    const seed = settings.seed.trim() || crypto.randomUUID();
    setStamp(`Seed: ${seed} · Roll ${iteration + 1}`);
    return {
      seed,
      iteration,
      random: (field) =>
        createSeededRandom(JSON.stringify([seed, iteration, scope, field])),
    };
  };
  return { next, stamp };
}
