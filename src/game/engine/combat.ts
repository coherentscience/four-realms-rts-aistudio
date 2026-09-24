import {
  AOE_FRIENDLY_FIRE_FACTOR,
  Building,
  Corpse,
  FloatingText,
  GameMap,
  Particle,
  PlayerData,
  Projectile,
  Unit,
  Vector2D,
} from '../types';
import { soundSystem } from './audio';
import { isNearForest } from './map';

export function updateCombat(
  units: Unit[],
  buildings: Building[],
  projectiles: Projectile[],
  particles: Particle[],
  floatingTexts: FloatingText[],
  corpses: Corpse[],
  player: PlayerData,
  enemy: PlayerData,
  map: GameMap,
  dt: number
) {
  // 1. Update Projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    const dx = p.targetX - p.x;
    const dy = p.targetY - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const step = p.speed * dt;

    if (dist <= step || dist < 8) {
      // Hit target
      applyProjectileImpact(p, units, buildings, particles, floatingTexts, player, enemy);
      projectiles.splice(i, 1);
    } else {
      p.x += (dx / dist) * step;
      p.y += (dy / dist) * step;

      // Trail particles
      if (Math.random() < 0.35) {
        particles.push({
          id: `p_trail_${Math.random()}`,
          x: p.x,
          y: p.y,
          vx: (Math.random() - 0.5) * 15,
          vy: (Math.random() - 0.5) * 15,
          life: 0.25,
          maxLife: 0.25,
          color: p.type === 'fireball' ? '#f97316' : p.type === 'holy' ? '#fde047' : '#94a3b8',
          size: 3,
        });
      }
    }
  }

  // 2. Update Defensive Towers
  for (const b of buildings) {
    if (b.hp <= 0 || !b.isConstructed || !b.canAttack) continue;

    b.attackCooldown = Math.max(0, b.attackCooldown - dt);
    if (b.attackCooldown <= 0) {
      // Find nearest hostile unit in range
      const target = units.find(
        (u) => u.hp > 0 && u.isPlayer !== b.isPlayer && getDistance(b.x + b.width / 2, b.y + b.height / 2, u.x, u.y) <= (b.attackRange || 180)
      );

      if (target) {
        b.attackCooldown = b.attackSpeed || 1.2;
        const startX = b.x + b.width / 2;
        const startY = b.y + 10;
        projectiles.push({
          id: `proj_tower_${Math.random()}`,
          startX,
          startY,
          x: startX,
          y: startY,
          targetX: target.x,
          targetY: target.y,
          targetUnitId: target.id,
          speed: 340,
          damage: b.attackDamage || 28,
          type: b.faction === 'undead' ? 'bone' : b.faction === 'elves' ? 'nature' : 'arrow',
          sourceFaction: b.faction,
          isPlayer: b.isPlayer,
        });
        soundSystem.playArrowShot();
      }
    }
  }

  // 3. Faction Passives & Auras
  applyFactionPassives(units, map, dt);

  // 4. Update Unit Attacks & States
  for (const u of units) {
    if (u.hp <= 0) continue;

    u.attackCooldown = Math.max(0, u.attackCooldown - dt);
    u.attackAnimTimer = Math.max(0, u.attackAnimTimer - dt);
    if (u.isHitFlash > 0) u.isHitFlash = Math.max(0, u.isHitFlash - dt);

    // Update Buffs
    for (let bIdx = u.buffs.length - 1; bIdx >= 0; bIdx--) {
      const buff = u.buffs[bIdx];
      buff.duration -= dt;
      if (buff.regenHpPerSec) {
        u.hp = Math.min(u.maxHp, u.hp + buff.regenHpPerSec * dt);
      }
      if (buff.duration <= 0) {
        u.buffs.splice(bIdx, 1);
      }
    }

    // Do not auto-attack if gathering or building
    if (u.state === 'gathering' || u.state === 'returning_resource' || u.state === 'building') {
      continue;
    }

    // If unit is rooted (e.g. Entangle), do not move
    const isRooted = u.buffs.some((b) => b.root);

    // Target tracking & auto-acquisition
    let targetUnit: Unit | undefined;
    let targetBuilding: Building | undefined;

    if (u.targetEntityId) {
      if (u.targetEntityType === 'unit') {
        targetUnit = units.find((t) => t.id === u.targetEntityId && t.hp > 0);
        if (!targetUnit) u.targetEntityId = undefined;
      } else if (u.targetEntityType === 'building') {
        targetBuilding = buildings.find((b) => b.id === u.targetEntityId && b.hp > 0);
        if (!targetBuilding) u.targetEntityId = undefined;
      }
    }

    // Auto-acquire enemy if idle or aggressive mode (even while moving on attack-move)
    if (!targetUnit && !targetBuilding && u.behaviorMode !== 'hold' && (u.state !== 'moving' || u.behaviorMode === 'aggressive')) {
      const aggroRadius = u.behaviorMode === 'defensive' ? 140 : 240;
      targetUnit = units.find(
        (other) => other.hp > 0 && other.isPlayer !== u.isPlayer && getDistance(u.x, u.y, other.x, other.y) <= aggroRadius
      );
      if (targetUnit) {
        u.targetEntityId = targetUnit.id;
        u.targetEntityType = 'unit';
      } else {
        // Check for enemy buildings nearby
        targetBuilding = buildings.find(
          (b) => b.hp > 0 && b.isPlayer !== u.isPlayer && getDistance(u.x, u.y, b.x + b.width / 2, b.y + b.height / 2) <= (aggroRadius + b.width / 2)
        );
        if (targetBuilding) {
          u.targetEntityId = targetBuilding.id;
          u.targetEntityType = 'building';
        }
      }
    }

    // Attack Target Unit
    if (targetUnit) {
      const dist = getDistance(u.x, u.y, targetUnit.x, targetUnit.y);
      const effectiveRange = u.range + targetUnit.radius;

      // Update facing angle
      u.facingAngle = Math.atan2(targetUnit.y - u.y, targetUnit.x - u.x);

      if (dist <= effectiveRange) {
        // In range, attack
        u.state = 'attacking';
        if (u.attackCooldown <= 0) {
          executeAttack(u, targetUnit, projectiles, particles, floatingTexts, player, enemy);
          u.attackCooldown = calculateAttackSpeed(u);
          u.attackAnimTimer = 0.3;
        }
      } else if (!isRooted && u.behaviorMode !== 'hold') {
        // Move towards target
        u.state = 'moving';
        const moveDist = calculateMoveSpeed(u) * dt;
        const dx = targetUnit.x - u.x;
        const dy = targetUnit.y - u.y;
        u.x += (dx / dist) * moveDist;
        u.y += (dy / dist) * moveDist;
        u.walkCycle = (u.walkCycle + dt * 8) % (Math.PI * 2);
      }
    } else if (targetBuilding) {
      const targetCenterX = targetBuilding.x + targetBuilding.width / 2;
      const targetCenterY = targetBuilding.y + targetBuilding.height / 2;
      const dist = getDistance(u.x, u.y, targetCenterX, targetCenterY);
      const bHalfSize = Math.max(targetBuilding.width, targetBuilding.height) / 2;
      const effectiveRange = u.range + bHalfSize + 6;

      u.facingAngle = Math.atan2(targetCenterY - u.y, targetCenterX - u.x);

      if (dist <= effectiveRange) {
        u.state = 'attacking';
        if (u.attackCooldown <= 0) {
          executeAttackOnBuilding(u, targetBuilding, projectiles, particles, floatingTexts, player, enemy);
          u.attackCooldown = calculateAttackSpeed(u);
          u.attackAnimTimer = 0.3;
        }
      } else if (!isRooted && u.behaviorMode !== 'hold') {
        u.state = 'moving';
        const moveDist = calculateMoveSpeed(u) * dt;
        const dx = targetCenterX - u.x;
        const dy = targetCenterY - u.y;
        u.x += (dx / dist) * moveDist;
        u.y += (dy / dist) * moveDist;
        u.walkCycle = (u.walkCycle + dt * 8) % (Math.PI * 2);
      }
    } else if (u.targetX !== undefined && u.targetY !== undefined) {
      // Moving to ground target
      const dist = getDistance(u.x, u.y, u.targetX, u.targetY);
      if (dist < 6) {
        u.state = 'idle';
        u.targetX = undefined;
        u.targetY = undefined;
      } else if (!isRooted) {
        u.state = 'moving';
        const moveDist = calculateMoveSpeed(u) * dt;
        const dx = u.targetX - u.x;
        const dy = u.targetY - u.y;
        u.facingAngle = Math.atan2(dy, dx);
        u.x += (dx / dist) * Math.min(dist, moveDist);
        u.y += (dy / dist) * Math.min(dist, moveDist);
        u.walkCycle = (u.walkCycle + dt * 8) % (Math.PI * 2);
      }
    } else if (u.state === 'attacking' && !targetUnit && !targetBuilding) {
      u.state = 'idle';
    }
  }

  // 5. Clean up dead units and handle deaths
  for (let i = units.length - 1; i >= 0; i--) {
    const u = units[i];
    if (u.hp <= 0) {
      handleUnitDeath(u, units, corpses, particles, player, enemy);
      units.splice(i, 1);
    }
  }

  // 6. Clean up dead buildings
  for (let i = buildings.length - 1; i >= 0; i--) {
    const b = buildings[i];
    if (b.hp <= 0) {
      handleBuildingDestruction(b, units, particles, player, enemy);
      buildings.splice(i, 1);
    }
  }

  // 7. Update Corpses decay (45s duration)
  for (let i = corpses.length - 1; i >= 0; i--) {
    corpses[i].duration -= dt;
    if (corpses[i].duration <= 0) {
      corpses.splice(i, 1);
    }
  }
}

