import { GameMap, GoldMine, Vector2D } from '../types';

export const MAP_WIDTH = 2200;
export const MAP_HEIGHT = 2200;

export function createGameMap(): {
  map: GameMap;
  goldMines: GoldMine[];
} {
  const playerStart: Vector2D = { x: 380, y: 1820 };
  const enemyStart: Vector2D = { x: 1820, y: 380 };

  // Starting gold mines at exact equal distance (190px) from Main Halls
  // Plus two secondary contested mines
  const goldMines: GoldMine[] = [
    {
      id: 'mine_player_start',
      x: playerStart.x + 140,
      y: playerStart.y - 140,
      radius: 36,
      maxMiners: 5,
      currentMiners: [],
    },
    {
      id: 'mine_enemy_start',
      x: enemyStart.x - 140,
      y: enemyStart.y + 140,
      radius: 36,
      maxMiners: 5,
      currentMiners: [],
    },
    // Contested expansions
    {
      id: 'mine_expansion_northwest',
      x: 480,
      y: 520,
      radius: 36,
      maxMiners: 5,
      currentMiners: [],
    },
    {
      id: 'mine_expansion_southeast',
      x: 1720,
      y: 1680,
      radius: 36,
      maxMiners: 5,
      currentMiners: [],
    },
  ];

  // Symmetrical obstacles (rocks and cliffs) creating chokepoints and natural lanes
  const obstacles: GameMap['obstacles'] = [
    // Center rock clusters forming 3 strategic lanes (North-West path, Center crossing, South-East path)
    { x: 920, y: 880, width: 140, height: 120, type: 'rock' },
    { x: 1140, y: 1200, width: 140, height: 120, type: 'rock' },

    // Left ridge
    { x: 300, y: 1000, width: 180, height: 100, type: 'cliff' },
    { x: 720, y: 1350, width: 120, height: 140, type: 'rock' },

    // Right ridge (symmetrical counterpart)
    { x: 1720, y: 1100, width: 180, height: 100, type: 'cliff' },
    { x: 1360, y: 710, width: 120, height: 140, type: 'rock' },

    // Expansion guards
    { x: 620, y: 440, width: 90, height: 90, type: 'rock' },
    { x: 1490, y: 1670, width: 90, height: 90, type: 'rock' },
  ];

  // Forest clusters (provide scenery, block movement, and trigger Elven Forest Blessing)
  const forests: GameMap['forests'] = [
    // Near player base perimeter
    { x: 180, y: 1600, radius: 100 },
    { x: 550, y: 2050, radius: 110 },
    { x: 160, y: 2000, radius: 80 },

    // Near enemy base perimeter
    { x: 2020, y: 600, radius: 100 },
    { x: 1650, y: 150, radius: 110 },
    { x: 2040, y: 200, radius: 80 },

    // Midfield groves
    { x: 760, y: 860, radius: 120 },
    { x: 1440, y: 1340, radius: 120 },
    { x: 1100, y: 600, radius: 100 },
    { x: 1100, y: 1600, radius: 100 },

    // Neutral expansion woods
    { x: 360, y: 380, radius: 90 },
    { x: 1840, y: 1820, radius: 90 },
  ];

  const map: GameMap = {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    tileSize: 40,
    cols: Math.floor(MAP_WIDTH / 40),
    rows: Math.floor(MAP_HEIGHT / 40),
    playerStart,
    enemyStart,
    playerBaseRadius: 360,
    enemyBaseRadius: 360,
    obstacles,
    forests,
  };

  return { map, goldMines };
}

export function isInsidePlayerBase(pos: Vector2D, map: GameMap): boolean {
  const dx = pos.x - map.playerStart.x;
  const dy = pos.y - map.playerStart.y;
  return dx * dx + dy * dy <= map.playerBaseRadius * map.playerBaseRadius;
}

export function isInsideEnemyBase(pos: Vector2D, map: GameMap): boolean {
  const dx = pos.x - map.enemyStart.x;
  const dy = pos.y - map.enemyStart.y;
  return dx * dx + dy * dy <= map.enemyBaseRadius * map.enemyBaseRadius;
}

export function isNearForest(pos: Vector2D, forests: GameMap['forests'], extraDist: number = 60): boolean {
  for (const forest of forests) {
    const dx = pos.x - forest.x;
    const dy = pos.y - forest.y;
    const maxD = forest.radius + extraDist;
    if (dx * dx + dy * dy <= maxD * maxD) {
      return true;
    }
  }
  return false;
}
