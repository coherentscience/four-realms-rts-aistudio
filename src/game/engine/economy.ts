import { BUILDINGS, TIER_UPGRADES } from '../config/buildings';
import { UNITS } from '../config/units';
import { UPGRADES } from '../config/upgrades';
import {
  Building,
  GoldMine,
  Particle,
  PlayerData,
  ProductionItem,
  Unit,
  Vector2D,
} from '../types';
import { soundSystem } from './audio';
import { calculateMoveSpeed, getDistance } from './combat';

export function updateEconomyAndProduction(
  units: Unit[],
  buildings: Building[],
  goldMines: GoldMine[],
  player: PlayerData,
  enemy: PlayerData,
  dt: number,
  particles?: Particle[]
) {
  // Track active builders and repairers per building
  const activeBuilders: Record<string, Unit[]> = {};
  const activeRepairers: Record<string, Unit[]> = {};

  // 1. Process Worker Gathering and Construction
  for (const u of units) {
    if (u.hp <= 0 || u.role !== 'gatherer') continue;

    // GATHERING GOLD
    if (u.state === 'gathering') {
      const mine = goldMines.find((m) => m.id === u.targetMineId);
      if (!mine) {
        u.state = 'idle';
        continue;
      }

      const dist = getDistance(u.x, u.y, mine.x, mine.y);
      const mineInteractDist = mine.radius + u.radius + 8;

      if (dist > mineInteractDist) {
        // Move towards mine
        const spd = calculateMoveSpeed(u) * dt;
        const dx = mine.x - u.x;
        const dy = mine.y - u.y;
        u.facingAngle = Math.atan2(dy, dx);
        u.x += (dx / dist) * Math.min(dist, spd);
        u.y += (dy / dist) * Math.min(dist, spd);
        u.walkCycle = (u.walkCycle + dt * 8) % (Math.PI * 2);
      } else {
        // At mine: harvesting
        u.gatherTimer = (u.gatherTimer || 0) + dt;
        if (u.gatherTimer >= 2.4) {
          // Finished harvest
          u.goldCarried = 10;
          u.gatherTimer = 0;
          u.state = 'returning_resource';

          // Target nearest constructed friendly Main Hall
          const ownerHalls = buildings.filter(
            (b) => b.hp > 0 && b.isPlayer === u.isPlayer && b.category === 'main_hall' && b.isConstructed
          );
          if (ownerHalls.length > 0) {
            // Sort by proximity
            ownerHalls.sort((a, b) => {
              const d1 = getDistance(u.x, u.y, a.x + a.width / 2, a.y + a.height / 2);
              const d2 = getDistance(u.x, u.y, b.x + b.width / 2, b.y + b.height / 2);
              return d1 - d2;
            });
            u.targetBuildingId = ownerHalls[0].id;
          }
        }
      }
    }

    // RETURNING GOLD TO MAIN HALL
    else if (u.state === 'returning_resource') {
      const hall = buildings.find((b) => b.id === u.targetBuildingId && b.hp > 0 && b.isConstructed);
      if (!hall) {
        // Re-find main hall
        const altHall = buildings.find(
          (b) => b.hp > 0 && b.isPlayer === u.isPlayer && b.category === 'main_hall' && b.isConstructed
        );
        if (altHall) u.targetBuildingId = altHall.id;
        else u.state = 'idle';
        continue;
      }

      const hallCenterX = hall.x + hall.width / 2;
      const hallCenterY = hall.y + hall.height / 2;
      const dist = getDistance(u.x, u.y, hallCenterX, hallCenterY);
      const depositDist = hall.width / 2 + u.radius + 6;

      if (dist > depositDist) {
        // Move towards main hall
        const spd = calculateMoveSpeed(u) * dt;
        const dx = hallCenterX - u.x;
        const dy = hallCenterY - u.y;
        u.facingAngle = Math.atan2(dy, dx);
        u.x += (dx / dist) * Math.min(dist, spd);
        u.y += (dy / dist) * Math.min(dist, spd);
        u.walkCycle = (u.walkCycle + dt * 8) % (Math.PI * 2);
      } else {
        // Deposit gold!
        const owner = u.isPlayer ? player : enemy;
        owner.gold += u.goldCarried || 10;
        owner.stats.goldCollected += u.goldCarried || 10;
        if (u.isPlayer) soundSystem.playGoldDeposit();

        u.goldCarried = 0;

        // Return immediately to mine if set
        if (u.targetMineId) {
          u.state = 'gathering';
          u.gatherTimer = 0;
        } else {
          u.state = 'idle';
        }
      }
    }

    // CONSTRUCTING OR REPAIRING BUILDING
    else if (u.state === 'building' || u.state === 'repairing') {
      const targetBuilding = buildings.find(
        (b) => b.id === u.targetBuildingId && b.hp > 0 && b.constructionState !== 'DESTROYED'
      );
      if (!targetBuilding) {
        u.state = 'idle';
        u.targetBuildingId = undefined;
        continue;
      }

      const bCenterX = targetBuilding.x + targetBuilding.width / 2;
      const bCenterY = targetBuilding.y + targetBuilding.height / 2;
      const dist = getDistance(u.x, u.y, bCenterX, bCenterY);
      const interactDist = Math.max(targetBuilding.width, targetBuilding.height) / 2 + u.radius + 12;

      if (dist > interactDist) {
        // Move towards building
        const spd = calculateMoveSpeed(u) * dt;
        const dx = bCenterX - u.x;
        const dy = bCenterY - u.y;
        u.facingAngle = Math.atan2(dy, dx);
        u.x += (dx / dist) * Math.min(dist, spd);
        u.y += (dy / dist) * Math.min(dist, spd);
        u.walkCycle = (u.walkCycle + dt * 8) % (Math.PI * 2);
      } else {
        // At building! Face the building structure
        u.facingAngle = Math.atan2(bCenterY - u.y, bCenterX - u.x);

        // Check if building needs construction or repair
        if (targetBuilding.constructionState !== 'COMPLETED' || !targetBuilding.isConstructed) {
          u.state = 'building';
          if (!activeBuilders[targetBuilding.id]) activeBuilders[targetBuilding.id] = [];
          activeBuilders[targetBuilding.id].push(u);
        } else if (targetBuilding.hp < targetBuilding.maxHp) {
          u.state = 'repairing';
          if (!activeRepairers[targetBuilding.id]) activeRepairers[targetBuilding.id] = [];
          activeRepairers[targetBuilding.id].push(u);
        } else {
          // Building is fully constructed and healed
          u.state = 'idle';
          u.targetBuildingId = undefined;
        }
      }
    }
  }

  // Process Construction with Diminishing Returns (1 = 100%, 2 = 175%, 3 = 225%)
  for (const bId in activeBuilders) {
    const targetBuilding = buildings.find((b) => b.id === bId && b.hp > 0);
    if (!targetBuilding) continue;

    const builders = activeBuilders[bId];
    const workerCount = Math.min(3, builders.length);
    const speedMultiplier = workerCount === 1 ? 1.0 : workerCount === 2 ? 1.75 : 2.25;
    const duration = targetBuilding.constructionTime || targetBuilding.buildTime || 18;

    // Advance progress
    targetBuilding.constructionProgress = Math.min(
      1,
      (targetBuilding.constructionProgress ?? targetBuilding.buildProgress ?? 0) +
        (speedMultiplier * dt) / duration
    );
    targetBuilding.buildProgress = targetBuilding.constructionProgress;
    targetBuilding.hp = Math.max(10, Math.round(targetBuilding.maxHp * targetBuilding.constructionProgress));

    // Construction particles
    if (particles && Math.random() < 0.25) {
      particles.push({
        id: `p_build_${Math.random()}`,
        x: targetBuilding.x + Math.random() * targetBuilding.width,
        y: targetBuilding.y + Math.random() * targetBuilding.height,
        vx: (Math.random() - 0.5) * 20,
        vy: -25,
        life: 0.35,
        maxLife: 0.35,
        color: '#f59e0b',
        size: 3,
      });
    }

    if (targetBuilding.constructionProgress >= 1) {
      targetBuilding.constructionProgress = 1;
      targetBuilding.buildProgress = 1;
      targetBuilding.constructionState = 'COMPLETED';
      targetBuilding.isConstructed = true;
      targetBuilding.hp = targetBuilding.maxHp;

      if (targetBuilding.isPlayer) soundSystem.playBuildingConstructed();

      for (const w of builders) {
        w.state = 'idle';
        w.targetBuildingId = undefined;
      }
    }
  }

  // Process Repair with Diminishing Returns (1 = +8 HP/s, 2 = +14 HP/s, 3 = +18 HP/s)
  for (const bId in activeRepairers) {
    const targetBuilding = buildings.find((b) => b.id === bId && b.hp > 0);
    if (!targetBuilding) continue;

    const repairers = activeRepairers[bId];
    const workerCount = Math.min(3, repairers.length);
    const repairRate = workerCount === 1 ? 8 : workerCount === 2 ? 14 : 18; // HP per sec

    targetBuilding.hp = Math.min(targetBuilding.maxHp, targetBuilding.hp + repairRate * dt);

    // Repair sparks
    if (particles && Math.random() < 0.3) {
      const rep = repairers[0];
      particles.push({
        id: `p_rep_${Math.random()}`,
        x: rep.x + (Math.random() - 0.5) * 16,
        y: rep.y + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 35,
        vy: (Math.random() - 0.5) * 35 - 10,
        life: 0.25,
        maxLife: 0.25,
        color: '#38bdf8',
        size: 2.5,
      });
    }

    if (targetBuilding.hp >= targetBuilding.maxHp) {
      targetBuilding.hp = targetBuilding.maxHp;
      for (const w of repairers) {
        w.state = 'idle';
        w.targetBuildingId = undefined;
      }
    }
  }

  // 2. Process Building Production Queues
  for (const b of buildings) {
    if (b.hp <= 0 || !b.isConstructed || b.queue.length === 0) continue;

    const item = b.queue[0];
    item.progressTime += dt;

    if (item.progressTime >= item.totalTime) {
      const owner = b.isPlayer ? player : enemy;

      // Finish unit production
      if (item.type === 'unit') {
        const unitDef = UNITS[item.defId];
        if (unitDef) {
          // Check population limit
          if (owner.population + unitDef.popCost <= owner.maxPopulation) {
            // Spawn unit
            const spawnX = b.rallyPoint ? b.rallyPoint.x : b.x + b.width / 2;
            const spawnY = b.rallyPoint ? b.rallyPoint.y : b.y + b.height + 25;

            const newUnit: Unit = {
              id: `u_${unitDef.id}_${Math.random()}`,
              defId: unitDef.id,
              name: unitDef.name,
              faction: unitDef.faction,
              role: unitDef.role,
              isPlayer: b.isPlayer,
              x: spawnX,
              y: spawnY,
              state: 'idle',
              behaviorMode: 'aggressive',
              hp: unitDef.hp,
              maxHp: unitDef.hp,
              attackDamage: unitDef.attackDamage,
              armor: unitDef.armor,
              range: unitDef.range,
              attackSpeed: unitDef.attackSpeed,
              attackCooldown: 0,
              moveSpeed: unitDef.moveSpeed,
              popCost: unitDef.popCost,
              radius: unitDef.radius,
              buffs: [],
              facingAngle: Math.PI / 2,
              walkCycle: 0,
              attackAnimTimer: 0,
              isHitFlash: 0,
            };

            // If Hero: initialize level & abilities
            if (unitDef.role === 'hero') {
              newUnit.level = 1;
              newUnit.xp = 0;
              newUnit.maxXp = 100;
              newUnit.abilities = (unitDef.abilities || []).map((a) => ({
                defId: a.id,
                currentCooldown: 0,
              }));
              owner.stats.heroMaxLevel = Math.max(owner.stats.heroMaxLevel, 1);
            }

            units.push(newUnit);
            owner.population += unitDef.popCost;
            owner.stats.unitsCreated++;

            if (b.isPlayer) soundSystem.playUnitTrained();
            b.queue.shift();
          } else {
            // Paused due to pop cap, wait
            item.progressTime = item.totalTime;
          }
        } else {
          b.queue.shift();
        }
      }

      // Finish upgrade
      else if (item.type === 'upgrade') {
        const upDef = UPGRADES[item.defId];
        if (upDef) {
          if (upDef.category === 'weapons') owner.upgrades.weapons = upDef.level;
          else if (upDef.category === 'armor') owner.upgrades.armor = upDef.level;
          else if (upDef.category === 'training') {
            owner.upgrades.training = upDef.level;
            // Upgrade existing units max HP
            const bonus = upDef.bonus;
            for (const u of units) {
              if (u.isPlayer === b.isPlayer) {
                const oldMax = u.maxHp;
                u.maxHp = Math.round(u.maxHp * (1 + bonus));
                u.hp = Math.min(u.maxHp, u.hp + (u.maxHp - oldMax));
              }
            }
          }
          if (b.isPlayer) soundSystem.playUnitTrained();
        }
        b.queue.shift();
      }

      // Finish Tech Tier
      else if (item.type === 'tier') {
        const tierDef = item.defId === 'tier_2' ? TIER_UPGRADES.tier_2 : TIER_UPGRADES.tier_3;
        if (tierDef) {
          owner.techTier = tierDef.targetTier;
          if (b.isPlayer) soundSystem.playHeroLevelUp();
        }
        b.queue.shift();
      }
    }
  }
}