function executeAttack(
  attacker: Unit,
  defender: Unit,
  projectiles: Projectile[],
  particles: Particle[],
  floatingTexts: FloatingText[],
  player: PlayerData,
  enemy: PlayerData
) {
  // If ranged or siege or caster: fire projectile
  if (attacker.range > 60) {
    let projType: Projectile['type'] = 'arrow';
    let damageRadius: number | undefined = undefined;
    if (attacker.role === 'siege') {
      projType = attacker.faction === 'undead' ? 'bone' : attacker.faction === 'kingdoms' ? 'cannonball' : attacker.faction === 'elves' ? 'nature' : 'fireball';
      damageRadius = 55;
    } else if (attacker.role === 'caster') {
      projType = attacker.faction === 'undead' ? 'bone' : attacker.faction === 'elves' ? 'nature' : 'fireball';
      if (attacker.defId === 'kingdoms_battlemage') {
        damageRadius = 45;
      }
    }

    projectiles.push({
      id: `proj_${Math.random()}`,
      startX: attacker.x,
      startY: attacker.y,
      x: attacker.x,
      y: attacker.y,
      targetX: defender.x,
      targetY: defender.y,
      targetUnitId: defender.id,
      speed: attacker.role === 'siege' ? 260 : 360,
      damage: calculateAttackDamage(attacker, attacker.isPlayer ? player : enemy),
      damageRadius,
      type: projType,
      sourceFaction: attacker.faction,
      isPlayer: attacker.isPlayer,
    });

    if (attacker.role === 'siege') {
      soundSystem.playExplosion();
    } else {
      soundSystem.playArrowShot();
    }
  } else {
    // Melee attack: instant hit
    applyDamageToUnit(
      defender,
      calculateAttackDamage(attacker, attacker.isPlayer ? player : enemy),
      attacker,
      particles,
      floatingTexts,
      player,
      enemy
    );
    soundSystem.playMeleeHit();
  }
}

