import { TileProp, TileType, ChunkData } from './types';
import { CHUNK_SIZE, TILE_SIZE } from './procedural';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function boxIntersect(a: Box, b: Box): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Get precise collision bounding boxes for a tile prop
export function getPropCollisionBoxes(prop: TileProp): Box[] {
  const x = prop.x;
  const y = prop.y;

  if (prop.type === 'building') {
    if (prop.buildingType === 'townhall') {
      return [{ x: x + 12, y: y + 44, w: 136, h: 92 }];
    } else {
      return [{ x: x + 8, y: y + 36, w: 112, h: 68 }];
    }
  } else if (prop.type === 'tree') {
    // Trunk footprint at bottom of tree
    return [{ x: x - 10, y: y - 10, w: 20, h: 16 }];
  } else if (prop.type === 'fountain') {
    return [{ x: x + 8, y: y + 16, w: 48, h: 40 }];
  } else if (prop.type === 'lamp') {
    return [{ x: x + 4, y: y - 8, w: 8, h: 12 }];
  } else if (prop.type === 'bench') {
    return [{ x: x + 2, y: y + 8, w: 44, h: 14 }];
  } else if (prop.type === 'fence') {
    return [{ x, y: y + 4, w: prop.w || 16, h: prop.h || 8 }];
  }

  return [];
}

// Check if a cat bounding box collides with any tile or prop in visible/loaded chunks
export function checkCollisionAt(
  catBox: Box,
  getChunkFn: (cx: number, cy: number) => ChunkData
): boolean {
  // Determine relevant chunks overlapping the cat box
  const minChunkX = Math.floor(catBox.x / (CHUNK_SIZE * TILE_SIZE));
  const maxChunkX = Math.floor((catBox.x + catBox.w) / (CHUNK_SIZE * TILE_SIZE));
  const minChunkY = Math.floor(catBox.y / (CHUNK_SIZE * TILE_SIZE));
  const maxChunkY = Math.floor((catBox.y + catBox.h) / (CHUNK_SIZE * TILE_SIZE));

  for (let cy = minChunkY; cy <= maxChunkY; cy++) {
    for (let cx = minChunkX; cx <= maxChunkX; cx++) {
      const chunk = getChunkFn(cx, cy);
      const chunkX = chunk.cx * CHUNK_SIZE * TILE_SIZE;
      const chunkY = chunk.cy * CHUNK_SIZE * TILE_SIZE;

      // 1. Check Terrain Tiles
      const minTileCol = Math.max(0, Math.floor((catBox.x - chunkX) / TILE_SIZE));
      const maxTileCol = Math.min(CHUNK_SIZE - 1, Math.floor((catBox.x + catBox.w - chunkX) / TILE_SIZE));
      const minTileRow = Math.max(0, Math.floor((catBox.y - chunkY) / TILE_SIZE));
      const maxTileRow = Math.min(CHUNK_SIZE - 1, Math.floor((catBox.y + catBox.h - chunkY) / TILE_SIZE));

      for (let r = minTileRow; r <= maxTileRow; r++) {
        for (let col = minTileCol; col <= maxTileCol; col++) {
          const tile = chunk.tiles[r][col];
          if (tile === 'water') {
            // Water tile is impassable unless covered by a bridge prop
            const tileBox: Box = {
              x: chunkX + col * TILE_SIZE,
              y: chunkY + r * TILE_SIZE,
              w: TILE_SIZE,
              h: TILE_SIZE
            };
            if (boxIntersect(catBox, tileBox)) {
              // Check if any bridge prop covers this tile
              const isBridgeOverTile = chunk.props.some(p => {
                if (p.type !== 'bridge') return false;
                const pBox = { x: chunkX + p.x, y: chunkY + p.y, w: p.w, h: p.h };
                return boxIntersect(tileBox, pBox);
              });
              if (!isBridgeOverTile) {
                return true;
              }
            }
          }
        }
      }

      // 2. Check Props
      for (const prop of chunk.props) {
        const absProp = { ...prop, x: chunkX + prop.x, y: chunkY + prop.y };
        const propBoxes = getPropCollisionBoxes(absProp);

        for (const pBox of propBoxes) {
          if (boxIntersect(catBox, pBox)) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

// Move player with dual-axis sliding collision resolution
export function resolveMovement(
  x: number,
  y: number,
  dx: number,
  dy: number,
  speed: number,
  getChunkFn: (cx: number, cy: number) => ChunkData
): { x: number; y: number } {
  if (dx === 0 && dy === 0) return { x, y };

  const CAT_W = 12;
  const CAT_H = 8;

  // Proposed movement steps
  const moveX = dx * speed;
  const moveY = dy * speed;

  let currentX = x;
  let currentY = y;

  // 1. Try X movement
  if (moveX !== 0) {
    const testX = currentX + moveX;
    const testBoxX: Box = {
      x: testX - CAT_W / 2,
      y: currentY - CAT_H / 2,
      w: CAT_W,
      h: CAT_H
    };
    if (!checkCollisionAt(testBoxX, getChunkFn)) {
      currentX = testX;
    }
  }

  // 2. Try Y movement
  if (moveY !== 0) {
    const testY = currentY + moveY;
    const testBoxY: Box = {
      x: currentX - CAT_W / 2,
      y: testY - CAT_H / 2,
      w: CAT_W,
      h: CAT_H
    };
    if (!checkCollisionAt(testBoxY, getChunkFn)) {
      currentY = testY;
    }
  }

  return { x: currentX, y: currentY };
}
