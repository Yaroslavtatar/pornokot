import { ChunkData, TileType, TileProp } from './types';

export const CHUNK_SIZE = 16; // 16x16 tiles per chunk
export const TILE_SIZE = 16; // 16x16 px per tile (256x256 px per chunk)

// Hash PRNG based on seed & coordinates
export function hashPRNG(seed: number, x: number, y: number): number {
  let n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43758.5453) * 43758.5453;
  return n - Math.floor(n);
}

// Multi-scale 2D noise for smooth biomes across chunk boundaries
export function smoothNoise(seed: number, x: number, y: number, scale = 10): number {
  const sx = x / scale;
  const sy = y / scale;
  const x0 = Math.floor(sx);
  const x1 = x0 + 1;
  const y0 = Math.floor(sy);
  const y1 = y0 + 1;

  const dx = sx - x0;
  const dy = sy - y0;

  const n00 = hashPRNG(seed, x0, y0);
  const n10 = hashPRNG(seed, x1, y0);
  const n01 = hashPRNG(seed, x0, y1);
  const n11 = hashPRNG(seed, x1, y1);

  const nx0 = n00 * (1 - dx) + n10 * dx;
  const nx1 = n01 * (1 - dx) + n11 * dx;

  return nx0 * (1 - dy) + nx1 * dy;
}