function executeAttackOnBuilding(
  attacker: Unit,
  defender: Building,
  projectiles: Projectile[],
  particles: Particle[],
  floatingTexts: FloatingText[],
  player: PlayerData,
  enemy: PlayerData
) {
  const targetX = defender.x + defender.width / 2;
  const targetY = defender.y + defender.height / 2;

  if (attacker.range > 60) {
    let projType: Projectile['type'] = 'arrow';
    let damageRadius: number | undefined = undefined;
    if (attacker.role === 'siege') {
      projType = attacker.faction === 'undead' ? 'bone' : attacker.faction === 'kingdoms' ? 'cannonball' : attacker.faction === 'elves' ? 'nature' : 'fireball';
      damageRadius = 55;
    } else if (attacker.role === 'caster') {
      projType = attacker.faction === 'undead' ? 'bone' : attacker.faction === 'elves' ? 'nature' : 'fireball';
      if (attacker.defId === 'kingdoms_battlemage') {
        damageRadius = 45;
      }
    }

    projectiles.push({
      id: `proj_${Math.random()}`,
      startX: attacker.x,
      startY: attacker.y,
      x: attacker.x,
      y: attacker.y,
      targetX,
      targetY,
      speed: attacker.role === 'siege' ? 260 : 360,
      damage: calculateAttackDamage(attacker, attacker.isPlayer ? player : enemy),
      damageRadius,
      type: projType,
      sourceFaction: attacker.faction,
      isPlayer: attacker.isPlayer,
    });
    if (attacker.role === 'siege') soundSystem.playExplosion();
    else soundSystem.playArrowShot();
  } else {
    applyDamageToBuilding(
      defender,
      calculateAttackDamage(attacker, attacker.isPlayer ? player : enemy),
      particles,
      floatingTexts
    );
    soundSystem.playMeleeHit();
  }
}

