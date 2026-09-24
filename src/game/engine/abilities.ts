import { ABILITIES } from '../config/abilities';
import { UNITS } from '../config/units';
import {
  AOE_FRIENDLY_FIRE_FACTOR,
  Building,
  Corpse,
  FloatingText,
  Particle,
  PlayerData,
  Unit,
  Vector2D,
} from '../types';
import { soundSystem } from './audio';
import { applyDamageToUnit, getDistance } from './combat';

export function castAbility(
  caster: Unit,
  abilityId: string,
  targetPos: Vector2D | null,
  targetEntityId: string | null,
  units: Unit[],
  buildings: Building[],
  corpses: Corpse[],
  particles: Particle[],
  floatingTexts: FloatingText[],
  player: PlayerData,
  enemy: PlayerData
): boolean {
  const def = ABILITIES[abilityId];
  if (!def) return false;

  const abState = caster.abilities?.find((a) => a.defId === abilityId);
  if (!abState || abState.currentCooldown > 0) return false;

  const casterOwner = caster.isPlayer ? player : enemy;

  // Execute specific ability
  switch (abilityId) {
    // ================= PALADIN =================
    case 'paladin_holy_strike': {
      const target = units.find((u) => u.id === targetEntityId && u.isPlayer !== caster.isPlayer && u.hp > 0);
      if (!target || getDistance(caster.x, caster.y, target.x, target.y) > def.range + 30) return false;

      applyDamageToUnit(target, 70, caster, particles, floatingTexts, player, enemy);
      // Sacred flash particles
      for (let i = 0; i < 12; i++) {
        particles.push({
          id: `holy_${Math.random()}`,
          x: target.x,
          y: target.y,
          vx: (Math.random() - 0.5) * 80,
          vy: (Math.random() - 0.5) * 80,
          life: 0.4,
          maxLife: 0.4,
          color: '#fef08a',
          size: 4,
        });
      }
      soundSystem.playSpellCast('holy');
      break;
    }

    case 'paladin_heal': {
      let target = units.find((u) => u.id === targetEntityId && u.isPlayer === caster.isPlayer && u.hp > 0);
      if (!target) target = caster; // self heal if no ally targeted
      if (getDistance(caster.x, caster.y, target.x, target.y) > def.range + 30) return false;

      target.hp = Math.min(target.maxHp, target.hp + 140);
      floatingTexts.push({
        id: `ft_heal_${Math.random()}`,
        text: '+140',
        x: target.x,
        y: target.y - 20,
        color: '#4ade80',
        life: 0.8,
        maxLife: 0.8,
        vy: -20,
      });
      for (let i = 0; i < 10; i++) {
        particles.push({
          id: `heal_${Math.random()}`,
          x: target.x,
          y: target.y,
          vx: (Math.random() - 0.5) * 40,
          vy: -Math.random() * 50,
          life: 0.5,
          maxLife: 0.5,
          color: '#86efac',
          size: 3,
        });
      }
      soundSystem.playSpellCast('holy');
      break;
    }

    case 'paladin_rally': {
      const allies = units.filter(
        (u) => u.hp > 0 && u.isPlayer === caster.isPlayer && getDistance(caster.x, caster.y, u.x, u.y) <= (def.radius || 180)
      );
      for (const a of allies) {
        a.buffs.push({
          id: `rally_horn_${Math.random()}`,
          name: 'Rally',
          duration: 8,
          maxDuration: 8,
          type: 'rally',
          attackMult: 1.2,
          armorBonus: 2,
        });
      }
      soundSystem.playSpellCast('holy');
      break;
    }

    case 'paladin_divine_shield': {
      caster.buffs.push({
        id: `divine_shield_${Math.random()}`,
        name: 'Divine Shield',
        duration: 6,
        maxDuration: 6,
        type: 'divine_shield',
        invulnerable: true,
      });
      soundSystem.playSpellCast('holy');
      break;
    }

    // ================= BLADEMASTER =================
    case 'blademaster_wind_walk': {
      caster.buffs.push({
        id: `ww_${Math.random()}`,
        name: 'Wind Walk',
        duration: 8,
        maxDuration: 8,
        type: 'speed_boost',
        speedMult: 1.5,
        attackMult: 1.4,
      });
      soundSystem.playSpellCast('wind');
      break;
    }

    case 'blademaster_whirlwind': {
      const radius = def.radius || 70;
      // Enemies take 100% damage
      const foes = units.filter(
        (u) => u.hp > 0 && u.isPlayer !== caster.isPlayer && getDistance(caster.x, caster.y, u.x, u.y) <= radius
      );
      for (const f of foes) {
        applyDamageToUnit(f, 75, caster, particles, floatingTexts, player, enemy);
      }
      // Friendly fire: allies in radius (except caster) take reduced friendly damage
      const allies = units.filter(
        (u) => u.hp > 0 && u.id !== caster.id && u.isPlayer === caster.isPlayer && getDistance(caster.x, caster.y, u.x, u.y) <= radius
      );
      for (const a of allies) {
        applyDamageToUnit(a, Math.round(75 * AOE_FRIENDLY_FIRE_FACTOR), caster, particles, floatingTexts, player, enemy);
      }
      // Circular slash effect
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * Math.PI * 2;
        particles.push({
          id: `spin_${Math.random()}`,
          x: caster.x + Math.cos(ang) * 40,
          y: caster.y + Math.sin(ang) * 40,
          vx: Math.cos(ang) * 60,
          vy: Math.sin(ang) * 60,
          life: 0.3,
          maxLife: 0.3,
          color: '#f97316',
          size: 4,
        });
      }
      soundSystem.playMeleeHit();
      break;
    }

    case 'blademaster_mirror_image': {
      const cloneDef = UNITS.summon_mirror_image;
      const clone: Unit = {
        id: `clone_${Math.random()}`,
        defId: cloneDef.id,
        name: cloneDef.name,
        faction: 'horde',
        role: 'summon',
        isPlayer: caster.isPlayer,
        x: caster.x + 25,
        y: caster.y + 25,
        state: 'idle',
        behaviorMode: 'aggressive',
        hp: cloneDef.hp,
        maxHp: cloneDef.hp,
        attackDamage: cloneDef.attackDamage,
        armor: cloneDef.armor,
        range: cloneDef.range,
        attackSpeed: cloneDef.attackSpeed,
        attackCooldown: 0,
        moveSpeed: cloneDef.moveSpeed,
        popCost: 0,
        radius: cloneDef.radius,
        isSummon: true,
        decayTimer: 15,
        buffs: [],
        facingAngle: caster.facingAngle,
        walkCycle: 0,
        attackAnimTimer: 0,
        isHitFlash: 0,
      };
      units.push(clone);
      soundSystem.playSpellCast('wind');
      break;
    }

    case 'blademaster_bladestorm': {
      const radius = def.radius || 90;
      // Enemies take 100% damage
      const foes = units.filter(
        (u) => u.hp > 0 && u.isPlayer !== caster.isPlayer && getDistance(caster.x, caster.y, u.x, u.y) <= radius
      );
      for (const f of foes) {
        applyDamageToUnit(f, 130, caster, particles, floatingTexts, player, enemy);
      }
      // Friendly fire: allies in radius (except caster) take reduced friendly damage
      const allies = units.filter(
        (u) => u.hp > 0 && u.id !== caster.id && u.isPlayer === caster.isPlayer && getDistance(caster.x, caster.y, u.x, u.y) <= radius
      );
      for (const a of allies) {
        applyDamageToUnit(a, Math.round(130 * AOE_FRIENDLY_FIRE_FACTOR), caster, particles, floatingTexts, player, enemy);
      }
      soundSystem.playExplosion();
      break;
    }

    // ================= DEATH KNIGHT =================
    case 'death_knight_death_coil': {
      const target = units.find((u) => u.id === targetEntityId && u.hp > 0);
      if (!target || getDistance(caster.x, caster.y, target.x, target.y) > def.range + 30) return false;

      if (target.isPlayer !== caster.isPlayer) {
        // Enemy: damage
        applyDamageToUnit(target, 75, caster, particles, floatingTexts, player, enemy);
      } else {
        // Undead ally: heal
        target.hp = Math.min(target.maxHp, target.hp + 130);
        floatingTexts.push({
          id: `ft_dcheal_${Math.random()}`,
          text: '+130',
          x: target.x,
          y: target.y - 20,
          color: '#10b981',
          life: 0.8,
          maxLife: 0.8,
          vy: -20,
        });
      }
      soundSystem.playSpellCast('unholy');
      break;
    }

    case 'death_knight_raise_dead':
    case 'necromancer_raise_skeleton': {
      // Find nearby corpses
      const nearbyCorpses = corpses.filter((c) => getDistance(caster.x, caster.y, c.x, c.y) <= def.range);
      if (nearbyCorpses.length === 0) {
        // If no corpse, allow 1 emergency summon with shorter life if hero
        if (abilityId !== 'death_knight_raise_dead') return false;
      }

      // Consume up to 2 corpses
      const count = Math.min(2, Math.max(1, nearbyCorpses.length));
      for (let i = 0; i < count; i++) {
        if (nearbyCorpses[i]) {
          const cIdx = corpses.indexOf(nearbyCorpses[i]);
          if (cIdx !== -1) corpses.splice(cIdx, 1);
        }

        const skelDef = UNITS.summon_skeleton;
        units.push({
          id: `skel_${Math.random()}`,
          defId: skelDef.id,
          name: skelDef.name,
          faction: 'undead',
          role: 'summon',
          isPlayer: caster.isPlayer,
          x: caster.x + (i * 20 - 10),
          y: caster.y + 20,
          state: 'idle',
          behaviorMode: 'aggressive',
          hp: skelDef.hp,
          maxHp: skelDef.hp,
          attackDamage: skelDef.attackDamage,
          armor: skelDef.armor,
          range: skelDef.range,
          attackSpeed: skelDef.attackSpeed,
          attackCooldown: 0,
          moveSpeed: skelDef.moveSpeed,
          popCost: 0,
          radius: skelDef.radius,
          isSummon: true,
          decayTimer: 25,
          buffs: [],
          facingAngle: 0,
          walkCycle: 0,
          attackAnimTimer: 0,
          isHitFlash: 0,
        });
      }
      soundSystem.playSpellCast('unholy');
      break;
    }

    case 'death_knight_death_aura': {
      const foes = units.filter(
        (u) => u.hp > 0 && u.isPlayer !== caster.isPlayer && getDistance(caster.x, caster.y, u.x, u.y) <= (def.radius || 170)
      );
      for (const f of foes) {
        applyDamageToUnit(f, 40, caster, particles, floatingTexts, player, enemy);
        f.buffs.push({
          id: `slow_${Math.random()}`,
          name: 'Unholy Chill',
          duration: 6,
          maxDuration: 6,
          type: 'speed_boost',
          speedMult: 0.75,
        });
      }
      soundSystem.playSpellCast('unholy');
      break;
    }

    case 'death_knight_army_of_the_dead': {
      for (let i = 0; i < 4; i++) {
        const ghoulDef = UNITS.summon_frenzied_ghoul;
        const angle = (i / 4) * Math.PI * 2;
        units.push({
          id: `ghoul_sum_${Math.random()}`,
          defId: ghoulDef.id,
          name: ghoulDef.name,
          faction: 'undead',
          role: 'summon',
          isPlayer: caster.isPlayer,
          x: caster.x + Math.cos(angle) * 35,
          y: caster.y + Math.sin(angle) * 35,
          state: 'idle',
          behaviorMode: 'aggressive',
          hp: ghoulDef.hp,
          maxHp: ghoulDef.hp,
          attackDamage: ghoulDef.attackDamage,
          armor: ghoulDef.armor,
          range: ghoulDef.range,
          attackSpeed: ghoulDef.attackSpeed,
          attackCooldown: 0,
          moveSpeed: ghoulDef.moveSpeed,
          popCost: 0,
          radius: ghoulDef.radius,
          isSummon: true,
          decayTimer: 20,
          buffs: [],
          facingAngle: angle,
          walkCycle: 0,
          attackAnimTimer: 0,
          isHitFlash: 0,
        });
      }
      soundSystem.playSpellCast('unholy');
      break;
    }

    // ================= ARCHDRUID =================
    case 'archdruid_entangle': {
      const target = units.find((u) => u.id === targetEntityId && u.isPlayer !== caster.isPlayer && u.hp > 0);
      if (!target || getDistance(caster.x, caster.y, target.x, target.y) > def.range + 30) return false;

      target.buffs.push({
        id: `entangle_${Math.random()}`,
        name: 'Entangled',
        duration: 4,
        maxDuration: 4,
        type: 'entangle',
        root: true,
      });
      applyDamageToUnit(target, 50, caster, particles, floatingTexts, player, enemy);
      soundSystem.playSpellCast('nature');
      break;
    }

    case 'archdruid_moonfall': {
      if (!targetPos) return false;
      const radius = def.radius || 60;
      // Enemies take 100% damage
      const foes = units.filter(
        (u) => u.hp > 0 && u.isPlayer !== caster.isPlayer && getDistance(targetPos.x, targetPos.y, u.x, u.y) <= radius
      );
      for (const f of foes) {
        applyDamageToUnit(f, 90, caster, particles, floatingTexts, player, enemy);
      }
      // Friendly fire: allies in blast radius take reduced friendly damage
      const allies = units.filter(
        (u) => u.hp > 0 && u.isPlayer === caster.isPlayer && getDistance(targetPos.x, targetPos.y, u.x, u.y) <= radius
      );
      for (const a of allies) {
        applyDamageToUnit(a, Math.round(90 * AOE_FRIENDLY_FIRE_FACTOR), caster, particles, floatingTexts, player, enemy);
      }
      for (let i = 0; i < 15; i++) {
        particles.push({
          id: `moon_${Math.random()}`,
          x: targetPos.x + (Math.random() - 0.5) * 60,
          y: targetPos.y + (Math.random() - 0.5) * 60,
          vx: 0,
          vy: -30,
          life: 0.5,
          maxLife: 0.5,
          color: '#67e8f9',
          size: 5,
        });
      }
      soundSystem.playSpellCast('nature');
      break;
    }

    case 'archdruid_natures_blessing': {
      const allies = units.filter(
        (u) => u.hp > 0 && u.isPlayer === caster.isPlayer && getDistance(caster.x, caster.y, u.x, u.y) <= (def.radius || 180)
      );
      for (const a of allies) {
        a.hp = Math.min(a.maxHp, a.hp + 80);
        a.buffs.push({
          id: `regen_spore_${Math.random()}`,
          name: 'Nature Regeneration',
          duration: 6,
          maxDuration: 6,
          type: 'nature_regen',
          regenHpPerSec: 5,
        });
      }
      soundSystem.playSpellCast('nature');
      break;
    }

    case 'archdruid_wrath_of_nature': {
      const treantDef = UNITS.summon_ancient_treant;
      units.push({
        id: `treant_sum_${Math.random()}`,
        defId: treantDef.id,
        name: treantDef.name,
        faction: 'elves',
        role: 'summon',
        isPlayer: caster.isPlayer,
        x: caster.x + 30,
        y: caster.y + 30,
        state: 'idle',
        behaviorMode: 'aggressive',
        hp: treantDef.hp,
        maxHp: treantDef.hp,
        attackDamage: treantDef.attackDamage,
        armor: treantDef.armor,
        range: treantDef.range,
        attackSpeed: treantDef.attackSpeed,
        attackCooldown: 0,
        moveSpeed: treantDef.moveSpeed,
        popCost: 0,
        radius: treantDef.radius,
        isSummon: true,
        decayTimer: 30,
        buffs: [],
        facingAngle: 0,
        walkCycle: 0,
        attackAnimTimer: 0,
        isHitFlash: 0,
      });
      soundSystem.playSpellCast('nature');
      break;
    }

    // ================= CASTER UNITS =================
    case 'battlemage_fireball': {
      const target = units.find((u) => u.id === targetEntityId && u.isPlayer !== caster.isPlayer && u.hp > 0);
      if (!target || getDistance(caster.x, caster.y, target.x, target.y) > def.range + 30) return false;
      applyDamageToUnit(target, 45, caster, particles, floatingTexts, player, enemy);
      soundSystem.playSpellCast('fire');
      break;
    }

    case 'priest_heal': {
      const target = units.find((u) => u.id === targetEntityId && u.isPlayer === caster.isPlayer && u.hp > 0);
      if (!target || getDistance(caster.x, caster.y, target.x, target.y) > def.range + 30) return false;
      target.hp = Math.min(target.maxHp, target.hp + 50);
      soundSystem.playSpellCast('holy');
      break;
    }

    case 'shaman_bloodsurge': {
      const target = units.find((u) => u.id === targetEntityId && u.isPlayer === caster.isPlayer && u.hp > 0);
      if (!target || getDistance(caster.x, caster.y, target.x, target.y) > def.range + 30) return false;
      target.buffs.push({
        id: `shaman_bs_${Math.random()}`,
        name: 'Bloodsurge',
        duration: 8,
        maxDuration: 8,
        type: 'bloodlust',
        speedMult: 1.25,
      });
      soundSystem.playSpellCast('fire');
      break;
    }

    case 'sorceress_frost_bolt': {
      const target = units.find((u) => u.id === targetEntityId && u.isPlayer !== caster.isPlayer && u.hp > 0);
      if (!target || getDistance(caster.x, caster.y, target.x, target.y) > def.range + 30) return false;
      applyDamageToUnit(target, 30, caster, particles, floatingTexts, player, enemy);
      target.buffs.push({
        id: `frost_chill_${Math.random()}`,
        name: 'Chilled',
        duration: 4,
        maxDuration: 4,
        type: 'speed_boost',
        speedMult: 0.6,
      });
      soundSystem.playSpellCast('nature');
      break;
    }

    default:
      return false;
  }

  // Set cooldown
  abState.currentCooldown = def.cooldown;
  return true;
}