// Generate a coherent chunk deterministically for coordinate (cx, cy)
export function generateChunk(seed: number, cx: number, cy: number): ChunkData {
  const tiles: TileType[][] = Array.from({ length: CHUNK_SIZE }, () => Array(CHUNK_SIZE).fill('grass'));
  const noiseVariations: number[][] = Array.from({ length: CHUNK_SIZE }, () => Array(CHUNK_SIZE).fill(0));
  const props: TileProp[] = [];

  const startX = cx * CHUNK_SIZE;
  const startY = cy * CHUNK_SIZE;

  // 1. Generate Continuous Terrain & Biomes
  for (let r = 0; r < CHUNK_SIZE; r++) {
    for (let c = 0; c < CHUNK_SIZE; c++) {
      const worldX = startX + c;
      const worldY = startY + r;
      const distFromCenter = Math.hypot(worldX, worldY);

      // Grass brightness noise
      const n = hashPRNG(seed, worldX, worldY);
      noiseVariations[r][c] = (n - 0.5) * 0.06;

      // Noise fields
      const lakeNoise = smoothNoise(seed + 100, worldX, worldY, 24) * 0.7 + smoothNoise(seed + 101, worldX, worldY, 12) * 0.3;
      const flowerNoise = smoothNoise(seed + 200, worldX, worldY, 8);

      // Road Network
      const isMainRoad = (Math.abs(worldX) <= 1 || Math.abs(worldY) <= 1) && distFromCenter < 80;
      const isRingRoad = Math.abs(distFromCenter - 22) < 1.2 || Math.abs(distFromCenter - 45) < 1.2;

      // Central Town Plaza (radius < 8 tiles)
      if (distFromCenter <= 7.5) {
        tiles[r][c] = 'plaza';
      } else if (isMainRoad || isRingRoad) {
        tiles[r][c] = 'path';
      } else if (distFromCenter > 12 && lakeNoise < 0.26) {
        // Organic Lake / River
        tiles[r][c] = 'water';
      } else if (flowerNoise > 0.68) {
        tiles[r][c] = 'flower';
      }
    }
  }

  // 2. Bridges where Roads cross Water
  for (let r = 0; r < CHUNK_SIZE; r++) {
    for (let c = 0; c < CHUNK_SIZE; c++) {
      if (tiles[r][c] === 'path') {
        const worldX = startX + c;
        const worldY = startY + r;

        // Check if adjacent tiles are water (river/lake crossing)
        const lakeNoise = smoothNoise(seed + 100, worldX, worldY, 24) * 0.7 + smoothNoise(seed + 101, worldX, worldY, 12) * 0.3;
        if (lakeNoise < 0.32 && Math.hypot(worldX, worldY) > 12) {
          tiles[r][c] = 'bridge';
          // Spawn bridge prop
          props.push({
            id: `bridge-${worldX}-${worldY}`,
            type: 'bridge',
            x: c * TILE_SIZE,
            y: r * TILE_SIZE,
            w: 16,
            h: 16
          });
        }
      }
    }
  }

  // 3. Shoreline Reeds & Cattails Decorator
  for (let r = 0; r < CHUNK_SIZE; r++) {
    for (let c = 0; c < CHUNK_SIZE; c++) {
      if (tiles[r][c] === 'grass') {
        const worldX = startX + c;
        const worldY = startY + r;

        // Check if next to water
        let isShoreline = false;
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < CHUNK_SIZE && nc >= 0 && nc < CHUNK_SIZE) {
            if (tiles[nr][nc] === 'water') isShoreline = true;
          }
        }

        if (isShoreline && hashPRNG(seed, worldX, worldY) > 0.45) {
          props.push({
            id: `reed-${worldX}-${worldY}`,
            type: 'reeds',
            x: c * TILE_SIZE,
            y: r * TILE_SIZE,
            w: 16,
            h: 16
          });
        }
      }
    }
  }

  // 4. Civic Buildings & Key Structures in Central Chunks
  if (cx === 0 && cy === 0) {
    // Central Plaza Fountain
    props.push({
      id: 'fountain-00',
      type: 'fountain',
      x: 96,
      y: 96,
      w: 64,
      h: 64,
      range: 60,
      state: { lastAt: 0 }
    });

    // Street Lamps around Plaza
    props.push({ id: 'lamp-1', type: 'lamp', x: 64, y: 64, w: 16, h: 32, range: 40, state: true });
    props.push({ id: 'lamp-2', type: 'lamp', x: 176, y: 64, w: 16, h: 32, range: 40, state: true });
    props.push({ id: 'lamp-3', type: 'lamp', x: 64, y: 176, w: 16, h: 32, range: 40, state: true });
    props.push({ id: 'lamp-4', type: 'lamp', x: 176, y: 176, w: 16, h: 32, range: 40, state: true });

    // Plaza Benches
    props.push({ id: 'bench-1', type: 'bench', x: 48, y: 112, w: 48, h: 24, range: 48 });
    props.push({ id: 'bench-2', type: 'bench', x: 160, y: 112, w: 48, h: 24, range: 48 });

    // Picnic Blanket
    props.push({ id: 'picnic-1', type: 'picnic', x: 32, y: 192, w: 48, h: 32 });
  } else if (cx === 0 && cy === -1) {
    // Town Hall & Outfits Store
    props.push({
      id: 'b-townhall',
      type: 'building',
      buildingType: 'townhall',
      x: 48,
      y: 16,
      w: 160,
      h: 144
    });
    props.push({
      id: 'b-outfits',
      type: 'building',
      buildingType: 'outfits',
      x: -32,
      y: 32,
      w: 128,
      h: 112
    });
    // Perimeter fences
    props.push({ id: 'fence-th-1', type: 'fence', x: 16, y: 160, w: 32, h: 8 });
    props.push({ id: 'fence-th-2', type: 'fence', x: 208, y: 160, w: 32, h: 8 });
  } else if (cx === 1 && cy === 0) {
    // Cafe & Flower Shop
    props.push({
      id: 'b-cafe',
      type: 'building',
      buildingType: 'cafe',
      x: 32,
      y: 16,
      w: 128,
      h: 112
    });
    props.push({
      id: 'b-flowershop',
      type: 'building',
      buildingType: 'flowershop',
      x: 128,
      y: 112,
      w: 128,
      h: 112
    });
    props.push({ id: 'bench-cafe', type: 'bench', x: 48, y: 136, w: 48, h: 24, range: 48 });
  } else if (cx === -1 && cy === 0) {
    // Bakery & Lakeshore
    props.push({
      id: 'b-bakery',
      type: 'building',
      buildingType: 'bakery',
      x: 112,
      y: 16,
      w: 128,
      h: 112
    });
    props.push({ id: 'lamp-bakery', type: 'lamp', x: 96, y: 128, w: 16, h: 32, range: 40, state: true });
  } else if (cx === 0 && cy === 1) {
    // Library & Park Pavilion
    props.push({
      id: 'b-library',
      type: 'building',
      buildingType: 'library',
      x: 16,
      y: 112,
      w: 128,
      h: 112
    });
    props.push({ id: 'fence-lib', type: 'fence', x: 144, y: 128, w: 48, h: 8 });
  } else {
    // 5. Outer Chunks: Suburbs, Forests & Wilderness
    const chunkDist = Math.hypot(cx, cy);

    if (chunkDist <= 3.5) {
      // Suburbs: Cozy residential cottages with fences & gardens
      const houseX = (hashPRNG(seed, cx, cy) > 0.5 ? 2 : 8) * TILE_SIZE;
      const houseY = 2 * TILE_SIZE;
      props.push({
        id: `house-${cx}-${cy}`,
        type: 'building',
        buildingType: 'house',
        x: houseX,
        y: houseY,
        w: 128,
        h: 112
      });
      // Garden Fence
      props.push({ id: `fence-h-${cx}-${cy}-1`, type: 'fence', x: houseX - 16, y: houseY + 112, w: 48, h: 8 });
      props.push({ id: `fence-h-${cx}-${cy}-2`, type: 'fence', x: houseX + 96, y: houseY + 112, w: 48, h: 8 });
      props.push({ id: `lamp-h-${cx}-${cy}`, type: 'lamp', x: houseX + 64, y: houseY + 128, w: 16, h: 32, range: 40, state: true });
    } else {
      // Wilderness: Forests, Meadows, Lakes
      const forestNoise = smoothNoise(seed + 300, cx, cy, 3);

      if (forestNoise > 0.42) {
        // Forest Biome with tree clusters
        const treeCount = Math.floor(forestNoise * 8) + 2;
        for (let i = 0; i < treeCount; i++) {
          const tx = Math.floor(hashPRNG(seed + i, cx * 3, cy * 5) * 12 + 2) * TILE_SIZE;
          const ty = Math.floor(hashPRNG(seed + i, cx * 7, cy * 11) * 12 + 2) * TILE_SIZE;

          // Don't spawn tree on water or path
          const tileCol = Math.floor(tx / TILE_SIZE);
          const tileRow = Math.floor(ty / TILE_SIZE);
          if (tileRow >= 0 && tileRow < CHUNK_SIZE && tileCol >= 0 && tileCol < CHUNK_SIZE) {
            if (tiles[tileRow][tileCol] === 'grass' || tiles[tileRow][tileCol] === 'flower') {
              props.push({ id: `tree-${cx}-${cy}-${i}`, type: 'tree', x: tx, y: ty, w: 64, h: 80 });
            }
          }
        }
      } else {
        // Open Meadow
        if (hashPRNG(seed, cx * 13, cy * 17) > 0.6) {
          const bx = Math.floor(hashPRNG(seed, cx * 5, cy * 9) * 10 + 3) * TILE_SIZE;
          const by = Math.floor(hashPRNG(seed, cx * 11, cy * 3) * 10 + 3) * TILE_SIZE;
          props.push({ id: `bench-${cx}-${cy}`, type: 'bench', x: bx, y: by, w: 48, h: 24, range: 48 });
        }
      }
    }
  }

  return { cx, cy, tiles, noiseVariations, props };
}