export function applyDamageToUnit(
  unit: Unit,
  rawDamage: number,
  attacker: Unit | null,
  particles: Particle[],
  floatingTexts: FloatingText[],
  player: PlayerData,
  enemy: PlayerData
) {
  // Check divine shield / invulnerability
  if (unit.buffs.some((b) => b.invulnerable)) {
    floatingTexts.push({
      id: `ft_inv_${Math.random()}`,
      text: 'IMMUNE',
      x: unit.x,
      y: unit.y - 20,
      color: '#fbbf24',
      life: 0.8,
      maxLife: 0.8,
      vy: -20,
    });
    return;
  }

  // Formula: DAMAGE TAKEN = MAX(1, ATTACK DAMAGE - ARMOR)
  const totalArmor = calculateArmor(unit, unit.isPlayer ? player : enemy);
  const damageTaken = Math.max(1, Math.round(rawDamage - totalArmor));

  unit.hp = Math.max(0, unit.hp - damageTaken);
  unit.isHitFlash = 0.15;

  floatingTexts.push({
    id: `ft_dmg_${Math.random()}`,
    text: `-${damageTaken}`,
    x: unit.x + (Math.random() - 0.5) * 16,
    y: unit.y - 18,
    color: '#ef4444',
    life: 0.7,
    maxLife: 0.7,
    vy: -25,
  });

  // Blood / spark particles
  for (let i = 0; i < 3; i++) {
    particles.push({
      id: `p_hit_${Math.random()}`,
      x: unit.x,
      y: unit.y,
      vx: (Math.random() - 0.5) * 60,
      vy: (Math.random() - 0.5) * 60,
      life: 0.3,
      maxLife: 0.3,
      color: unit.faction === 'undead' ? '#a855f7' : '#ef4444',
      size: 3,
    });
  }
}

