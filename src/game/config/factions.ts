import { FactionId } from '../types';

export interface FactionConfig {
  id: FactionId;
  name: string;
  subtitle: string;
  tagline: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    border: string;
    bg: string;
  };
  strengths: string[];
  weaknesses: string[];
  mechanic: {
    name: string;
    description: string;
  };
  heroName: string;
  heroTitle: string;
  gatheringUnit: string;
}

export const FACTIONS: Record<FactionId, FactionConfig> = {
  kingdoms: {
    id: 'kingdoms',
    name: 'Kingdoms',
    subtitle: 'Realm of Steel & Devotion',
    tagline: 'Discipline, Iron Defense, and Holy Radiance',
    colors: {
      primary: '#3b82f6',
      secondary: '#eab308',
      accent: '#60a5fa',
      border: 'rgba(59, 130, 246, 0.4)',
      bg: 'rgba(15, 23, 42, 0.95)',
    },
    strengths: [
      'Heaviest armor ratings and resilient battle formations',
      'Direct divine healing and protective aura bonuses',
      'Stout defensive fortifications and powerful artillery',
    ],
    weaknesses: [
      'Higher unit gold costs and longer training times',
      'Average unit movement speeds',
      'Lower single-target burst mobility',
    ],
    mechanic: {
      name: 'Rally',
      description: 'The Paladin and nearby Kingdom structures inspire nearby soldiers, granting +15% attack damage and +2 armor.',
    },
    heroName: 'Paladin',
    heroTitle: 'Lord of Justice',
    gatheringUnit: 'Peasant',
  },

  horde: {
    id: 'horde',
    name: 'Horde',
    subtitle: 'Nomads of Blood & Fury',
    tagline: 'Unrelenting Aggression, Brute Might, and Mobility',
    colors: {
      primary: '#ef4444',
      secondary: '#f97316',
      accent: '#fca5a5',
      border: 'rgba(239, 68, 68, 0.4)',
      bg: 'rgba(28, 10, 10, 0.95)',
    },
    strengths: [
      'Inexpensive early melee infantry with rapid production',
      'Savage melee attack damage and swift cavalry raiders',
      'Sustained combat momentum through combat kill buffs',
    ],
    weaknesses: [
      'Lighter armor across most basic infantry',
      'Weaker defensive structures compared to Kingdoms',
      'Struggles in prolonged passive sieges',
    ],
    mechanic: {
      name: 'Bloodlust',
      description: 'Defeating enemy units sends Horde warriors into a frenzy, granting +25% attack speed and +15% move speed for 6 seconds.',
    },
    heroName: 'Blademaster',
    heroTitle: 'Clan Warbringer',
    gatheringUnit: 'Peon',
  },

  undead: {
    id: 'undead',
    name: 'Undead',
    subtitle: 'The Scourge of Rot & Shadows',
    tagline: 'Endless Attrition, Corpse Reanimation, and Decay',
    colors: {
      primary: '#a855f7',
      secondary: '#10b981',
      accent: '#c084fc',
      border: 'rgba(168, 85, 247, 0.4)',
      bg: 'rgba(19, 10, 28, 0.95)',
    },
    strengths: [
      'Fallen units generate corpses that can be reanimated into temporary skeletons',
      'Devastating attrition and life-leech spells',
      'Relentless army reinforcement during open-field battles',
    ],
    weaknesses: [
      'Basic ghouls are individually frail against heavy ranged volleys',
      'Slower baseline march speed',
      'No instant passive healing away from the Death Knight',
    ],
    mechanic: {
      name: 'Corpses & Reanimation',
      description: 'Every slain soldier leaves a corpse on the field. Necromancers and the Death Knight can raise temporary Skeleton Warriors from nearby remains.',
    },
    heroName: 'Death Knight',
    heroTitle: 'Harbinger of Ruin',
    gatheringUnit: 'Acolyte',
  },

  elves: {
    id: 'elves',
    name: 'Elves',
    subtitle: 'Sentinels of the Ancient Canopy',
    tagline: 'Lethal Ranged Marksmanship, Arcane Sorcery, and Nature',
    colors: {
      primary: '#10b981',
      secondary: '#fbbf24',
      accent: '#34d399',
      border: 'rgba(16, 185, 129, 0.4)',
      bg: 'rgba(6, 24, 18, 0.95)',
    },
    strengths: [
      'Supreme ranged attack distance and pinpoint accuracy',
      'Superior tactical movement speed and evasiveness',
      'Potent crowd control magic and natural battlefield regeneration',
    ],
    weaknesses: [
      'Lowest raw health and physical armor pool',
      'Vulnerable if surrounded or ambushed in open plains',
      'Elite units require significant gold investment',
    ],
    mechanic: {
      name: 'Forest Blessing',
      description: 'Elven warriors fighting within or near forest groves regenerate 8 HP per second and gain +10% movement speed.',
    },
    heroName: 'Archdruid',
    heroTitle: 'Keeper of the Grove',
    gatheringUnit: 'Wisp',
  },
};
