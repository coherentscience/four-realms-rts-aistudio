import { BUILDINGS } from '../config/buildings';
import { UNITS } from '../config/units';
import {
  Building,
  BuildingCategory,
  BuildingDef,
  Corpse,
  FloatingText,
  GameMap,
  GoldMine,
  Particle,
  PlayerData,
  Unit,
  Vector2D,
} from '../types';
import { castAbility } from './abilities';
import { getDistance } from './combat';
import { queueTierUpgrade, queueUnitProduction, queueUpgradeResearch } from './economy';
import { isInsideEnemyBase } from './map';

export class AIController {
  private updateTimer: number = 0;
  private attackState: 'gathering_army' | 'attacking' | 'defending' = 'gathering_army';
  private targetAttackPos: Vector2D | null = null;
  private buildSlots: Vector2D[] = [];

  constructor(map: GameMap) {
    this.calculateBuildSlots(map);
  }

  private calculateBuildSlots(map: GameMap) {
    // Generate valid building placements in the enemy base (North-East)
    const cx = map.enemyStart.x;
    const cy = map.enemyStart.y;
    const offsets = [
      { x: -130, y: -40 },
      { x: -140, y: 110 },
      { x: 30, y: 130 },
      { x: 120, y: -70 },
      { x: -50, y: -140 },
      { x: -160, y: -110 },
      { x: 80, y: 110 },
    ];
    this.buildSlots = offsets.map((o) => ({ x: cx + o.x, y: cy + o.y }));
  }

  public update(
    dt: number,
    units: Unit[],
    buildings: Building[],
    goldMines: GoldMine[],
    corpses: Corpse[],
    particles: Particle[],
    floatingTexts: FloatingText[],
    aiPlayer: PlayerData,
    humanPlayer: PlayerData,
    map: GameMap
  ) {
    this.updateTimer += dt;
    if (this.updateTimer < 1.0) return; // run decision logic every 1s
    this.updateTimer = 0;

    const myUnits = units.filter((u) => !u.isPlayer && u.hp > 0);
    const myBuildings = buildings.filter((b) => !b.isPlayer && b.hp > 0);
    const humanUnits = units.filter((u) => u.isPlayer && u.hp > 0);
    const humanBuildings = buildings.filter((b) => b.isPlayer && b.hp > 0);

    const mainHall = myBuildings.find((b) => b.category === 'main_hall');
    if (!mainHall) return; // AI lost base

    // 1. Manage Gatherers
    const gatherers = myUnits.filter((u) => u.role === 'gatherer');
    const myStartMine = goldMines.find((m) => m.id === 'mine_enemy_start') || goldMines[1];

    // Assign idle gatherers to mine
    for (const g of gatherers) {
      if (g.state === 'idle' && myStartMine) {
        g.state = 'gathering';
        g.targetMineId = myStartMine.id;
        g.targetBuildingId = mainHall.id;
      }
    }

    // Train gatherers up to 5
    if (gatherers.length < 5 && mainHall.queue.length === 0) {
      const gathererDef = Object.values(UNITS).find(
        (u) => u.faction === aiPlayer.faction && u.role === 'gatherer'
      );
      if (gathererDef && aiPlayer.gold >= gathererDef.goldCost) {
        queueUnitProduction(mainHall, gathererDef.id, aiPlayer);
      }
    }

    // 2. Base Construction Pipeline
    this.manageConstruction(myUnits, myBuildings, buildings, aiPlayer, map);

    // 3. Army Production
    this.manageArmyProduction(myUnits, myBuildings, aiPlayer);

    // 4. Hero Abilities Autonomous Casting in Combat
    const myHero = myUnits.find((u) => u.role === 'hero');
    if (myHero && myHero.abilities) {
      for (const ab of myHero.abilities) {
        if (ab.currentCooldown <= 0) {
          // Cast if near enemies
          const nearbyEnemy = humanUnits.find((u) => getDistance(myHero.x, myHero.y, u.x, u.y) <= 180);
          if (nearbyEnemy) {
            castAbility(
              myHero,
              ab.defId,
              { x: nearbyEnemy.x, y: nearbyEnemy.y },
              nearbyEnemy.id,
              units,
              buildings,
              corpses,
              particles,
              floatingTexts,
              humanPlayer,
              aiPlayer
            );
          }
        }
      }
    }

    // 5. Military Stance: Defense & Attack Coordination
    const militaryUnits = myUnits.filter((u) => u.role !== 'gatherer');

    // Check if enemy is in AI base
    const baseInvaders = humanUnits.filter((u) => isInsideEnemyBase({ x: u.x, y: u.y }, map));
    if (baseInvaders.length > 0) {
      this.attackState = 'defending';
      const primeTarget = baseInvaders[0];
      for (const m of militaryUnits) {
        if (m.state !== 'attacking') {
          m.targetEntityId = primeTarget.id;
          m.targetEntityType = 'unit';
          m.targetX = primeTarget.x;
          m.targetY = primeTarget.y;
        }
      }
      return;
    }

    // If not defending, check army size for attack
    if (militaryUnits.length >= 8 || aiPlayer.population >= 26) {
      this.attackState = 'attacking';
      // Target player Main Hall or closest player building/unit
      const playerHall = humanBuildings.find((b) => b.category === 'main_hall');
      const attackGoal = playerHall
        ? { x: playerHall.x + playerHall.width / 2, y: playerHall.y + playerHall.height / 2 }
        : map.playerStart;

      for (const m of militaryUnits) {
        if (m.state === 'idle' || getDistance(m.x, m.y, attackGoal.x, attackGoal.y) > 200) {
          m.targetX = attackGoal.x + (Math.random() - 0.5) * 80;
          m.targetY = attackGoal.y + (Math.random() - 0.5) * 80;
          m.state = 'moving';
          m.behaviorMode = 'aggressive';
        }
      }
    } else {
      this.attackState = 'gathering_army';
      // Rally military units near the Great Hall
      for (const m of militaryUnits) {
        if (m.state === 'idle') {
          const rallyX = mainHall.x - 60 + (Math.random() - 0.5) * 60;
          const rallyY = mainHall.y + 60 + (Math.random() - 0.5) * 60;
          if (getDistance(m.x, m.y, rallyX, rallyY) > 100) {
            m.targetX = rallyX;
            m.targetY = rallyY;
            m.state = 'moving';
          }
        }
      }
    }
  }

