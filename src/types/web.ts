export const WEB_AGES = [
  'newborn',
  'infant',
  'toddler',
  'child',
  'teen',
  'young-adult',
  'adult',
  'elder',
] as const;
export type WebAge = (typeof WEB_AGES)[number] | '';
export interface CharacterNode {
  id: string;
  label: string;
  householdId: string;
  memberId: string;
  householdName: string;
  aesthetic: string;
  age: WebAge;
  worldId: string;
  color: string;
  icon: string;
  favorite: boolean;
  x: number;
  y: number;
}
export const CONNECTION_TYPES = {
  'parent-child': 'Parent / child',
  siblings: 'Siblings',
  'grandparent-grandchild': 'Grandparent / grandchild',
  cousins: 'Cousins',
  adoptive: 'Adoptive family',
  stepfamily: 'Stepfamily',
  'chosen-family': 'Chosen family',
  dating: 'Dating',
  married: 'Married',
  engaged: 'Engaged',
  ex: 'Ex-partners',
  crush: 'Crush',
  complicated: 'Complicated romance',
  sexual: 'Adult intimate relationship',
  best: 'Best friends',
  friends: 'Friends',
  acquaintances: 'Acquaintances',
  'former-friends': 'Former friends',
  rivals: 'Rivals',
  enemies: 'Enemies',
  feud: 'Feuding families',
  'workplace-rivals': 'Workplace rivals',
  coworkers: 'Coworkers',
  neighbors: 'Neighbors',
  business: 'Business partners',
  mentors: 'Mentors',
  roommates: 'Roommates',
  custom: 'Custom relationship',
} as const;
export type ConnectionType = keyof typeof CONNECTION_TYPES;
export type ConnectionGroup =
  'Family' | 'Romance' | 'Friendship' | 'Conflict' | 'Other';
export interface Connection {
  id: string;
  from: string;
  to: string;
  type: ConnectionType;
  label: string;
  description: string;
  notes: string;
  status: 'active' | 'ended' | 'planned';
  strength: number | null;
  startDate: string;
  tags: string[];
  /** Explicit classification ensures custom labels cannot bypass age/family rules. */
  customGroup: ConnectionGroup;
  adultConsent: boolean;
}
export interface WebFilters {
  search: string;
  householdId: string;
  worldId: string;
  type: string;
  status: string;
  simId: string;
  favorites: boolean;
  focusId: string;
}
export interface RelationshipWeb {
  /** Source family constraints, retained even when source households are unassigned. */
  knownFamily?: { from: string; to: string }[];
  schemaVersion: 1;
  nodes: CharacterNode[];
  edges: Connection[];
  filters: WebFilters;
  view: {
    zoom: number;
    panX: number;
    panY: number;
    simplified: boolean;
    listOnly: boolean;
  };
}
