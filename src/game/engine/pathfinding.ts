import { Building, GameMap, Unit, Vector2D } from '../types';

export class NavigationGrid {
  private cellSize: number = 30;
  private cols: number;
  private rows: number;
  private grid: Uint8Array; // 0 = walkable, 1 = blocked

  constructor(mapWidth: number, mapHeight: number) {
    this.cols = Math.ceil(mapWidth / this.cellSize);
    this.rows = Math.ceil(mapHeight / this.cellSize);
    this.grid = new Uint8Array(this.cols * this.rows);
  }

  public rebuild(map: GameMap, buildings: Building[]) {
    this.grid.fill(0);

    // 1. Mark obstacles (rocks, cliffs)
    for (const obs of map.obstacles) {
      this.markBox(obs.x, obs.y, obs.width, obs.height);
    }

    // 2. Mark dense forest cores as impassable
    for (const forest of map.forests) {
      const coreR = forest.radius * 0.7;
      this.markCircle(forest.x, forest.y, coreR);
    }

    // 3. Mark buildings
    for (const b of buildings) {
      if (b.hp > 0) {
        this.markBox(b.x - 4, b.y - 4, b.width + 8, b.height + 8);
      }
    }
  }

  private markBox(x: number, y: number, w: number, h: number) {
    const minCol = Math.max(0, Math.floor(x / this.cellSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((x + w) / this.cellSize));
    const minRow = Math.max(0, Math.floor(y / this.cellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((y + h) / this.cellSize));

    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        this.grid[r * this.cols + c] = 1;
      }
    }
  }

  private markCircle(cx: number, cy: number, radius: number) {
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
          this.grid[r * this.cols + c] = 1;
        }
      }
    }
  }

  public isBlocked(x: number, y: number): boolean {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return true;
    return this.grid[row * this.cols + col] === 1;
  }

  public findPassableNeighbor(x: number, y: number, radius: number): Vector2D {
    if (!this.isBlocked(x, y)) return { x, y };
    for (let r = 20; r <= radius; r += 20) {
      for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        const nx = x + Math.cos(angle) * r;
        const ny = y + Math.sin(angle) * r;
        if (!this.isBlocked(nx, ny)) {
          return { x: nx, y: ny };
        }
      }
    }
    return { x, y };
  }
}

// Unit Separation & Movement Physics
export function applyUnitSeparationAndPhysics(
  units: Unit[],
  buildings: Building[],
  navGrid: NavigationGrid,
  dt: number,
  mapWidth: number,
  mapHeight: number
) {
  const activeUnits = units.filter((u) => u.hp > 0);

  // 1. Separation force between overlapping units
  for (let i = 0; i < activeUnits.length; i++) {
    const u1 = activeUnits[i];
    for (let j = i + 1; j < activeUnits.length; j++) {
      const u2 = activeUnits[j];
      const dx = u2.x - u1.x;
      const dy = u2.y - u1.y;
      const minDist = u1.radius + u2.radius;
      const distSq = dx * dx + dy * dy;

      if (distSq < minDist * minDist && distSq > 0.0001) {
        const dist = Math.sqrt(distSq);
        const overlap = (minDist - dist) * 0.5;
        const nx = dx / dist;
        const ny = dy / dist;

        // Push apart gently
        u1.x -= nx * overlap * 0.8;
        u1.y -= ny * overlap * 0.8;
        u2.x += nx * overlap * 0.8;
        u2.y += ny * overlap * 0.8;
      }
    }
  }

  // 2. Building collision check & boundary clamping
  for (const u of activeUnits) {
    // Avoid buildings
    for (const b of buildings) {
      if (b.hp <= 0) continue;
      // Closest point on building rectangle
      const closestX = Math.max(b.x, Math.min(u.x, b.x + b.width));
      const closestY = Math.max(b.y, Math.min(u.y, b.y + b.height));
      const dx = u.x - closestX;
      const dy = u.y - closestY;
      const distSq = dx * dx + dy * dy;

      if (distSq < u.radius * u.radius) {
        const dist = Math.sqrt(distSq) || 0.01;
        const pushX = (dx / dist) * (u.radius - dist);
        const pushY = (dy / dist) * (u.radius - dist);
        u.x += pushX;
        u.y += pushY;
      }
    }

    // Boundary constraints
    u.x = Math.max(u.radius + 10, Math.min(mapWidth - u.radius - 10, u.x));
    u.y = Math.max(u.radius + 10, Math.min(mapHeight - u.radius - 10, u.y));
  }
}