  private manageConstruction(
    myUnits: Unit[],
    myBuildings: Building[],
    allBuildings: Building[],
    aiPlayer: PlayerData,
    map: GameMap
  ) {
    const hasBarracks = myBuildings.some((b) => b.category === 'barracks');
    const hasRanged = myBuildings.some((b) => b.category === 'ranged');
    const hasTower = myBuildings.some((b) => b.category === 'tower');
    const hasMagic = myBuildings.some((b) => b.category === 'magic');
    const hasHero = myBuildings.some((b) => b.category === 'hero');

    const mainHall = myBuildings.find((b) => b.category === 'main_hall');
    if (!mainHall) return;

    // 1. Check if worker needs to finish an unconstructed building
    const unfinished = myBuildings.find((b) => !b.isConstructed || b.constructionState !== 'COMPLETED');
    if (unfinished) {
      const worker = myUnits.find((u) => u.role === 'gatherer' && u.state !== 'building');
      if (worker) {
        worker.state = 'building';
        worker.targetBuildingId = unfinished.id;
      }
      return;
    }

    // 2. AI Building Repair: repair damaged friendly buildings
    const damaged = myBuildings
      .filter((b) => b.isConstructed && b.hp < b.maxHp)
      .sort((a, b) => {
        // Priority: main_hall (0) > tower (1) > production (2)
        const getPrio = (cat: string) => (cat === 'main_hall' ? 0 : cat === 'tower' ? 1 : 2);
        return getPrio(a.category) - getPrio(b.category);
      });

    if (damaged.length > 0) {
      const targetDamaged = damaged[0];
      // Only repair if no idle workers already repairing this building
      const alreadyRepairing = myUnits.some(
        (u) => u.role === 'gatherer' && u.state === 'repairing' && u.targetBuildingId === targetDamaged.id
      );
      if (!alreadyRepairing) {
        const availableWorker = myUnits.find(
          (u) => u.role === 'gatherer' && (u.state === 'idle' || u.state === 'gathering')
        );
        if (availableWorker) {
          availableWorker.state = 'repairing';
          availableWorker.targetBuildingId = targetDamaged.id;
        }
      }
    }

    // Determine what to build next
    let nextCategory: BuildingCategory | null = null;
    if (!hasBarracks) nextCategory = 'barracks';
    else if (!hasRanged) nextCategory = 'ranged';
    else if (!hasTower) nextCategory = 'tower';
    else if (aiPlayer.techTier < 2 && mainHall.queue.length === 0 && aiPlayer.gold >= 250) {
      queueTierUpgrade(mainHall, 'tier_2', aiPlayer);
      return;
    } else if (aiPlayer.techTier >= 2 && !hasMagic) nextCategory = 'magic';
    else if (aiPlayer.techTier >= 2 && !hasHero) nextCategory = 'hero';
    else if (aiPlayer.techTier < 3 && mainHall.queue.length === 0 && aiPlayer.gold >= 350) {
      queueTierUpgrade(mainHall, 'tier_3', aiPlayer);
      return;
    }

    if (!nextCategory) return;

    // Find definition for AI faction
    const buildingDef = Object.values(BUILDINGS).find(
      (b) => b.faction === aiPlayer.faction && b.category === nextCategory
    );
    if (!buildingDef || aiPlayer.gold < buildingDef.goldCost) return;

    // Find available build slot
    const slot = this.buildSlots.find((s) => {
      // Check if slot overlaps with existing buildings
      return !allBuildings.some(
        (b) => b.hp > 0 && getDistance(s.x, s.y, b.x + b.width / 2, b.y + b.height / 2) < 90
      );
    });

    if (!slot) return;

    // Deduct gold & spawn foundation
    aiPlayer.gold -= buildingDef.goldCost;
    const newBuilding: Building = {
      id: `b_${buildingDef.id}_${Math.random()}`,
      defId: buildingDef.id,
      name: buildingDef.name,
      category: buildingDef.category,
      faction: buildingDef.faction,
      isPlayer: false,
      x: slot.x - buildingDef.width / 2,
      y: slot.y - buildingDef.height / 2,
      width: buildingDef.width,
      height: buildingDef.height,
      hp: 10,
      maxHp: buildingDef.hp,
      constructionState: 'UNDER_CONSTRUCTION',
      constructionProgress: 0.05,
      constructionTime: buildingDef.buildTime,
      isConstructed: false,
      buildProgress: 0.05,
      buildTime: buildingDef.buildTime,
      queue: [],
      canAttack: buildingDef.canAttack,
      attackDamage: buildingDef.attackDamage,
      attackRange: buildingDef.attackRange,
      attackSpeed: buildingDef.attackSpeed,
      attackCooldown: 0,
      hitFlash: 0,
    };

    allBuildings.push(newBuilding);

    // Send a gatherer to construct it
    const gatherer = myUnits.find((u) => u.role === 'gatherer');
    if (gatherer) {
      gatherer.state = 'building';
      gatherer.targetBuildingId = newBuilding.id;
    }
  }

