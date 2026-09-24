import { FACTIONS } from '../config/factions';
import {
  Building,
  BuildingDef,
  Camera,
  Corpse,
  FloatingText,
  GameMap,
  GoldMine,
  Particle,
  PlayerData,
  Projectile,
  Unit,
  Vector2D,
} from '../types';
import { FogOfWar } from './fogOfWar';
import { isInsidePlayerBase } from './map';
import { drawUnitSilhouette } from './unitRenderer';

export class GameRenderer {
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  public render(
    units: Unit[],
    buildings: Building[],
    goldMines: GoldMine[],
    corpses: Corpse[],
    projectiles: Projectile[],
    particles: Particle[],
    floatingTexts: FloatingText[],
    map: GameMap,
    fog: FogOfWar,
    camera: Camera,
    selectedEntities: { units: Unit[]; building: Building | null },
    dragBox: { start: Vector2D; current: Vector2D } | null,
    placementGhost: { def: BuildingDef; pos: Vector2D; valid: boolean } | null,
    player: PlayerData
  ) {
    const ctx = this.ctx;
    const { width, height } = ctx.canvas;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Apply Camera transform
    ctx.translate(width / 2, height / 2);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.translate(-camera.x, -camera.y);

    // 1. Render Terrain
    this.renderTerrain(ctx, map);

    // 2. Render Gold Mines
    this.renderGoldMines(ctx, goldMines);

    // 3. Render Corpses
    this.renderCorpses(ctx, corpses, fog);

    // 4. Render Buildings
    this.renderBuildings(ctx, buildings, fog, selectedEntities.building);

    // 5. Render Units
    this.renderUnits(ctx, units, fog, selectedEntities.units);

    // 6. Render Projectiles
    this.renderProjectiles(ctx, projectiles);

    // 7. Render Particles
    this.renderParticles(ctx, particles);

    // 8. Render Floating Texts
    this.renderFloatingTexts(ctx, floatingTexts);

    // 9. Render Building Placement Ghost
    if (placementGhost) {
      this.renderPlacementGhost(ctx, placementGhost, map, buildings);
    }

    // 10. Render Fog of War
    this.renderFogOfWar(ctx, fog, map);

    // 11. Render Drag Selection Box
    if (dragBox) {
      this.renderDragBox(ctx, dragBox);
    }

    ctx.restore();
  }

