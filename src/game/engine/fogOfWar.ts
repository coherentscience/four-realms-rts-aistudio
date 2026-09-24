import { Building, GameMap, Unit } from '../types';

export class FogOfWar {
  public cellSize: number = 44;
  public cols: number;
  public rows: number;
  public explored: Uint8Array; // 0 = unvisited, 1 = explored
  public visible: Uint8Array;  // 0 = hidden, 1 = currently visible

  constructor(mapWidth: number, mapHeight: number) {
    this.cols = Math.ceil(mapWidth / this.cellSize);
    this.rows = Math.ceil(mapHeight / this.cellSize);
    this.explored = new Uint8Array(this.cols * this.rows);
    this.visible = new Uint8Array(this.cols * this.rows);
  }

  public update(playerUnits: Unit[], playerBuildings: Building[]) {
    this.visible.fill(0);

    // Reveal from player units
    for (const u of playerUnits) {
      if (u.hp <= 0) continue;
      const sight = u.role === 'hero' ? 260 : 220;
      this.revealCircle(u.x, u.y, sight);
    }

    // Reveal from player buildings
    for (const b of playerBuildings) {
      if (b.hp <= 0) continue;
      const sight = b.category === 'tower' ? 280 : 240;
      this.revealCircle(b.x + b.width / 2, b.y + b.height / 2, sight);
    }
  }

  private revealCircle(cx: number, cy: number, radius: number) {
    const minCol = Math.max(0, Math.floor((cx - radius) / this.cellSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((cx + radius) / this.cellSize));
    const minRow = Math.max(0, Math.floor((cy - radius) / this.cellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((cy + radius) / this.cellSize));
    const r2 = radius * radius;

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        const px = c * this.cellSize + this.cellSize * 0.5;
        const py = r * this.cellSize + this.cellSize * 0.5;
        const dx = px - cx;
        const dy = py - cy;
        if (dx * dx + dy * dy <= r2) {
          const idx = r * this.cols + c;
          this.visible[idx] = 1;
          this.explored[idx] = 1;
        }
      }
    }
  }

  public isVisible(x: number, y: number): boolean {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
    return this.visible[row * this.cols + col] === 1;
  }

  public isExplored(x: number, y: number): boolean {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
    return this.explored[row * this.cols + col] === 1;
  }
}
