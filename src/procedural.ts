import { ChunkData, TileType, TileProp } from './types';

export const CHUNK_SIZE = 16; // 16x16 tiles per chunk
export const TILE_SIZE = 16; // 16x16 px per tile (256x256 px per chunk)

// Simple PRNG hash based on seed & coordinates
export function hashPRNG(seed: number, x: number, y: number): number {
  let n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43758.5453) * 43758.5453;
  return n - Math.floor(n);
}

// Perlin-like 2D noise approximation
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

// Generate a chunk deterministically for coordinate (cx, cy)
export function generateChunk(seed: number, cx: number, cy: number): ChunkData {
  const tiles: TileType[][] = Array.from({ length: CHUNK_SIZE }, () => Array(CHUNK_SIZE).fill('grass'));
  const noiseVariations: number[][] = Array.from({ length: CHUNK_SIZE }, () => Array(CHUNK_SIZE).fill(0));
  const props: TileProp[] = [];

  const startX = cx * CHUNK_SIZE;
  const startY = cy * CHUNK_SIZE;

  // 1. Generate base tiles and grass brightness noise (±3%)
  for (let r = 0; r < CHUNK_SIZE; r++) {
    for (let c = 0; c < CHUNK_SIZE; c++) {
      const worldX = startX + c;
      const worldY = startY + r;

      // Small noise variation for grass
      const n = hashPRNG(seed, worldX, worldY);
      noiseVariations[r][c] = (n - 0.5) * 0.06; // ±3% brightness variation

      const macroNoise = smoothNoise(seed, worldX, worldY, 20);

      if (macroNoise > 0.72) {
        tiles[r][c] = 'flower';
      }
    }
  }

  // 2. Town Center Generation for Chunks around (0,0)
  if (cx === 0 && cy === 0) {
    // Central Plaza (6x6 tiles in center)
    for (let r = 5; r <= 10; r++) {
      for (let c = 5; c <= 10; c++) {
        tiles[r][c] = 'plaza';
      }
    }

    // Main Promenade Paths
    for (let i = 0; i < CHUNK_SIZE; i++) {
      tiles[7][i] = 'path';
      tiles[8][i] = 'path';
      tiles[i][7] = 'path';
      tiles[i][8] = 'path';
    }

    // Props in Central Plaza (Chunk 0,0)
    // Fountain in middle
    props.push({
      id: 'fountain-00',
      type: 'fountain',
      x: 128,
      y: 128,
      w: 64,
      h: 64,
      range: 60,
      state: { lastAt: 0 }
    });

    // Street Lamps around Plaza
    props.push({ id: 'lamp-1', type: 'lamp', x: 80, y: 80, w: 16, h: 32, range: 40, state: true });
    props.push({ id: 'lamp-2', type: 'lamp', x: 176, y: 80, w: 16, h: 32, range: 40, state: true });
    props.push({ id: 'lamp-3', type: 'lamp', x: 80, y: 176, w: 16, h: 32, range: 40, state: true });
    props.push({ id: 'lamp-4', type: 'lamp', x: 176, y: 176, w: 16, h: 32, range: 40, state: true });

    // Benches
    props.push({ id: 'bench-1', type: 'bench', x: 64, y: 128, w: 48, h: 24, range: 48 });
    props.push({ id: 'bench-2', type: 'bench', x: 192, y: 128, w: 48, h: 24, range: 48 });

    // Picnic Blanket
    props.push({ id: 'picnic-1', type: 'picnic', x: 40, y: 192, w: 48, h: 32 });
  } else if (cx === 0 && cy === -1) {
    // North Center Chunk: Town Hall & Outfits Shop
    for (let i = 0; i < CHUNK_SIZE; i++) {
      tiles[i][7] = 'path';
      tiles[i][8] = 'path';
    }
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
  } else if (cx === 1 && cy === 0) {
    // East Center Chunk: Cafe & Flower Shop
    for (let i = 0; i < CHUNK_SIZE; i++) {
      tiles[7][i] = 'path';
      tiles[8][i] = 'path';
    }
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
  } else if (cx === -1 && cy === 0) {
    // West Center Chunk: Lake & Bakery
    for (let i = 0; i < CHUNK_SIZE; i++) {
      tiles[7][i] = 'path';
      tiles[8][i] = 'path';
    }
    // Pond area
    for (let r = 1; r < 14; r++) {
      for (let c = 1; c < 12; c++) {
        tiles[r][c] = 'water';
      }
    }
    props.push({
      id: 'b-bakery',
      type: 'building',
      buildingType: 'bakery',
      x: 128,
      y: 16,
      w: 128,
      h: 112
    });
  } else if (cx === 0 && cy === 1) {
    // South Center Chunk: Library & Park Pavilion
    for (let i = 0; i < CHUNK_SIZE; i++) {
      tiles[i][7] = 'path';
      tiles[i][8] = 'path';
    }
    props.push({
      id: 'b-library',
      type: 'building',
      buildingType: 'library',
      x: 16,
      y: 128,
      w: 128,
      h: 112
    });
  } else {
    // 3. Outer Procedural Chunks (Neighborhoods, Forests, Lakes)
    const chunkHash = hashPRNG(seed, cx, cy);

    if (chunkHash < 0.25) {
      // Residential Neighborhood Chunk
      props.push({
        id: `house-${cx}-${cy}`,
        type: 'building',
        buildingType: 'house',
        x: 64,
        y: 48,
        w: 128,
        h: 112
      });
      // Path leading to house
      for (let r = 8; r < 16; r++) {
        tiles[r][8] = 'path';
      }
      props.push({ id: `lamp-${cx}-${cy}`, type: 'lamp', x: 112, y: 144, w: 16, h: 32, range: 40, state: true });
    } else if (chunkHash < 0.65) {
      // Park / Forest Chunk with trees
      const treeCount = Math.floor(chunkHash * 10) + 3;
      for (let i = 0; i < treeCount; i++) {
        const tx = Math.floor(hashPRNG(seed + i, cx * 3, cy * 5) * 12 + 2) * TILE_SIZE;
        const ty = Math.floor(hashPRNG(seed + i, cx * 7, cy * 11) * 12 + 2) * TILE_SIZE;
        props.push({ id: `tree-${cx}-${cy}-${i}`, type: 'tree', x: tx, y: ty, w: 64, h: 80 });
      }
    } else if (chunkHash < 0.85) {
      // Flower Meadow
      for (let r = 2; r < 14; r++) {
        for (let c = 2; c < 14; c++) {
          if (hashPRNG(seed, startX + c, startY + r) > 0.4) {
            tiles[r][c] = 'flower';
          }
        }
      }
      props.push({ id: `bench-${cx}-${cy}`, type: 'bench', x: 104, y: 112, w: 48, h: 24, range: 48 });
    } else {
      // Small Pond / Lake Chunk
      for (let r = 4; r < 12; r++) {
        for (let c = 4; c < 12; c++) {
          tiles[r][c] = 'water';
        }
      }
    }
  }

  return { cx, cy, tiles, noiseVariations, props };
}
