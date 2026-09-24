import { BUILDINGS } from '../config/buildings';
import { UNITS } from '../config/units';
import {
  Building,
  BuildingDef,
  Camera,
  Corpse,
  FactionId,
  FloatingText,
  GameMap,
  GoldMine,
  Particle,
  PlayerData,
  Projectile,
  Unit,
  Vector2D,
} from '../types';
import { castAbility } from './abilities';
import { AIController } from './ai';
import { soundSystem } from './audio';
import { getDistance, updateCombat } from './combat';
import { queueTierUpgrade, queueUnitProduction, queueUpgradeResearch, updateEconomyAndProduction } from './economy';
import { FogOfWar } from './fogOfWar';
import { createGameMap, isInsidePlayerBase } from './map';
import { applyUnitSeparationAndPhysics, NavigationGrid } from './pathfinding';
import { GameRenderer } from './renderer';

export interface GameCallbacks {
  onStateChange: () => void;
  onGameOver: (victory: boolean, stats: PlayerData['stats'], matchDuration: number) => void;
}

export class GameManager {
  public map: GameMap;
  public goldMines: GoldMine[];
  public units: Unit[] = [];
  public buildings: Building[] = [];
  public corpses: Corpse[] = [];
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];

  public player: PlayerData;
  public enemy: PlayerData;

  public camera: Camera;
  public fog: FogOfWar;
  public navGrid: NavigationGrid;
  public ai: AIController;

  public selectedUnits: Unit[] = [];
  public selectedBuilding: Building | null = null;
  public dragBox: { start: Vector2D; current: Vector2D } | null = null;
  public placementGhost: { def: BuildingDef; pos: Vector2D; valid: boolean } | null = null;
  public isAttackMoveMode: boolean = false;

  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private lastTime: number = 0;
  private matchTime: number = 0;
  private callbacks: GameCallbacks;

  public isDebugMode: boolean = false;
  public fps: number = 60;
  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  private lastBuildingCount: number = 0;

  constructor(playerFaction: FactionId, enemyFaction: FactionId, callbacks: GameCallbacks) {
    this.callbacks = callbacks;
    const { map, goldMines } = createGameMap();
    this.map = map;
    this.goldMines = goldMines;

    this.player = {
      faction: playerFaction,
      gold: 500,
      population: 0,
      maxPopulation: 50,
      techTier: 1,
      upgrades: { weapons: 0, armor: 0, training: 0 },
      stats: {
        goldCollected: 500,
        unitsCreated: 0,
        unitsLost: 0,
        enemiesDefeated: 0,
        buildingsDestroyed: 0,
        heroMaxLevel: 0,
      },
    };

    this.enemy = {
      faction: enemyFaction,
      gold: 500,
      population: 0,
      maxPopulation: 50,
      techTier: 1,
      upgrades: { weapons: 0, armor: 0, training: 0 },
      stats: {
        goldCollected: 500,
        unitsCreated: 0,
        unitsLost: 0,
        enemiesDefeated: 0,
        buildingsDestroyed: 0,
        heroMaxLevel: 0,
      },
    };

    this.camera = {
      x: map.playerStart.x,
      y: map.playerStart.y,
      zoom: 1.0,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };

    this.fog = new FogOfWar(map.width, map.height);
    this.navGrid = new NavigationGrid(map.width, map.height);
    this.ai = new AIController(map);

    this.initStartingEntities(playerFaction, enemyFaction);
    this.navGrid.rebuild(this.map, this.buildings);
    this.fog.update(
      this.units.filter((u) => u.isPlayer),
      this.buildings.filter((b) => b.isPlayer)
    );
  }

  private initStartingEntities(playerFaction: FactionId, enemyFaction: FactionId) {
    // 1. Player Main Hall
    const playerHallDef = Object.values(BUILDINGS).find(
      (b) => b.faction === playerFaction && b.category === 'main_hall'
    )!;
    const playerHall: Building = {
      id: `b_player_main_hall`,
      defId: playerHallDef.id,
      name: playerHallDef.name,
      category: 'main_hall',
      faction: playerFaction,
      isPlayer: true,
      x: this.map.playerStart.x - playerHallDef.width / 2,
      y: this.map.playerStart.y - playerHallDef.height / 2,
      width: playerHallDef.width,
      height: playerHallDef.height,
      hp: 2000,
      maxHp: 2000,
      constructionState: 'COMPLETED',
      constructionProgress: 1,
      constructionTime: 0,
      isConstructed: true,
      buildProgress: 1,
      buildTime: 0,
      queue: [],
      hitFlash: 0,
      attackCooldown: 0,
    };
    this.buildings.push(playerHall);

    // 2. Player Starting Gatherers (3 units)
    const playerGathererDef = Object.values(UNITS).find(
      (u) => u.faction === playerFaction && u.role === 'gatherer'
    )!;
    for (let i = 0; i < 3; i++) {
      const u: Unit = {
        id: `u_player_worker_${i}`,
        defId: playerGathererDef.id,
        name: playerGathererDef.name,
        faction: playerFaction,
        role: 'gatherer',
        isPlayer: true,
        x: this.map.playerStart.x + (i - 1) * 35,
        y: this.map.playerStart.y + 70,
        state: 'idle',
        behaviorMode: 'defensive',
        hp: playerGathererDef.hp,
        maxHp: playerGathererDef.hp,
        attackDamage: playerGathererDef.attackDamage,
        armor: playerGathererDef.armor,
        range: playerGathererDef.range,
        attackSpeed: playerGathererDef.attackSpeed,
        attackCooldown: 0,
        moveSpeed: playerGathererDef.moveSpeed,
        popCost: 1,
        radius: playerGathererDef.radius,
        buffs: [],
        facingAngle: -Math.PI / 2,
        walkCycle: 0,
        attackAnimTimer: 0,
        isHitFlash: 0,
      };
      this.units.push(u);
      this.player.population += 1;
      this.player.stats.unitsCreated += 1;
    }

    // 3. Enemy Main Hall
    const enemyHallDef = Object.values(BUILDINGS).find(
      (b) => b.faction === enemyFaction && b.category === 'main_hall'
    )!;
    const enemyHall: Building = {
      id: `b_enemy_main_hall`,
      defId: enemyHallDef.id,
      name: enemyHallDef.name,
      category: 'main_hall',
      faction: enemyFaction,
      isPlayer: false,
      x: this.map.enemyStart.x - enemyHallDef.width / 2,
      y: this.map.enemyStart.y - enemyHallDef.height / 2,
      width: enemyHallDef.width,
      height: enemyHallDef.height,
      hp: 2000,
      maxHp: 2000,
      constructionState: 'COMPLETED',
      constructionProgress: 1,
      constructionTime: 0,
      isConstructed: true,
      buildProgress: 1,
      buildTime: 0,
      queue: [],
      hitFlash: 0,
      attackCooldown: 0,
    };
    this.buildings.push(enemyHall);

    // 4. Enemy Starting Gatherers (3 units)
    const enemyGathererDef = Object.values(UNITS).find(
      (u) => u.faction === enemyFaction && u.role === 'gatherer'
    )!;
    for (let i = 0; i < 3; i++) {
      const u: Unit = {
        id: `u_enemy_worker_${i}`,
        defId: enemyGathererDef.id,
        name: enemyGathererDef.name,
        faction: enemyFaction,
        role: 'gatherer',
        isPlayer: false,
        x: this.map.enemyStart.x + (i - 1) * 35,
        y: this.map.enemyStart.y - 70,
        state: 'idle',
        behaviorMode: 'defensive',
        hp: enemyGathererDef.hp,
        maxHp: enemyGathererDef.hp,
        attackDamage: enemyGathererDef.attackDamage,
        armor: enemyGathererDef.armor,
        range: enemyGathererDef.range,
        attackSpeed: enemyGathererDef.attackSpeed,
        attackCooldown: 0,
        moveSpeed: enemyGathererDef.moveSpeed,
        popCost: 1,
        radius: enemyGathererDef.radius,
        buffs: [],
        facingAngle: Math.PI / 2,
        walkCycle: 0,
        attackAnimTimer: 0,
        isHitFlash: 0,
      };
      this.units.push(u);
      this.enemy.population += 1;
      this.enemy.stats.unitsCreated += 1;
    }
  }

  public start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.lastFpsTime = performance.now();
    soundSystem.startMusic(this.player.faction);
    this.loop();
  }

  public stop() {
    this.isRunning = false;
    soundSystem.stopMusic();
  }

  public setPaused(p: boolean) {
    this.isPaused = p;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public getMatchDuration(): number {
    return Math.floor(this.matchTime);
  }

  private loop = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    const dt = Math.min(0.1, (now - this.lastTime) / 1000);
    this.lastTime = now;

    // Calculate FPS
    this.frameCount++;
    if (now - this.lastFpsTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    if (!this.isPaused) {
      this.update(dt);
    }

    requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.matchTime += dt;

    // 1. Update Economy, Mining, and Production Queues
    updateEconomyAndProduction(
      this.units,
      this.buildings,
      this.goldMines,
      this.player,
      this.enemy,
      dt,
      this.particles
    );

    // 2. Unit Physics, Separation, and Boundary collision
    applyUnitSeparationAndPhysics(
      this.units,
      this.buildings,
      this.navGrid,
      dt,
      this.map.width,
      this.map.height
    );

    // 3. Combat, Attacks, Projectiles, Death & Corpses
    updateCombat(
      this.units,
      this.buildings,
      this.projectiles,
      this.particles,
      this.floatingTexts,
      this.corpses,
      this.player,
      this.enemy,
      this.map,
      dt
    );

    // 4. Update Particle lifespans
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // 5. Update Floating Text lifespans
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y += ft.vy * dt;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    // 6. Update AI
    this.ai.update(
      dt,
      this.units,
      this.buildings,
      this.goldMines,
      this.corpses,
      this.particles,
      this.floatingTexts,
      this.enemy,
      this.player,
      this.map
    );

    // 7. Update Fog of War
    if (!this.isDebugMode) {
      this.fog.update(
        this.units.filter((u) => u.isPlayer),
        this.buildings.filter((b) => b.isPlayer)
      );
    } else {
      // In debug mode, reveal all
      this.fog.visible.fill(1);
      this.fog.explored.fill(1);
    }

    // 8. Re-evaluate clean selections & navGrid if buildings changed
    this.selectedUnits = this.selectedUnits.filter((u) => u.hp > 0);
    if (this.selectedBuilding && this.selectedBuilding.hp <= 0) {
      this.selectedBuilding = null;
    }
    if (this.buildings.length !== this.lastBuildingCount) {
      this.lastBuildingCount = this.buildings.length;
      this.navGrid.rebuild(this.map, this.buildings);
    }

    // 9. Check Victory / Defeat Conditions (Main Hall destroyed)
    const playerHall = this.buildings.find((b) => b.isPlayer && b.category === 'main_hall');
    const enemyHall = this.buildings.find((b) => !b.isPlayer && b.category === 'main_hall');

    if (!playerHall || playerHall.hp <= 0) {
      this.stop();
      soundSystem.playDefeat();
      this.callbacks.onGameOver(false, this.player.stats, this.getMatchDuration());
      return;
    }

    if (!enemyHall || enemyHall.hp <= 0) {
      this.stop();
      soundSystem.playVictory();
      this.callbacks.onGameOver(true, this.player.stats, this.getMatchDuration());
      return;
    }

    this.callbacks.onStateChange();
  }

  // ================= INPUT & COMMANDS =================

  public screenToWorld(screenX: number, screenY: number): Vector2D {
    const wx = (screenX - this.camera.viewportWidth / 2) / this.camera.zoom + this.camera.x;
    const wy = (screenY - this.camera.viewportHeight / 2) / this.camera.zoom + this.camera.y;
    return { x: wx, y: wy };
  }

  public handleLeftClick(screenX: number, screenY: number) {
    const worldPos = this.screenToWorld(screenX, screenY);

    // If placing a building
    if (this.placementGhost) {
      if (this.placementGhost.valid) {
        this.commitBuildingPlacement(this.placementGhost.def, this.placementGhost.pos);
      }
      this.placementGhost = null;
      return;
    }

    // If attack-move mode active
    if (this.isAttackMoveMode && this.selectedUnits.length > 0) {
      this.issueAttackMove(worldPos);
      this.isAttackMoveMode = false;
      return;
    }

    // Check click on units
    const clickedUnit = this.units.find(
      (u) => u.hp > 0 && getDistance(worldPos.x, worldPos.y, u.x, u.y) <= u.radius + 6
    );

    if (clickedUnit) {
      if (clickedUnit.isPlayer) {
        this.selectedUnits = [clickedUnit];
        this.selectedBuilding = null;
        soundSystem.playSelectUnit(clickedUnit.faction);
      } else if (this.fog.isVisible(clickedUnit.x, clickedUnit.y)) {
        // Inspect enemy unit
        this.selectedUnits = [clickedUnit];
        this.selectedBuilding = null;
      }
      return;
    }

    // Check click on buildings
    const clickedBuilding = this.buildings.find(
      (b) =>
        b.hp > 0 &&
        worldPos.x >= b.x &&
        worldPos.x <= b.x + b.width &&
        worldPos.y >= b.y &&
        worldPos.y <= b.y + b.height
    );

    if (clickedBuilding) {
      if (clickedBuilding.isPlayer || this.fog.isVisible(clickedBuilding.x + clickedBuilding.width / 2, clickedBuilding.y + clickedBuilding.height / 2)) {
        this.selectedBuilding = clickedBuilding;
        this.selectedUnits = [];
        soundSystem.playSelectUnit(clickedBuilding.faction);
      }
      return;
    }

    // Clicked empty ground: clear selection
    this.selectedUnits = [];
    this.selectedBuilding = null;
  }

  public handleBoxSelect(startScreen: Vector2D, currentScreen: Vector2D) {
    const p1 = this.screenToWorld(startScreen.x, startScreen.y);
    const p2 = this.screenToWorld(currentScreen.x, currentScreen.y);

    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);

    // Only box select friendly units
    const boxed = this.units.filter(
      (u) => u.hp > 0 && u.isPlayer && u.x >= minX && u.x <= maxX && u.y >= minY && u.y <= maxY
    );

    if (boxed.length > 0) {
      this.selectedUnits = boxed;
      this.selectedBuilding = null;
      soundSystem.playSelectUnit(this.player.faction);
    }
  }

  public handleRightClick(screenX: number, screenY: number) {
    const worldPos = this.screenToWorld(screenX, screenY);

    // Cancel ghost placement on right click
    if (this.placementGhost) {
      this.placementGhost = null;
      return;
    }

    // If a building is selected: set rally point!
    if (this.selectedBuilding && this.selectedBuilding.isPlayer) {
      this.selectedBuilding.rallyPoint = { x: worldPos.x, y: worldPos.y };
      soundSystem.playCommandMove();
      return;
    }

    if (this.selectedUnits.length === 0) return;

    // Check if clicked an enemy unit
    const targetEnemyUnit = this.units.find(
      (u) =>
        u.hp > 0 &&
        !u.isPlayer &&
        this.fog.isVisible(u.x, u.y) &&
        getDistance(worldPos.x, worldPos.y, u.x, u.y) <= u.radius + 10
    );

    if (targetEnemyUnit) {
      for (const u of this.selectedUnits) {
        if (!u.isPlayer) continue;
        u.targetEntityId = targetEnemyUnit.id;
        u.targetEntityType = 'unit';
        u.targetX = undefined;
        u.targetY = undefined;
        u.state = 'moving';
      }
      soundSystem.playCommandAttack();
      return;
    }

    // Check if clicked an enemy building
    const targetEnemyBuilding = this.buildings.find(
      (b) =>
        b.hp > 0 &&
        !b.isPlayer &&
        (this.fog.isVisible(b.x + b.width / 2, b.y + b.height / 2) || this.isDebugMode) &&
        worldPos.x >= b.x - 8 &&
        worldPos.x <= b.x + b.width + 8 &&
        worldPos.y >= b.y - 8 &&
        worldPos.y <= b.y + b.height + 8
    );

    if (targetEnemyBuilding) {
      for (const u of this.selectedUnits) {
        if (!u.isPlayer) continue;
        u.targetEntityId = targetEnemyBuilding.id;
        u.targetEntityType = 'building';
        u.targetX = undefined;
        u.targetY = undefined;
        u.state = 'moving';
        u.behaviorMode = 'aggressive';
      }
      soundSystem.playCommandAttack();
      return;
    }

    // Check if clicked a friendly building (Construction or Repair)
    const targetFriendlyBuilding = this.buildings.find(
      (b) =>
        b.hp > 0 &&
        b.isPlayer &&
        worldPos.x >= b.x - 8 &&
        worldPos.x <= b.x + b.width + 8 &&
        worldPos.y >= b.y - 8 &&
        worldPos.y <= b.y + b.height + 8
    );

    if (targetFriendlyBuilding) {
      const needsConstruction = !targetFriendlyBuilding.isConstructed || targetFriendlyBuilding.constructionState !== 'COMPLETED';
      const needsRepair = targetFriendlyBuilding.isConstructed && targetFriendlyBuilding.hp < targetFriendlyBuilding.maxHp;

      for (const u of this.selectedUnits) {
        if (!u.isPlayer) continue;
        if (u.role === 'gatherer') {
          if (needsConstruction) {
            u.targetBuildingId = targetFriendlyBuilding.id;
            u.state = 'building';
            u.targetEntityId = undefined;
            u.targetMineId = undefined;
          } else if (needsRepair) {
            u.targetBuildingId = targetFriendlyBuilding.id;
            u.state = 'repairing';
            u.targetEntityId = undefined;
            u.targetMineId = undefined;
          } else {
            // Already full health and completed: move near
            u.targetX = targetFriendlyBuilding.x + targetFriendlyBuilding.width / 2;
            u.targetY = targetFriendlyBuilding.y + targetFriendlyBuilding.height / 2;
            u.state = 'moving';
          }
        } else {
          u.targetX = targetFriendlyBuilding.x + targetFriendlyBuilding.width / 2;
          u.targetY = targetFriendlyBuilding.y + targetFriendlyBuilding.height / 2;
          u.state = 'moving';
        }
      }
      soundSystem.playCommandMove();
      return;
    }

    // Check if clicked a gold mine with workers
    const clickedMine = this.goldMines.find(
      (m) => getDistance(worldPos.x, worldPos.y, m.x, m.y) <= m.radius + 10
    );

    if (clickedMine) {
      for (const u of this.selectedUnits) {
        if (!u.isPlayer) continue;
        if (u.role === 'gatherer') {
          u.targetMineId = clickedMine.id;
          u.state = 'gathering';
          u.targetEntityId = undefined;
          u.targetX = undefined;
          u.targetY = undefined;
        } else {
          // Non-workers just move near the mine
          u.targetX = worldPos.x;
          u.targetY = worldPos.y;
          u.state = 'moving';
        }
      }
      soundSystem.playCommandMove();
      return;
    }

    // Move command to ground position in formation
    const numUnits = this.selectedUnits.length;
    const cols = Math.ceil(Math.sqrt(numUnits));

    this.selectedUnits.forEach((u, idx) => {
      if (!u.isPlayer) return;
      const row = Math.floor(idx / cols);
      const col = idx % cols;
      const offsetX = (col - cols / 2) * 28;
      const offsetY = (row - cols / 2) * 28;

      u.targetX = Math.max(u.radius, Math.min(this.map.width - u.radius, worldPos.x + offsetX));
      u.targetY = Math.max(u.radius, Math.min(this.map.height - u.radius, worldPos.y + offsetY));
      u.targetEntityId = undefined;
      u.targetMineId = undefined;
      u.state = 'moving';
    });

    soundSystem.playCommandMove();
  }

  public issueAttackMove(worldPos: Vector2D) {
    // Check if directly targeted an enemy building or unit
    const targetEnemyBuilding = this.buildings.find(
      (b) =>
        b.hp > 0 &&
        !b.isPlayer &&
        worldPos.x >= b.x - 8 &&
        worldPos.x <= b.x + b.width + 8 &&
        worldPos.y >= b.y - 8 &&
        worldPos.y <= b.y + b.height + 8
    );

    const targetEnemyUnit = this.units.find(
      (u) => u.hp > 0 && !u.isPlayer && getDistance(worldPos.x, worldPos.y, u.x, u.y) <= u.radius + 8
    );

    for (const u of this.selectedUnits) {
      if (!u.isPlayer) continue;
      if (targetEnemyUnit) {
        u.targetEntityId = targetEnemyUnit.id;
        u.targetEntityType = 'unit';
        u.state = 'moving';
        u.behaviorMode = 'aggressive';
      } else if (targetEnemyBuilding) {
        u.targetEntityId = targetEnemyBuilding.id;
        u.targetEntityType = 'building';
        u.state = 'moving';
        u.behaviorMode = 'aggressive';
      } else {
        u.targetX = worldPos.x;
        u.targetY = worldPos.y;
        u.targetEntityId = undefined;
        u.state = 'moving';
        u.behaviorMode = 'aggressive';
      }
    }
    soundSystem.playCommandAttack();
  }

  public issueStop() {
    for (const u of this.selectedUnits) {
      if (!u.isPlayer) continue;
      u.state = 'idle';
      u.targetX = undefined;
      u.targetY = undefined;
      u.targetEntityId = undefined;
    }
  }

  public issueHold() {
    for (const u of this.selectedUnits) {
      if (!u.isPlayer) continue;
      u.state = 'hold';
      u.behaviorMode = 'hold';
      u.targetX = undefined;
      u.targetY = undefined;
    }
  }

  public setGhostPlacement(buildingDefId: string) {
    const def = BUILDINGS[buildingDefId];
    if (!def) return;
    this.placementGhost = {
      def,
      pos: { x: this.camera.x, y: this.camera.y },
      valid: false,
    };
  }

  public updateGhostPos(screenX: number, screenY: number) {
    if (!this.placementGhost) return;
    const worldPos = this.screenToWorld(screenX, screenY);
    this.placementGhost.pos = worldPos;

    // Validate placement:
    // 1. Must be inside player base
    const insideBase = isInsidePlayerBase(worldPos, this.map);
    // 2. Must not overlap with obstacles or other buildings
    const gx = worldPos.x - this.placementGhost.def.width / 2;
    const gy = worldPos.y - this.placementGhost.def.height / 2;
    const gw = this.placementGhost.def.width;
    const gh = this.placementGhost.def.height;

    const overlapsBuilding = this.buildings.some(
      (b) =>
        b.hp > 0 &&
        gx < b.x + b.width &&
        gx + gw > b.x &&
        gy < b.y + b.height &&
        gy + gh > b.y
    );

    const overlapsMine = this.goldMines.some(
      (m) => getDistance(worldPos.x, worldPos.y, m.x, m.y) <= m.radius + 35
    );

    const overlapsObstacle = this.map.obstacles.some(
      (obs) =>
        gx < obs.x + obs.width &&
        gx + gw > obs.x &&
        gy < obs.y + obs.height &&
        gy + gh > obs.y
    );

    this.placementGhost.valid = insideBase && !overlapsBuilding && !overlapsMine && !overlapsObstacle;
  }

  public commitBuildingPlacement(def: BuildingDef, pos: Vector2D) {
    if (this.player.gold < def.goldCost) return;

    this.player.gold -= def.goldCost;
    const newBuilding: Building = {
      id: `b_${def.id}_${Math.random()}`,
      defId: def.id,
      name: def.name,
      category: def.category,
      faction: this.player.faction,
      isPlayer: true,
      x: pos.x - def.width / 2,
      y: pos.y - def.height / 2,
      width: def.width,
      height: def.height,
      hp: 10,
      maxHp: def.hp,
      constructionState: 'UNDER_CONSTRUCTION',
      constructionProgress: 0.05,
      constructionTime: def.buildTime,
      isConstructed: false,
      buildProgress: 0.05,
      buildTime: def.buildTime,
      queue: [],
      canAttack: def.canAttack,
      attackDamage: def.attackDamage,
      attackRange: def.attackRange,
      attackSpeed: def.attackSpeed,
      attackCooldown: 0,
      hitFlash: 0,
    };

    this.buildings.push(newBuilding);
    this.navGrid.rebuild(this.map, this.buildings);

    // Send selected worker (if any) or nearest available worker to construct!
    const availableWorkers = this.units.filter((u) => u.hp > 0 && u.isPlayer && u.role === 'gatherer');
    if (availableWorkers.length > 0) {
      // Find closest worker
      availableWorkers.sort((a, b) => getDistance(a.x, a.y, pos.x, pos.y) - getDistance(b.x, b.y, pos.x, pos.y));
      const chosen = availableWorkers[0];
      chosen.state = 'building';
      chosen.targetBuildingId = newBuilding.id;
    }

    soundSystem.playCommandMove();
  }

  public castHeroAbility(abilityIndex: number) {
    const hero = this.units.find((u) => u.hp > 0 && u.isPlayer && u.role === 'hero');
    if (!hero || !hero.abilities || !hero.abilities[abilityIndex]) return;

    const abState = hero.abilities[abilityIndex];
    castAbility(
      hero,
      abState.defId,
      { x: hero.x, y: hero.y },
      null,
      this.units,
      this.buildings,
      this.corpses,
      this.particles,
      this.floatingTexts,
      this.player,
      this.enemy
    );
  }

  public trainUnit(building: Building, unitId: string) {
    if (queueUnitProduction(building, unitId, this.player)) {
      soundSystem.playCommandMove();
      this.callbacks.onStateChange();
    }
  }

  public researchUpgrade(building: Building, upgradeId: string) {
    if (queueUpgradeResearch(building, upgradeId, this.player)) {
      soundSystem.playCommandMove();
      this.callbacks.onStateChange();
    }
  }

  public advanceTier(building: Building, tierId: 'tier_2' | 'tier_3') {
    if (queueTierUpgrade(building, tierId, this.player)) {
      soundSystem.playCommandMove();
      this.callbacks.onStateChange();
    }
  }

  public renderMinimapTo(miniCtx: CanvasRenderingContext2D) {
    const renderer = new GameRenderer(miniCtx);
    renderer.renderMinimap(
      miniCtx,
      this.map,
      this.units,
      this.buildings,
      this.goldMines,
      this.fog,
      this.camera
    );
  }

  // Camera Pan & Zoom
  public panCamera(dx: number, dy: number) {
    this.camera.x += dx / this.camera.zoom;
    this.camera.y += dy / this.camera.zoom;

    // Clamping camera within map bounds
    const halfW = (this.camera.viewportWidth / 2) / this.camera.zoom;
    const halfH = (this.camera.viewportHeight / 2) / this.camera.zoom;
    this.camera.x = Math.max(halfW, Math.min(this.map.width - halfW, this.camera.x));
    this.camera.y = Math.max(halfH, Math.min(this.map.height - halfH, this.camera.y));
  }

  public zoomCamera(delta: number) {
    const newZoom = Math.max(0.65, Math.min(1.4, this.camera.zoom - delta * 0.0012));
    this.camera.zoom = newZoom;
  }

  public centerCameraOn(worldX: number, worldY: number) {
    this.camera.x = worldX;
    this.camera.y = worldY;
  }
}