export function applyDamageToBuilding(
  building: Building,
  rawDamage: number,
  particles: Particle[],
  floatingTexts: FloatingText[]
) {
  // Buildings take direct damage with base armor 2
  const damageTaken = Math.max(1, Math.round(rawDamage - 2));
  building.hp = Math.max(0, building.hp - damageTaken);
  building.hitFlash = 0.15;

  floatingTexts.push({
    id: `ft_bdmg_${Math.random()}`,
    text: `-${damageTaken}`,
    x: building.x + building.width / 2 + (Math.random() - 0.5) * 20,
    y: building.y + 10,
    color: '#f97316',
    life: 0.75,
    maxLife: 0.75,
    vy: -20,
  });

  // Dust & rubble particles
  for (let i = 0; i < 4; i++) {
    particles.push({
      id: `p_bhit_${Math.random()}`,
      x: building.x + building.width / 2,
      y: building.y + building.height / 2,
      vx: (Math.random() - 0.5) * 50,
      vy: (Math.random() - 0.5) * 50 - 15,
      life: 0.4,
      maxLife: 0.4,
      color: '#94a3b8',
      size: 4,
    });
  }
}

function applyProjectileImpact(
  p: Projectile,
  units: Unit[],
  buildings: Building[],
  particles: Particle[],
  floatingTexts: FloatingText[],
  player: PlayerData,
  enemy: PlayerData
) {
  // Area-of-effect blast with controlled friendly fire
  if (p.damageRadius && p.damageRadius > 0) {
    const rad = p.damageRadius;

    // 1. Foes in blast take full damage
    const foes = units.filter(
      (u) => u.hp > 0 && u.isPlayer !== p.isPlayer && getDistance(u.x, u.y, p.targetX, p.targetY) <= (rad + u.radius)
    );
    for (const f of foes) {
      applyDamageToUnit(f, p.damage, null, particles, floatingTexts, player, enemy);
    }

    // 2. Friendly fire: allies caught in blast take reduced damage (30-50%, here 40%)
    const allies = units.filter(
      (u) => u.hp > 0 && u.isPlayer === p.isPlayer && getDistance(u.x, u.y, p.targetX, p.targetY) <= (rad + u.radius)
    );
    for (const a of allies) {
      applyDamageToUnit(a, Math.round(p.damage * AOE_FRIENDLY_FIRE_FACTOR), null, particles, floatingTexts, player, enemy);
    }

    // 3. Enemy buildings in blast take full damage
    const targetBuildings = buildings.filter(
      (b) => b.hp > 0 && b.isPlayer !== p.isPlayer &&
        getDistance(b.x + b.width / 2, b.y + b.height / 2, p.targetX, p.targetY) <= (rad + Math.max(b.width, b.height) / 2)
    );
    for (const b of targetBuildings) {
      applyDamageToBuilding(b, p.damage, particles, floatingTexts);
    }

    // Explosion particles
    for (let i = 0; i < 14; i++) {
      particles.push({
        id: `p_aoe_${Math.random()}`,
        x: p.targetX + (Math.random() - 0.5) * rad * 0.7,
        y: p.targetY + (Math.random() - 0.5) * rad * 0.7,
        vx: (Math.random() - 0.5) * 90,
        vy: (Math.random() - 0.5) * 90 - 20,
        life: 0.5,
        maxLife: 0.5,
        color: p.type === 'cannonball' ? '#f59e0b' : p.type === 'fireball' ? '#ef4444' : p.type === 'bone' ? '#c084fc' : '#84cc16',
        size: 5,
      });
    }
    soundSystem.playExplosion();
    return;
  }

  // Single-target projectile (no friendly fire)
  if (p.targetUnitId) {
    const target = units.find((u) => u.id === p.targetUnitId && u.hp > 0);
    if (target) {
      applyDamageToUnit(target, p.damage, null, particles, floatingTexts, player, enemy);
      return;
    }
  }

  // Area or nearest foe at impact point
  const targetUnit = units.find(
    (u) => u.hp > 0 && u.isPlayer !== p.isPlayer && getDistance(u.x, u.y, p.targetX, p.targetY) <= 30
  );
  if (targetUnit) {
    applyDamageToUnit(targetUnit, p.damage, null, particles, floatingTexts, player, enemy);
    return;
  }

  // Check enemy building at impact point
  const targetBuilding = buildings.find(
    (b) => b.hp > 0 && b.isPlayer !== p.isPlayer &&
      p.targetX >= b.x && p.targetX <= b.x + b.width &&
      p.targetY >= b.y && p.targetY <= b.y + b.height
  );
  if (targetBuilding) {
    applyDamageToBuilding(targetBuilding, p.damage, particles, floatingTexts);
  }
}

