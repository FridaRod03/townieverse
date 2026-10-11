import type { Dispatch, SetStateAction } from 'react';
import { useStudio } from './StudioContext';
/** Trusted in-memory UI state only, retained across page navigation. */
export function useSessionState<T>(
  key: string,
  initial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const { session, setSession } = useStudio();
  const value = key in session ? (session[key] as T) : initial;
  const set: Dispatch<SetStateAction<T>> = (update) =>
    setSession((current) => ({
      ...current,
      [key]:
        typeof update === 'function'
          ? (update as (previous: T) => T)(
              key in current ? (current[key] as T) : initial,
            )
          : update,
    }));
  return [value, set];
}