  private manageArmyProduction(myUnits: Unit[], myBuildings: Building[], aiPlayer: PlayerData) {
    if (aiPlayer.population >= aiPlayer.maxPopulation) return;

    // 1. Barracks: train basic melee or tank
    const barracks = myBuildings.find((b) => b.category === 'barracks' && b.isConstructed && b.queue.length === 0);
    if (barracks) {
      const units = barracks.defId ? BUILDINGS[barracks.defId]?.producesUnits || [] : [];
      // Prefer Tank if T2 and affordable
      const tankId = units.find((id) => UNITS[id]?.role === 'tank' && UNITS[id]?.tier <= aiPlayer.techTier);
      const meleeId = units.find((id) => UNITS[id]?.role === 'melee');
      const targetId = tankId && Math.random() < 0.4 ? tankId : meleeId;
      if (targetId && aiPlayer.gold >= UNITS[targetId].goldCost) {
        queueUnitProduction(barracks, targetId, aiPlayer);
      }
    }

    // 2. Ranged: train ranged or siege
    const rangedBuilding = myBuildings.find((b) => b.category === 'ranged' && b.isConstructed && b.queue.length === 0);
    if (rangedBuilding) {
      const units = rangedBuilding.defId ? BUILDINGS[rangedBuilding.defId]?.producesUnits || [] : [];
      const siegeId = units.find((id) => UNITS[id]?.role === 'siege' && UNITS[id]?.tier <= aiPlayer.techTier);
      const rangedId = units.find((id) => UNITS[id]?.role === 'ranged');
      const targetId = siegeId && Math.random() < 0.35 ? siegeId : rangedId;
      if (targetId && aiPlayer.gold >= UNITS[targetId].goldCost) {
        queueUnitProduction(rangedBuilding, targetId, aiPlayer);
      }
    }

    // 3. Hero / Elite building: prioritize summoning hero!
    const heroBuilding = myBuildings.find((b) => b.category === 'hero' && b.isConstructed && b.queue.length === 0);
    if (heroBuilding) {
      const hasHero = myUnits.some((u) => u.role === 'hero');
      const units = heroBuilding.defId ? BUILDINGS[heroBuilding.defId]?.producesUnits || [] : [];
      const heroId = units.find((id) => UNITS[id]?.role === 'hero');
      const eliteId = units.find((id) => UNITS[id]?.role === 'elite' && UNITS[id]?.tier <= aiPlayer.techTier);

      if (!hasHero && heroId && aiPlayer.gold >= UNITS[heroId].goldCost) {
        queueUnitProduction(heroBuilding, heroId, aiPlayer);
      } else if (eliteId && aiPlayer.gold >= UNITS[eliteId].goldCost) {
        queueUnitProduction(heroBuilding, eliteId, aiPlayer);
      }
    }

    // 4. Magic building: train casters / special
    const magicBuilding = myBuildings.find((b) => b.category === 'magic' && b.isConstructed && b.queue.length === 0);
    if (magicBuilding) {
      const units = magicBuilding.defId ? BUILDINGS[magicBuilding.defId]?.producesUnits || [] : [];
      const targetId = units[Math.floor(Math.random() * units.length)];
      if (targetId && UNITS[targetId] && aiPlayer.gold >= UNITS[targetId].goldCost) {
        queueUnitProduction(magicBuilding, targetId, aiPlayer);
      }
    }

    // 5. Upgrades in Barracks if plenty of gold
    if (barracks && barracks.queue.length === 0 && aiPlayer.gold >= 300) {
      if (aiPlayer.upgrades.weapons === 0) queueUpgradeResearch(barracks, 'weapons_1', aiPlayer);
      else if (aiPlayer.upgrades.armor === 0) queueUpgradeResearch(barracks, 'armor_1', aiPlayer);
    }
  }
}