function handleUnitDeath(
  deadUnit: Unit,
  allUnits: Unit[],
  corpses: Corpse[],
  particles: Particle[],
  player: PlayerData,
  enemy: PlayerData
) {
  const killerIsPlayer = !deadUnit.isPlayer;

  // 1. Update stats
  if (deadUnit.isPlayer) {
    player.stats.unitsLost++;
    player.population = Math.max(0, player.population - deadUnit.popCost);
  } else {
    enemy.stats.unitsLost++;
    enemy.population = Math.max(0, enemy.population - deadUnit.popCost);
    player.stats.enemiesDefeated++;
  }

  // 2. Award XP to nearby friendly heroes
  const heroes = allUnits.filter(
    (u) => u.hp > 0 && u.role === 'hero' && u.isPlayer === killerIsPlayer && getDistance(u.x, u.y, deadUnit.x, deadUnit.y) <= 350
  );
  for (const hero of heroes) {
    awardHeroXP(hero, deadUnit.role === 'hero' ? 120 : 35);
  }

  // 3. Faction Mechanic: Horde Bloodlust on kill
  const nearbyHordeWarriors = allUnits.filter(
    (u) => u.hp > 0 && u.faction === 'horde' && u.isPlayer === killerIsPlayer && getDistance(u.x, u.y, deadUnit.x, deadUnit.y) <= 240
  );
  for (const h of nearbyHordeWarriors) {
    // Add bloodlust buff (capped at 6s)
    const existing = h.buffs.find((b) => b.type === 'bloodlust');
    if (existing) {
      existing.duration = 6;
    } else {
      h.buffs.push({
        id: `bl_${Math.random()}`,
        name: 'Bloodlust',
        duration: 6,
        maxDuration: 6,
        type: 'bloodlust',
        speedMult: 1.15,
      });
    }
  }

  // 4. Faction Mechanic: Corpse creation
  // Normal non-summon units leave corpses
  if (!deadUnit.isSummon) {
    corpses.push({
      id: `corpse_${Math.random()}`,
      x: deadUnit.x,
      y: deadUnit.y,
      duration: 45,
      faction: deadUnit.faction,
    });
  }

  // Death explosion particles
  for (let i = 0; i < 8; i++) {
    particles.push({
      id: `p_death_${Math.random()}`,
      x: deadUnit.x,
      y: deadUnit.y,
      vx: (Math.random() - 0.5) * 80,
      vy: (Math.random() - 0.5) * 80,
      life: 0.5,
      maxLife: 0.5,
      color: deadUnit.isPlayer ? '#3b82f6' : '#ef4444',
      size: 4,
    });
  }
}

function handleBuildingDestruction(
  deadBuilding: Building,
  units: Unit[],
  particles: Particle[],
  player: PlayerData,
  enemy: PlayerData
) {
  deadBuilding.constructionState = 'DESTROYED';
  deadBuilding.hp = 0;
  deadBuilding.queue = [];

  // Free any workers targeting this building
  for (const u of units) {
    if (u.targetBuildingId === deadBuilding.id) {
      u.state = 'idle';
      u.targetBuildingId = undefined;
    }
  }

  if (deadBuilding.isPlayer) {
    // Player lost building
  } else {
    player.stats.buildingsDestroyed++;
  }

  // Dramatic building collapse particles
  const cx = deadBuilding.x + deadBuilding.width / 2;
  const cy = deadBuilding.y + deadBuilding.height / 2;
  for (let i = 0; i < 20; i++) {
    particles.push({
      id: `p_bcollapse_${Math.random()}`,
      x: cx + (Math.random() - 0.5) * deadBuilding.width,
      y: cy + (Math.random() - 0.5) * deadBuilding.height,
      vx: (Math.random() - 0.5) * 120,
      vy: (Math.random() - 0.5) * 120 - 20,
      life: 0.8,
      maxLife: 0.8,
      color: '#64748b',
      size: 6,
    });
  }
  soundSystem.playExplosion();
}

