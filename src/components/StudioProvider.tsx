import { useMemo, useRef, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { SharedSettings } from '../types/interface';
import { catalog as libraryCatalog } from '../data/library';
import type { HouseholdConcept } from '../types/interface';
import type { IndividualSim, Lot } from '../types/models';
import {
  defaultSettings,
  readSettings,
  SETTINGS_KEY,
  validStoredSettings,
} from '../utils/preferences';
import { StudioContext } from '../hooks/StudioContext';

export function StudioProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Record<string, unknown>>({});
  const [loaded] = useState(() => {
    try {
      return readSettings(localStorage);
    } catch {
      return {
        settings: defaultSettings(),
        notice:
          'Browser storage is unavailable. Settings will last for this session.',
      };
    }
  });
  const [settings, setSettings] = useState(loaded.settings);
  const settingsRef = useRef(loaded.settings);
  const [notice, setNotice] = useState(loaded.notice);
  const [customLots, setCustomLots] = useState<Lot[]>([]);
  const [concept, setConcept] = useState<HouseholdConcept | null>(null);
  const [individual, setIndividual] = useState<IndividualSim | null>(null);
  const updateSettings: Dispatch<SetStateAction<SharedSettings>> = (update) => {
    const next =
      typeof update === 'function' ? update(settingsRef.current) : update;
    settingsRef.current = next;
    setSettings(next);
    // Do not save partially edited invalid ranges or touch the theme key.
    if (validStoredSettings(next)) {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {
        setNotice(
          'Browser storage is unavailable. Settings will last for this session.',
        );
      }
    }
  };
  const catalog = useMemo(
    () => ({
      ...libraryCatalog,
      worlds: libraryCatalog.worlds.map((world) => ({
        ...world,
        lots: [
          ...world.lots,
          ...customLots.filter((lot) => lot.worldId === world.id),
        ],
      })),
    }),
    [customLots],
  );
  return (
    <StudioContext.Provider
      value={{
        session,
        setSession,
        settings,
        setSettings: updateSettings,
        catalog,
        customLots,
        addLot: (lot) => setCustomLots((lots) => [...lots, lot]),
        concept,
        setConcept,
        individual,
        setIndividual,
        notice,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}