// Queue helper functions
export function queueUnitProduction(
  building: Building,
  unitDefId: string,
  player: PlayerData
): boolean {
  const def = UNITS[unitDefId];
  if (!def) return false;

  // Check tech tier
  if (def.tier > player.techTier) return false;

  // Check gold
  if (player.gold < def.goldCost) return false;

  // Check max pop
  if (player.population + def.popCost > player.maxPopulation) return false;

  // Deduct gold immediately
  player.gold -= def.goldCost;

  building.queue.push({
    id: `prod_${Math.random()}`,
    type: 'unit',
    defId: unitDefId,
    totalTime: def.buildTime,
    progressTime: 0,
  });

  return true;
}

export function queueUpgradeResearch(
  building: Building,
  upgradeId: string,
  player: PlayerData
): boolean {
  const def = UPGRADES[upgradeId];
  if (!def) return false;

  if (def.tierRequired > player.techTier) return false;
  if (player.gold < def.goldCost) return false;

  player.gold -= def.goldCost;

  building.queue.push({
    id: `up_${Math.random()}`,
    type: 'upgrade',
    defId: upgradeId,
    totalTime: def.researchTime,
    progressTime: 0,
  });

  return true;
}

export function queueTierUpgrade(
  building: Building,
  tierId: 'tier_2' | 'tier_3',
  player: PlayerData
): boolean {
  const def = tierId === 'tier_2' ? TIER_UPGRADES.tier_2 : TIER_UPGRADES.tier_3;
  if (!def) return false;

  if (tierId === 'tier_3' && player.techTier < 2) return false;
  if (player.gold < def.goldCost) return false;

  player.gold -= def.goldCost;

  building.queue.push({
    id: `tier_${Math.random()}`,
    type: 'tier',
    defId: tierId,
    totalTime: def.researchTime,
    progressTime: 0,
  });

  return true;
}