export function awardHeroXP(hero: Unit, xpAmount: number) {
  if (!hero.level || !hero.xp || !hero.maxXp) return;

  hero.xp += xpAmount;
  if (hero.xp >= hero.maxXp && hero.level < 5) {
    hero.level++;
    hero.xp -= hero.maxXp;
    hero.maxXp = Math.round(hero.maxXp * 1.5);
    hero.maxHp += 120;
    hero.hp = hero.maxHp;
    hero.attackDamage += 8;
    hero.armor += 1;

    soundSystem.playHeroLevelUp();
  }
}

function applyFactionPassives(units: Unit[], map: GameMap, dt: number) {
  // 1. Elves Nature Blessing near forests
  for (const u of units) {
    if (u.hp <= 0) continue;
    if (u.faction === 'elves') {
      const nearForest = isNearForest({ x: u.x, y: u.y }, map.forests, 70);
      const existing = u.buffs.find((b) => b.type === 'nature_regen');
      if (nearForest) {
        if (!existing) {
          u.buffs.push({
            id: `nature_${Math.random()}`,
            name: 'Forest Blessing',
            duration: 2,
            maxDuration: 2,
            type: 'nature_regen',
            regenHpPerSec: 8,
            speedMult: 1.1,
          });
        } else {
          existing.duration = 2;
        }
      }
    }
  }

  // 2. Kingdoms Rally Aura near Paladin
  const paladins = units.filter((u) => u.hp > 0 && u.defId === 'kingdoms_paladin');
  for (const paladin of paladins) {
    const allies = units.filter(
      (u) => u.hp > 0 && u.faction === 'kingdoms' && u.isPlayer === paladin.isPlayer && getDistance(u.x, u.y, paladin.x, paladin.y) <= 180
    );
    for (const ally of allies) {
      const existing = ally.buffs.find((b) => b.type === 'rally');
      if (!existing) {
        ally.buffs.push({
          id: `rally_${Math.random()}`,
          name: 'Rally',
          duration: 2,
          maxDuration: 2,
          type: 'rally',
          attackMult: 1.15,
          armorBonus: 2,
        });
      } else {
        existing.duration = 2;
      }
    }
  }
}

export function calculateAttackDamage(unit: Unit, playerData: PlayerData): number {
  let dmg = unit.attackDamage;

  // Universal Weapons upgrade (+10% or +20%)
  if (playerData.upgrades.weapons > 0) {
    dmg *= 1 + playerData.upgrades.weapons * 0.1;
  }

  // Buffs
  for (const b of unit.buffs) {
    if (b.attackMult) dmg *= b.attackMult;
  }

  return Math.round(dmg);
}

export function calculateArmor(unit: Unit, playerData: PlayerData): number {
  let arm = unit.armor;

  // Universal Armor upgrade (+1 or +2)
  if (playerData.upgrades.armor > 0) {
    arm += playerData.upgrades.armor;
  }

  // Buffs
  for (const b of unit.buffs) {
    if (b.armorBonus) arm += b.armorBonus;
  }

  return Math.max(0, arm);
}

export function calculateAttackSpeed(unit: Unit): number {
  let speed = unit.attackSpeed;

  for (const b of unit.buffs) {
    if (b.type === 'bloodlust') speed *= 0.8; // attacks 20% faster
  }

  return Math.max(0.5, speed);
}

export function calculateMoveSpeed(unit: Unit): number {
  let spd = unit.moveSpeed;

  for (const b of unit.buffs) {
    if (b.speedMult) spd *= b.speedMult;
  }

  return spd;
}

export function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}
