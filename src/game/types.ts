export type FactionId = 'kingdoms' | 'horde' | 'undead' | 'elves';

export type UnitRole =
  | 'gatherer'
  | 'melee'
  | 'tank'
  | 'ranged'
  | 'caster'
  | 'support'
  | 'special'
  | 'siege'
  | 'hero'
  | 'elite'
  | 'summon';

export type UnitState =
  | 'idle'
  | 'moving'
  | 'attacking'
  | 'gathering'
  | 'returning_resource'
  | 'building'
  | 'repairing'
  | 'hold'
  | 'dead';

export type ConstructionState = 'PLANNED' | 'UNDER_CONSTRUCTION' | 'COMPLETED' | 'DESTROYED';

export const AOE_FRIENDLY_FIRE_FACTOR = 0.4; // Controlled friendly fire: 40% damage to allies caught in AoE blast

export type BuildingCategory =
  | 'main_hall'
  | 'barracks'
  | 'ranged'
  | 'magic'
  | 'hero'
  | 'tower';

export type BehaviorMode = 'aggressive' | 'defensive' | 'hold';

export interface Vector2D {
  x: number;
  y: number;
}

export interface UnitBuff {
  id: string;
  name: string;
  duration: number; // remaining in seconds
  maxDuration: number;
  type: 'rally' | 'bloodlust' | 'nature_regen' | 'divine_shield' | 'entangle' | 'speed_boost' | 'armor_buff';
  attackMult?: number;
  armorBonus?: number;
  speedMult?: number;
  regenHpPerSec?: number;
  invulnerable?: boolean;
  root?: boolean;
}

export interface AbilityDef {
  id: string;
  name: string;
  description: string;
  cooldown: number; // in seconds
  range: number;
  radius?: number; // AoE
  targetType: 'instant' | 'target_enemy' | 'target_ally' | 'target_ground' | 'corpse';
  hotkey: string;
  unlockLevel: number;
  isUltimate?: boolean;
  manaCost?: number;
}

export interface AbilityState {
  defId: string;
  currentCooldown: number;
}

export interface UnitDef {
  id: string;
  name: string;
  faction: FactionId;
  role: UnitRole;
  tier: number;
  hp: number;
  attackDamage: number;
  armor: number;
  range: number; // in pixels (melee is ~25-35)
  attackSpeed: number; // seconds per attack
  moveSpeed: number; // pixels per second
  goldCost: number;
  popCost: number;
  buildTime: number; // in seconds
  description: string;
  radius: number;
  abilities?: AbilityDef[];
}

export interface BuildingDef {
  id: string;
  name: string;
  faction: FactionId;
  category: BuildingCategory;
  tier: number;
  hp: number;
  goldCost: number;
  buildTime: number;
  width: number; // pixels
  height: number;
  description: string;
  canAttack?: boolean;
  attackDamage?: number;
  attackRange?: number;
  attackSpeed?: number;
  producesUnits?: string[]; // unitDef ids
  researchesUpgrades?: string[]; // upgrade ids
}

export interface UpgradeDef {
  id: string;
  name: string;
  category: 'weapons' | 'armor' | 'training';
  level: number;
  tierRequired: number;
  goldCost: number;
  researchTime: number;
  description: string;
  bonus: number; // 0.1 for +10%
}

export interface ProductionItem {
  id: string;
  type: 'unit' | 'upgrade' | 'tier';
  defId: string;
  totalTime: number;
  progressTime: number; // 0 to totalTime
}

export interface Unit {
  id: string;
  defId: string;
  name: string;
  faction: FactionId;
  role: UnitRole;
  isPlayer: boolean;
  x: number;
  y: number;
  targetX?: number;
  targetY?: number;
  targetEntityId?: string;
  targetEntityType?: 'unit' | 'building' | 'gold_mine' | 'corpse';
  state: UnitState;
  behaviorMode: BehaviorMode;
  hp: number;
  maxHp: number;
  mana?: number;
  maxMana?: number;
  attackDamage: number;
  armor: number;
  range: number;
  attackSpeed: number;
  attackCooldown: number;
  moveSpeed: number;
  popCost: number;
  radius: number;
  
  // Hero specific
  level?: number;
  xp?: number;
  maxXp?: number;
  abilities?: AbilityState[];
  respawnTimer?: number;
  maxRespawnTimer?: number;
  
  // Gatherer specific
  goldCarried?: number;
  targetMineId?: string;
  targetBuildingId?: string;
  isGathering?: boolean;
  gatherTimer?: number;

  // Temporary summons (Undead)
  isSummon?: boolean;
  decayTimer?: number;

  // Combat status
  buffs: UnitBuff[];
  facingAngle: number;
  walkCycle: number;
  attackAnimTimer: number;
  isHitFlash: number;
}

export interface Building {
  id: string;
  defId: string;
  name: string;
  category: BuildingCategory;
  faction: FactionId;
  isPlayer: boolean;
  x: number; // top-left
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  constructionState: ConstructionState;
  constructionProgress: number; // 0 to 1
  constructionTime: number; // in seconds
  isConstructed: boolean;
  buildProgress: number; // 0 to 1 (synced with constructionProgress)
  buildTime: number;
  queue: ProductionItem[];
  rallyPoint?: Vector2D;

  // Defensive tower stats
  canAttack?: boolean;
  attackDamage?: number;
  attackRange?: number;
  attackSpeed?: number;
  attackCooldown: number;
  targetEntityId?: string;
  hitFlash: number;
}

export interface GoldMine {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxMiners: number;
  currentMiners: string[]; // unit IDs
}

export interface Corpse {
  id: string;
  x: number;
  y: number;
  duration: number; // vanishes after e.g. 45s
  faction: FactionId;
}

export interface Projectile {
  id: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  targetUnitId?: string;
  speed: number;
  damage: number;
  damageRadius?: number; // AoE impact
  type: 'arrow' | 'cannonball' | 'fireball' | 'holy' | 'bone' | 'nature' | 'shaman_bolt';
  sourceFaction: FactionId;
  isPlayer: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  shape?: 'circle' | 'spark' | 'smoke' | 'leaf' | 'blood' | 'skull';
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
}

export interface PlayerStats {
  goldCollected: number;
  unitsCreated: number;
  unitsLost: number;
  enemiesDefeated: number;
  buildingsDestroyed: number;
  heroMaxLevel: number;
}

export interface PlayerData {
  faction: FactionId;
  gold: number;
  population: number;
  maxPopulation: number;
  techTier: number; // 1, 2, 3
  upgrades: {
    weapons: number; // 0, 1, 2
    armor: number; // 0, 1, 2
    training: number; // 0, 1, 2
  };
  stats: PlayerStats;
}

export interface GameMap {
  width: number; // e.g. 2400
  height: number; // e.g. 2400
  tileSize: number; // e.g. 40
  cols: number;
  rows: number;
  playerStart: Vector2D;
  enemyStart: Vector2D;
  playerBaseRadius: number;
  enemyBaseRadius: number;
  obstacles: { x: number; y: number; width: number; height: number; type: 'rock' | 'water' | 'cliff' }[];
  forests: { x: number; y: number; radius: number }[];
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
}
