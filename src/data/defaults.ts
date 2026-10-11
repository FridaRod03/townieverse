import type { GeneratorPreferences } from '../types/models';
import { LIFE_STAGES } from '../types/models';

export function defaultPreferences(): GeneratorPreferences {
  return {
    mode: 'random',
    ownedPacks: [],
    allowedAges: [...LIFE_STAGES],
    maximumHouseholdSize: 8,
    allowAdultRomance: false,
    allowCrime: false,
    allowSubstanceUse: false,
    allowCustomContent: false,
    allowRoleplayContent: true,
    aestheticCategories: [],
    aestheticSearch: '',
  };
}
