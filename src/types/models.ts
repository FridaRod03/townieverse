export const LIFE_STAGES = [
  'newborn',
  'infant',
  'toddler',
  'child',
  'teen',
  'young-adult',
  'adult',
  'elder',
] as const;
export type LifeStage = (typeof LIFE_STAGES)[number];
export type AdultAge = 'young-adult' | 'adult' | 'elder';
export type RandomizationMode =
  'random' | 'world-inspired' | 'balanced' | 'realistic' | 'chaos';
export type ContentTheme = 'adult-romance' | 'crime' | 'substance-use';
export type ContentOrigin = 'official' | 'custom' | 'roleplay';
export type VerificationStatus = 'verified' | 'unverified' | 'not-applicable';
export type HouseholdCategory =
  | 'singles'
  | 'couples'
  | 'families'
  | 'single-parents'
  | 'blended-families'
  | 'roommates'
  | 'multigenerational'
  | 'elders'
  | 'occult'
  | 'adult-only';

export interface Verification {
  status: VerificationStatus;
  sources: string[];
  notes?: string;
}

export interface ContentEntry {
  id: string;
  name: string;
  description: string;
  origin: ContentOrigin;
  requiredPacks: string[];
  verification: Verification;
  categories: string[];
  tags: string[];
  weight: number;
  /** 0 = unusual; 1 = everyday. Separate from rarity weight. */
  commonness: number;
  allowedAges?: LifeStage[];
  adultOnly: boolean;
  themes: ContentTheme[];
}

export interface GamePack {
  id: string;
  name: string;
  type: 'base-game' | 'expansion' | 'game' | 'stuff' | 'kit';
  verification: Verification;
}

export interface Trait extends ContentEntry {
  conflictsWith: string[];
}
export interface Aspiration extends ContentEntry {
  traitRequirements: string[];
}
export interface Career extends ContentEntry {
  kind: 'career' | 'part-time' | 'occupation' | 'roleplay';
}
export interface Aesthetic extends ContentEntry {
  /** Optional for pre-Phase-7 snapshots; active library entries supply both. */
  styleType?:
    'established' | 'internet' | 'historical' | 'practical' | 'original';
  rarity?: 'common' | 'uncommon' | 'rare';
  aliases?: string[];
  hairSuggestions?: string[];
  makeupSuggestions?: string[];
  accessories?: string[];
  culturalContext?: string;
  category: string;
  worldAssociations: string[];
  suggestedAges: LifeStage[];
  casSuggestions: string[];
  wildcard: boolean;
}
export interface Lot extends ContentEntry {
  worldId: string;
  neighborhoodId: string;
  size?: { width: number; height: number };
  lotType: string;
}
export interface Neighborhood extends ContentEntry {
  worldId: string;
}
export interface World extends ContentEntry {
  worldType: 'residential' | 'destination' | 'special';
  neighborhoods: Neighborhood[];
  lots: Lot[];
}

export type OccultType =
  | 'human'
  | 'alien'
  | 'vampire'
  | 'mermaid'
  | 'spellcaster'
  | 'werewolf'
  | 'ghost'
  | 'custom';
export interface HouseholdMember {
  id: string;
  name: string;
  age: LifeStage;
  occult: OccultType;
  requiredPacks: string[];
  slotId: string;
}
export type DynamicKind =
  | 'biological-parent'
  | 'adoptive-parent'
  | 'step-parent'
  | 'siblings'
  | 'partners'
  | 'roommates'
  | 'chosen-family'
  | 'friends'
  | 'rivals';
export interface HouseholdDynamic {
  id: string;
  fromId: string;
  toId: string;
  kind: DynamicKind;
}
export interface AgeRequirement {
  ages: LifeStage[];
  minimum: number;
  maximum: number;
}
export interface MemberSlot {
  id: string;
  name: string;
  allowedAges: LifeStage[];
  occult: OccultType;
  requiredPacks: string[];
}
export interface DynamicTemplate {
  id: string;
  fromSlotId: string;
  toSlotId: string;
  kind: DynamicKind;
}
export interface Storyline extends ContentEntry {
  participantIds: string[];
}
export interface HouseholdPrompt extends ContentEntry {
  category: HouseholdCategory;
  minimumMembers: number;
  maximumMembers: number;
  ageRequirements: AgeRequirement[];
  memberSlots: MemberSlot[];
  dynamics: DynamicTemplate[];
  financialSituation: string;
  livingArrangement: string;
  backstory: string;
}
export interface Household {
  id: string;
  promptId: string;
  category: HouseholdCategory;
  members: HouseholdMember[];
  dynamics: HouseholdDynamic[];
  financialSituation: string;
  livingArrangement: string;
  backstory: string;
  adultOnly: boolean;
  storylines: Storyline[];
}
export interface Personality {
  profile: PersonalityProfile;
  traits: Trait[];
  hobbies: string[];
  likes: string[];
  dislikes: string[];
  personalGoal: string;
  flaw: string;
}
export interface PersonalityProfile extends ContentEntry {
  personalitySuggestions?: string[];
  careerSuggestions?: string[];
  hobbies: string[];
  likes: string[];
  dislikes: string[];
  personalGoal: string;
  flaw: string;
}
export interface IndividualSim {
  id: string;
  name: string;
  age: LifeStage;
  personality: Personality;
  aspiration: Aspiration;
  career: Career;
  storylines: Storyline[];
}
export interface Relationship extends ContentEntry {
  kind:
    | 'family'
    | 'romantic'
    | 'friendship'
    | 'rivalry'
    | 'coworkers'
    | 'neighbors'
    | 'ex-partners'
    | 'estranged-relatives'
    | 'chosen-family'
    | 'business-partners';
  tone: 'positive' | 'neutral' | 'negative';
  familyTie?: DynamicKind;
}
export interface GeneratedRelationship {
  id: string;
  prompt: Relationship;
  fromId: string;
  toId: string;
}
export interface GeneratorPreferences {
  mode: RandomizationMode;
  ownedPacks: string[];
  allowedAges: LifeStage[];
  maximumHouseholdSize: number;
  allowAdultRomance: boolean;
  allowCrime: boolean;
  allowSubstanceUse: boolean;
  allowCustomContent: boolean;
  allowRoleplayContent: boolean;
  aestheticCategories: string[];
  aestheticSearch: string;
}
export interface AestheticBlend {
  first: Aesthetic;
  second: Aesthetic;
  casSuggestions: string[];
  tags: string[];
}
export interface GeneratedResult {
  id: string;
  seed: string;
  world?: World;
  neighborhood?: Neighborhood;
  lot?: Lot;
  household?: Household;
  aesthetic?: Aesthetic;
  blend?: AestheticBlend;
  sim?: IndividualSim;
  relationship?: GeneratedRelationship;
}
export interface ContentCatalog {
  packs: GamePack[];
  worlds: World[];
  households: HouseholdPrompt[];
  aesthetics: Aesthetic[];
  traits: Trait[];
  aspirations: Aspiration[];
  careers: Career[];
  relationships: Relationship[];
}
