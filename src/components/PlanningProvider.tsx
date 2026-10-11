import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { PlanningContext } from '../hooks/PlanningContext';
import { useStudio } from '../hooks/StudioContext';
import {
  emptyPlanning,
  LEGACY_PLANNING_KEY,
  mergePlanning,
  parsePlanning,
  PLANNING_KEY,
} from '../utils/planning';
import type { PlanningData } from '../types/planning';

export function PlanningProvider({ children }: { children: ReactNode }) {
  const { catalog } = useStudio();
  const [loaded] = useState(() => {
    let raw: string | null = null;
    try {
      raw =
        localStorage.getItem(PLANNING_KEY) ??
        localStorage.getItem(LEGACY_PLANNING_KEY);
      return {
        data: raw ? parsePlanning(raw, catalog) : emptyPlanning(),
        raw,
        blocked: false,
        notice: '',
      };
    } catch {
      return {
        data: emptyPlanning(),
        raw,
        blocked: true,
        notice:
          'Planning data is unreadable or storage is unavailable. Export recovery data before a confirmed replacement. Existing Casting Board data is unchanged.',
      };
    }
  });
  const [data, setData] = useState(loaded.data);
  const current = useRef(data),
    expected = useRef(loaded.raw);
  const [blocked, setBlocked] = useState(loaded.blocked),
    [stale, setStale] = useState(false),
    [notice, setNotice] = useState(loaded.notice),
    [recoveryRaw, setRecoveryRaw] = useState(
      loaded.blocked ? loaded.raw : null,
    );
  useEffect(() => {
    const changed = (e: StorageEvent) => {
      if (
        e.key === PLANNING_KEY ||
        e.key === LEGACY_PLANNING_KEY ||
        e.key === null
      ) {
        setStale(true);
        setNotice(
          'Plans changed in another tab. Reload before editing to avoid overwriting changes.',
        );
      }
    };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);
  const commit = (next: PlanningData, message: string, recovery = false) => {
    if (stale || (blocked && !recovery)) {
      setNotice(
        'Reload stale plans or recover unreadable data before editing.',
      );
      return false;
    }
    try {
      if (
        (localStorage.getItem(PLANNING_KEY) ??
          localStorage.getItem(LEGACY_PLANNING_KEY)) !== expected.current
      ) {
        setStale(true);
        setNotice('Plans changed in another tab. Reload before editing.');
        return false;
      }
      const validated = parsePlanning(JSON.stringify(next), catalog),
        raw = JSON.stringify(validated);
      localStorage.setItem(PLANNING_KEY, raw);
      expected.current = raw;
      current.current = validated;
      setData(validated);
      setBlocked(false);
      setRecoveryRaw(null);
      setNotice(message);
      return true;
    } catch (error) {
      setNotice(
        `Plans were not saved. ${typeof error === 'object' && error !== null && 'name' in error && error.name === 'QuotaExceededError' ? 'Browser storage is full; export a backup and free space.' : 'Storage is unavailable or planning data is invalid.'} Previous data is unchanged.`,
      );
      return false;
    }
  };
  return (
    <PlanningContext.Provider
      value={{
        data,
        notice,
        blocked,
        stale,
        recoveryRaw,
        commit,
        updateProfile: (profile) =>
          commit(
            {
              ...current.current,
              profiles: current.current.profiles.map((p) =>
                p.id === profile.id
                  ? { ...profile, modifiedAt: new Date().toISOString() }
                  : p,
              ),
            },
            'Plan updated.',
          ),
        importPlans: (incoming, mode, confirmed = false) => {
          if (mode === 'replace' && !confirmed) {
            setNotice('Confirm replacement before importing.');
            return false;
          }
          if (blocked && mode === 'merge') {
            setNotice('Export recovery data, then confirm replacement.');
            return false;
          }
          try {
            return commit(
              mode === 'merge'
                ? mergePlanning(
                    current.current,
                    parsePlanning(JSON.stringify(incoming), catalog),
                  )
                : parsePlanning(JSON.stringify(incoming), catalog),
              mode === 'merge'
                ? 'Profiles merged. Conflicting IDs preserved as separate profiles.'
                : 'Planning profiles replaced.',
              mode === 'replace' && confirmed,
            );
          } catch {
            setNotice('Import failed. Existing profiles are unchanged.');
            return false;
          }
        },
      }}
    >
      {children}
    </PlanningContext.Provider>
  );
}