  private renderTerrain(ctx: CanvasRenderingContext2D, map: GameMap) {
    // Base grass background
    ctx.fillStyle = '#1e291e';
    ctx.fillRect(0, 0, map.width, map.height);

    // Decorative grass patches
    ctx.fillStyle = '#243324';
    for (let x = 100; x < map.width; x += 180) {
      for (let y = 100; y < map.height; y += 180) {
        ctx.beginPath();
        ctx.arc(x + ((y * 7) % 60), y + ((x * 5) % 60), 45, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Dirt trail from player base to center and enemy base
    ctx.strokeStyle = '#3e3424';
    ctx.lineWidth = 55;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(map.playerStart.x, map.playerStart.y);
    ctx.quadraticCurveTo(map.width / 2, map.height / 2, map.enemyStart.x, map.enemyStart.y);
    ctx.stroke();

    // Base boundary circles (subtle paved plaza indicators)
    ctx.fillStyle = 'rgba(71, 85, 105, 0.18)';
    ctx.beginPath();
    ctx.arc(map.playerStart.x, map.playerStart.y, map.playerBaseRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.arc(map.enemyStart.x, map.enemyStart.y, map.enemyBaseRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Obstacles (Rocks & Cliffs)
    for (const obs of map.obstacles) {
      ctx.fillStyle = '#334155';
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

      // Rock highlights and 3D bevel
      ctx.fillStyle = '#475569';
      ctx.fillRect(obs.x + 3, obs.y + 3, obs.width - 6, obs.height * 0.4);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 3;
      ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
    }

    // Forests
    for (const f of map.forests) {
      // Canopy cluster
      ctx.fillStyle = 'rgba(12, 38, 20, 0.4)';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius + 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
      ctx.fill();

      // Tree tops
      ctx.fillStyle = '#166534';
      const treeCount = Math.floor(f.radius / 18);
      for (let i = 0; i < treeCount; i++) {
        const ang = (i / treeCount) * Math.PI * 2;
        const dist = f.radius * 0.55;
        ctx.beginPath();
        ctx.arc(f.x + Math.cos(ang) * dist, f.y + Math.sin(ang) * dist, 18, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private renderGoldMines(ctx: CanvasRenderingContext2D, mines: GoldMine[]) {
    for (const m of mines) {
      // Base rock
      ctx.fillStyle = '#292524';
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Glowing gold crystals
      ctx.fillStyle = '#fbbf24';
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + 0.3;
        ctx.beginPath();
        ctx.arc(m.x + Math.cos(ang) * (m.radius * 0.5), m.y + Math.sin(ang) * (m.radius * 0.5), 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Mine label
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 11px Plus Jakarta Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GOLD MINE', m.x, m.y + m.radius + 15);
    }
  }

  private renderCorpses(ctx: CanvasRenderingContext2D, corpses: Corpse[], fog: FogOfWar) {
    for (const c of corpses) {
      if (!fog.isExplored(c.x, c.y)) continue;
      // Crossbones / skull icon
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c.x - 7, c.y - 7);
      ctx.lineTo(c.x + 7, c.y + 7);
      ctx.moveTo(c.x + 7, c.y - 7);
      ctx.lineTo(c.x - 7, c.y + 7);
      ctx.stroke();

      // Spectral decay mist for Undead
      ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private renderBuildings(
    ctx: CanvasRenderingContext2D,
    buildings: Building[],
    fog: FogOfWar,
    selectedBuilding: Building | null
  ) {
    for (const b of buildings) {
      const centerX = b.x + b.width / 2;
      const centerY = b.y + b.height / 2;

      // Only draw if explored
      if (!fog.isExplored(centerX, centerY)) continue;

      const isVisible = fog.isVisible(centerX, centerY);
      // Enemy buildings hidden unless currently visible
      if (!b.isPlayer && !isVisible) continue;

      const factionData = FACTIONS[b.faction];
      const isSelected = selectedBuilding?.id === b.id;

      // Selection ring
      if (isSelected) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(b.x - 4, b.y - 4, b.width + 8, b.height + 8);
      }

      // Building footprint & walls
      ctx.fillStyle = b.isPlayer ? '#1e293b' : '#3f1818';
      ctx.fillRect(b.x, b.y, b.width, b.height);

      // Roof / faction ornament
      ctx.fillStyle = b.isConstructed ? factionData.colors.primary : '#475569';
      ctx.fillRect(b.x + 4, b.y + 4, b.width - 8, b.height * 0.4);

      // Accent border
      ctx.strokeStyle = factionData.colors.secondary;
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x, b.y, b.width, b.height);

      // Building Category Icon / Designator
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.name, centerX, centerY + 6);

      // Construction scaffolding overlay
      if (!b.isConstructed || b.constructionState === 'UNDER_CONSTRUCTION') {
        ctx.fillStyle = 'rgba(217, 119, 6, 0.35)';
        ctx.fillRect(b.x, b.y, b.width, b.height);

        // Progress bar
        const prog = b.constructionProgress ?? b.buildProgress ?? 0;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(b.x, b.y - 12, b.width, 6);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(b.x, b.y - 12, b.width * prog, 6);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(b.x, b.y - 12, b.width, 6);
      } else {
        // Health bar: show when damaged or selected
        const hpPercent = b.hp / b.maxHp;
        if (isSelected || hpPercent < 0.999) {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(b.x, b.y - 12, b.width, 6);
          ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.25 ? '#eab308' : '#ef4444';
          ctx.fillRect(b.x, b.y - 12, b.width * hpPercent, 6);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          ctx.strokeRect(b.x, b.y - 12, b.width, 6);
        }
      }

      // Rally point line if selected
      if (isSelected && b.rallyPoint) {
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(b.rallyPoint.x, b.rallyPoint.y);
        ctx.stroke();
        ctx.setLineDash([]);
        // Flag icon
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(b.rallyPoint.x, b.rallyPoint.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  private renderUnits(
    ctx: CanvasRenderingContext2D,
    units: Unit[],
    fog: FogOfWar,
    selectedUnits: Unit[]
  ) {
    for (const u of units) {
      if (u.hp <= 0) continue;

      // Hide enemy units if not currently visible
      if (!u.isPlayer && !fog.isVisible(u.x, u.y)) continue;

      const isSelected = selectedUnits.some((su) => su.id === u.id);
      const faction = FACTIONS[u.faction];

      // Selection ring
      if (isSelected) {
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(u.x, u.y + u.radius - 2, u.radius + 5, u.radius * 0.6 + 3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Unit Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.ellipse(u.x, u.y + u.radius, u.radius, u.radius * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Walking bounce
      const walkBob = u.state === 'moving' ? Math.sin(u.walkCycle) * 2 : 0;
      const uy = u.y + walkBob;

      // Render Distinct Unit Silhouette & Role Equipment
      ctx.save();
      ctx.translate(u.x, uy);

      const pColor = u.isPlayer ? faction.colors.primary : '#dc2626';
      drawUnitSilhouette(ctx, u, pColor, faction.colors.secondary);

      // Hero Crown / Ornament
      if (u.role === 'hero') {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.moveTo(-6, -u.radius - 3);
        ctx.lineTo(-3, -u.radius - 8);
        ctx.lineTo(0, -u.radius - 4);
        ctx.lineTo(3, -u.radius - 8);
        ctx.lineTo(6, -u.radius - 3);
        ctx.closePath();
        ctx.fill();
      }

      // Gatherer gold sack if carrying gold
      if (u.goldCarried && u.goldCarried > 0) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(0, -u.radius - 4, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Health bar
      const hpPercent = u.hp / u.maxHp;
      const barW = Math.max(22, u.radius * 2);
      const barH = 3.5;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(u.x - barW / 2, uy - u.radius - 8, barW, barH);
      ctx.fillStyle = u.isPlayer ? '#22c55e' : '#ef4444';
      ctx.fillRect(u.x - barW / 2, uy - u.radius - 8, barW * hpPercent, barH);

      // Hero Level badge
      if (u.role === 'hero' && u.level) {
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Lv.${u.level}`, u.x, uy - u.radius - 12);
      }
    }
  }

  private renderProjectiles(ctx: CanvasRenderingContext2D, projectiles: Projectile[]) {
    for (const p of projectiles) {
      ctx.save();
      ctx.translate(p.x, p.y);

      if (p.type === 'cannonball') {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f97316';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (p.type === 'fireball') {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(0, 0, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'holy') {
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'bone') {
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-4, -2, 8, 4);
      } else {
        // Arrow
        const ang = Math.atan2(p.targetY - p.startY, p.targetX - p.startX);
        ctx.rotate(ang);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(6, 0);
        ctx.stroke();
      }

      ctx.restore();
    }
  }

  private renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    for (const pt of particles) {
      const alpha = pt.life / pt.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]) {
    ctx.font = 'bold 12px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    for (const ft of texts) {
      const alpha = ft.life / ft.maxLife;
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  private renderPlacementGhost(
    ctx: CanvasRenderingContext2D,
    ghost: { def: BuildingDef; pos: Vector2D; valid: boolean },
    map: GameMap,
    buildings: Building[]
  ) {
    const { def, pos, valid } = ghost;
    const x = pos.x - def.width / 2;
    const y = pos.y - def.height / 2;

    ctx.save();
    ctx.fillStyle = valid ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.4)';
    ctx.fillRect(x, y, def.width, def.height);
    ctx.strokeStyle = valid ? '#22c55e' : '#ef4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, def.width, def.height);

    // If defensive tower: render attack range circle preview!
    if (def.canAttack && def.attackRange) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, def.attackRange, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderFogOfWar(ctx: CanvasRenderingContext2D, fog: FogOfWar, map: GameMap) {
    const cs = fog.cellSize;
    for (let r = 0; r < fog.rows; r++) {
      for (let c = 0; c < fog.cols; c++) {
        const idx = r * fog.cols + c;
        const explored = fog.explored[idx];
        const visible = fog.visible[idx];

        if (!explored) {
          // Deep pitch black
          ctx.fillStyle = '#07090e';
          ctx.fillRect(c * cs, r * cs, cs + 1, cs + 1);
        } else if (!visible) {
          // Shrouded semi-transparent
          ctx.fillStyle = 'rgba(7, 9, 14, 0.65)';
          ctx.fillRect(c * cs, r * cs, cs + 1, cs + 1);
        }
      }
    }
  }

  private renderDragBox(ctx: CanvasRenderingContext2D, dragBox: { start: Vector2D; current: Vector2D }) {
    const minX = Math.min(dragBox.start.x, dragBox.current.x);
    const minY = Math.min(dragBox.start.y, dragBox.current.y);
    const w = Math.abs(dragBox.current.x - dragBox.start.x);
    const h = Math.abs(dragBox.current.y - dragBox.start.y);

    ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
    ctx.fillRect(minX, minY, w, h);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(minX, minY, w, h);
  }

  // Minimap Rendering onto a separate offscreen or dedicated minimap canvas
  public renderMinimap(
    miniCtx: CanvasRenderingContext2D,
    map: GameMap,
    units: Unit[],
    buildings: Building[],
    goldMines: GoldMine[],
    fog: FogOfWar,
    camera: Camera
  ) {
    const mw = miniCtx.canvas.width;
    const mh = miniCtx.canvas.height;
    const scaleX = mw / map.width;
    const scaleY = mh / map.height;

    miniCtx.clearRect(0, 0, mw, mh);

    // Terrain background
    miniCtx.fillStyle = '#111827';
    miniCtx.fillRect(0, 0, mw, mh);

    // Base zones
    miniCtx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    miniCtx.beginPath();
    miniCtx.arc(map.playerStart.x * scaleX, map.playerStart.y * scaleY, map.playerBaseRadius * scaleX, 0, Math.PI * 2);
    miniCtx.fill();

    miniCtx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    miniCtx.beginPath();
    miniCtx.arc(map.enemyStart.x * scaleX, map.enemyStart.y * scaleY, map.enemyBaseRadius * scaleX, 0, Math.PI * 2);
    miniCtx.fill();

    // Gold Mines
    miniCtx.fillStyle = '#fbbf24';
    for (const gm of goldMines) {
      miniCtx.fillRect(gm.x * scaleX - 3, gm.y * scaleY - 3, 6, 6);
    }

    // Buildings
    for (const b of buildings) {
      if (b.hp <= 0) continue;
      if (!b.isPlayer && !fog.isVisible(b.x + b.width / 2, b.y + b.height / 2)) continue;
      miniCtx.fillStyle = b.isPlayer ? '#3b82f6' : '#ef4444';
      miniCtx.fillRect(b.x * scaleX, b.y * scaleY, Math.max(3, b.width * scaleX), Math.max(3, b.height * scaleY));
    }

    // Units
    for (const u of units) {
      if (u.hp <= 0) continue;
      if (!u.isPlayer && !fog.isVisible(u.x, u.y)) continue;
      miniCtx.fillStyle = u.isPlayer ? '#60a5fa' : '#f87171';
      miniCtx.fillRect(u.x * scaleX - 1.5, u.y * scaleY - 1.5, 3.5, 3.5);
    }

    // Fog on Minimap
    miniCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    const cs = fog.cellSize;
    for (let r = 0; r < fog.rows; r += 2) {
      for (let c = 0; c < fog.cols; c += 2) {
        if (!fog.explored[r * fog.cols + c]) {
          miniCtx.fillRect(c * cs * scaleX, r * cs * scaleY, cs * 2 * scaleX, cs * 2 * scaleY);
        }
      }
    }

    // Camera Viewport Box
    const viewW = (camera.viewportWidth / camera.zoom) * scaleX;
    const viewH = (camera.viewportHeight / camera.zoom) * scaleY;
    const viewX = (camera.x - (camera.viewportWidth / 2) / camera.zoom) * scaleX;
    const viewY = (camera.y - (camera.viewportHeight / 2) / camera.zoom) * scaleY;

    miniCtx.strokeStyle = '#ffffff';
    miniCtx.lineWidth = 1.5;
    miniCtx.strokeRect(viewX, viewY, viewW, viewH);
  }
}
