import { Player, WorldState, ChunkData, TileProp, Pose, Appearance } from './types';
import { drawCatSprite, drawAccessory, generateBuildingCanvas, generateTreeCanvas, generateFountainCanvas, PALETTE } from './sprites';
import { generateChunk, CHUNK_SIZE, TILE_SIZE } from './procedural';
import { WorldText } from './world-text';

export class Scene {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  worldState: WorldState;
  chunks: Map<string, ChunkData>;
  positions: Map<string, { x: number; y: number }>;
  camera: { x: number; y: number };
  text: WorldText;
  zoom: number;

  constructor(canvas: HTMLCanvasElement, worldState: WorldState) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.worldState = worldState;
    this.chunks = new Map();
    this.positions = new Map();
    this.camera = { x: 0, y: 0 };
    this.zoom = 3; // Render with zoom x3 for pixelated retro feel
    this.text = new WorldText(document.getElementById('world-text')!);
  }

  getChunkKey(cx: number, cy: number): string {
    return `${cx}:${cy}`;
  }

  getChunk(cx: number, cy: number): ChunkData {
    const key = this.getChunkKey(cx, cy);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = generateChunk(this.worldState.seed, cx, cy);
      this.chunks.set(key, chunk);
    }
    return chunk;
  }

  drawTile(c: CanvasRenderingContext2D, type: string, x: number, y: number, noiseVar: number, time: number) {
    const roundX = Math.round(x);
    const roundY = Math.round(y);

    if (type === 'path') {
      c.fillStyle = PALETTE.pathBeige;
      c.fillRect(roundX, roundY, TILE_SIZE, TILE_SIZE);
      c.fillStyle = PALETTE.pathBorder;
      c.fillRect(roundX, roundY + 15, TILE_SIZE, 1);
    } else if (type === 'plaza') {
      c.fillStyle = PALETTE.plazaStone;
      c.fillRect(roundX, roundY, TILE_SIZE, TILE_SIZE);
      c.fillStyle = PALETTE.plazaBorder;
      c.fillRect(roundX, roundY, TILE_SIZE, 1);
      c.fillRect(roundX, roundY, 1, TILE_SIZE);
    } else if (type === 'water') {
      c.fillStyle = PALETTE.waterTurquoise;
      c.fillRect(roundX, roundY, TILE_SIZE, TILE_SIZE);
      // Animated water wave detail
      const waveOffset = Math.floor((time / 200 + x * 0.1) % 4);
      c.fillStyle = PALETTE.waterDeep;
      c.fillRect(roundX + waveOffset, roundY + 4, 6, 2);
      c.fillRect(roundX + (waveOffset + 8) % 12, roundY + 10, 5, 2);
    } else if (type === 'flower') {
      c.fillStyle = PALETTE.grassBase;
      c.fillRect(roundX, roundY, TILE_SIZE, TILE_SIZE);
      // Small colorful flowers
      const flowerColor = (Math.floor(x + y) % 3 === 0) ? PALETTE.flowerPink : (Math.floor(x + y) % 3 === 1) ? PALETTE.flowerYellow : PALETTE.flowerWhite;
      c.fillStyle = flowerColor;
      c.fillRect(roundX + 4, roundY + 4, 3, 3);
      c.fillRect(roundX + 10, roundY + 9, 3, 3);
    } else {
      // Base Grass with ±3% noise variation
      c.fillStyle = PALETTE.grassBase;
      c.fillRect(roundX, roundY, TILE_SIZE, TILE_SIZE);

      if (noiseVar > 0.01) {
        c.fillStyle = PALETTE.grassLight;
        c.fillRect(roundX + 2, roundY + 3, 3, 2);
        c.fillRect(roundX + 9, roundY + 10, 4, 2);
      } else if (noiseVar < -0.01) {
        c.fillStyle = PALETTE.grassDark;
        c.fillRect(roundX + 4, roundY + 8, 3, 2);
      }
    }
  }

  drawProp(c: CanvasRenderingContext2D, prop: TileProp, time: number) {
    const x = prop.x;
    const y = prop.y;

    if (prop.type === 'tree') {
      const treeImg = generateTreeCanvas();
      c.drawImage(treeImg, x - 32, y - 80);
    } else if (prop.type === 'building' && prop.buildingType) {
      const bldgImg = generateBuildingCanvas(prop.buildingType);
      c.drawImage(bldgImg, x, y);
    } else if (prop.type === 'fountain') {
      const ftnImg = generateFountainCanvas();
      c.drawImage(ftnImg, x, y);
      // Animated water splash jet
      const splashY = Math.sin(time / 150) * 4;
      c.fillStyle = PALETTE.waterTurquoise;
      c.fillRect(x + 30, y + 8 + splashY, 4, 8);
    } else if (prop.type === 'bench') {
      // Wood Bench
      c.fillStyle = PALETTE.woodDark;
      c.fillRect(x, y + 8, prop.w, 16);
      c.fillStyle = PALETTE.woodLight;
      c.fillRect(x + 2, y + 10, prop.w - 4, 4);
      c.fillRect(x + 2, y + 16, prop.w - 4, 4);
    } else if (prop.type === 'lamp') {
      // Lamp Post
      c.fillStyle = PALETTE.woodDark;
      c.fillRect(x + 6, y - 24, 4, 32);
      c.fillStyle = PALETTE.lampGold;
      c.fillRect(x + 4, y - 30, 8, 8);
    } else if (prop.type === 'picnic') {
      // Picnic Blanket
      c.fillStyle = PALETTE.roofRose;
      c.fillRect(x, y, prop.w, prop.h);
      for (let r = 0; r < prop.h; r += 8) {
        for (let cCol = 0; cCol < prop.w; cCol += 8) {
          if ((r / 8 + cCol / 8) % 2 === 0) {
            c.fillStyle = PALETTE.wallCream;
            c.fillRect(x + cCol, y + r, 8, 8);
          }
        }
      }
    }
  }

  draw(players: Player[], selfId: string, time: number) {
    const c = this.ctx;
    const canvas = this.canvas;

    const viewW = Math.ceil(canvas.clientWidth / this.zoom);
    const viewH = Math.ceil(canvas.clientHeight / this.zoom);

    if (canvas.width !== viewW || canvas.height !== viewH) {
      canvas.width = viewW;
      canvas.height = viewH;
    }
    c.imageSmoothingEnabled = false;

    const me = players.find(p => p.id === selfId);
    if (me) {
      // Smooth camera follow target
      const targetX = me.x - viewW / 2;
      const targetY = me.y - viewH / 2;
      this.camera.x += (targetX - this.camera.x) * 0.15;
      this.camera.y += (targetY - this.camera.y) * 0.15;
    }

    const camX = Math.round(this.camera.x);
    const camY = Math.round(this.camera.y);

    c.clearRect(0, 0, viewW, viewH);
    c.save();
    c.translate(-camX, -camY);

    // Calculate visible chunks
    const chunkPixelSize = CHUNK_SIZE * TILE_SIZE; // 256 px
    const minChunkX = Math.floor(camX / chunkPixelSize) - 1;
    const maxChunkX = Math.ceil((camX + viewW) / chunkPixelSize) + 1;
    const minChunkY = Math.floor(camY / chunkPixelSize) - 1;
    const maxChunkY = Math.ceil((camY + viewH) / chunkPixelSize) + 1;

    const visibleChunks: ChunkData[] = [];
    for (let cy = minChunkY; cy <= maxChunkY; cy++) {
      for (let cx = minChunkX; cx <= maxChunkX; cx++) {
        visibleChunks.push(this.getChunk(cx, cy));
      }
    }

    // 1. Draw Terrain Tiles
    for (const chunk of visibleChunks) {
      const offsetX = chunk.cx * chunkPixelSize;
      const offsetY = chunk.cy * chunkPixelSize;

      for (let r = 0; r < CHUNK_SIZE; r++) {
        for (let col = 0; col < CHUNK_SIZE; col++) {
          const tileType = chunk.tiles[r][col];
          const noiseVar = chunk.noiseVariations[r][col];
          const tileX = offsetX + col * TILE_SIZE;
          const tileY = offsetY + r * TILE_SIZE;

          this.drawTile(c, tileType, tileX, tileY, noiseVar, time);
        }
      }
    }

    // 2. Prepare Y-Sorted Drawables for Props & Players
    const drawables: { y: number; draw: () => void }[] = [];

    // Props
    for (const chunk of visibleChunks) {
      const chunkX = chunk.cx * chunkPixelSize;
      const chunkY = chunk.cy * chunkPixelSize;

      for (const prop of chunk.props) {
        const absProp = { ...prop, x: chunkX + prop.x, y: chunkY + prop.y };
        drawables.push({
          y: absProp.y + (absProp.h || 16),
          draw: () => this.drawProp(c, absProp, time)
        });
      }
    }

    // Smooth position interpolation for players
    const frameNumber = Math.floor(time / 120) % 4;

    const interpolatedPlayers = players.map(p => {
      const old = this.positions.get(p.id) || { x: p.x, y: p.y };
      old.x += (p.x - old.x) * 0.35;
      old.y += (p.y - old.y) * 0.35;
      this.positions.set(p.id, old);

      return { ...p, x: old.x, y: old.y };
    });

    for (const p of interpolatedPlayers) {
      drawables.push({
        y: Math.round(p.y),
        draw: () => {
          drawCatSprite(c, p.x - 16, p.y - 24, p.dir || 'down', frameNumber, p.appearance?.fur || 'gray', p.pose || 'idle');
          drawAccessory(c, p.x - 16, p.y - 24, p.appearance?.accessory || 'none', p.dir || 'down', p.pose || 'idle');

          if (p.pose === 'sleep') {
            c.font = '10px monospace';
            c.textAlign = 'center';
            c.fillStyle = PALETTE.flowerYellow;
            c.fillText('z z Z', Math.round(p.x + 12), Math.round(p.y - 28));
          }

          if (p.emote && p.emote.until > Date.now()) {
            const emoteChar = p.emote.kind === 'heart' ? '♥' : p.emote.kind === 'wave' ? '♪' : '✦';
            c.font = 'bold 16px monospace';
            c.textAlign = 'center';
            c.fillStyle = PALETTE.pinkCheek;
            c.fillText(emoteChar, Math.round(p.x), Math.round(p.y - 34 + Math.sin(time / 150) * 2));
          }
        }
      });
    }

    // Sort drawables by Y coordinate
    drawables.sort((a, b) => a.y - b.y);
    for (const item of drawables) {
      item.draw();
    }

    // 3. Day / Night Ambient Cycle Overlay & Lamp Light Halos
    const timeOfDay = this.worldState?.timeOfDay ?? 12; // 0 to 24
    const isNight = timeOfDay < 6 || timeOfDay > 19;

    if (isNight) {
      // Dark Blue Night Overlay
      c.fillStyle = 'rgba(20, 28, 50, 0.45)';
      c.fillRect(camX, camY, viewW, viewH);

      // Light Halos for Street Lamps
      for (const chunk of visibleChunks) {
        const chunkX = chunk.cx * chunkPixelSize;
        const chunkY = chunk.cy * chunkPixelSize;

        for (const prop of chunk.props) {
          if (prop.type === 'lamp') {
            const lx = chunkX + prop.x + 8;
            const ly = chunkY + prop.y - 26;

            const grad = c.createRadialGradient(lx, ly, 2, lx, ly, 48);
            grad.addColorStop(0, 'rgba(255, 230, 150, 0.7)');
            grad.addColorStop(0.5, 'rgba(255, 200, 100, 0.2)');
            grad.addColorStop(1, 'rgba(255, 200, 100, 0)');

            c.fillStyle = grad;
            c.beginPath();
            c.arc(lx, ly, 48, 0, Math.PI * 2);
            c.fill();
          }
        }
      }
    }

    c.restore();

    // 4. Position DOM Labels & Speech Bubbles
    if (this.text) {
      const mobile = canvas.clientWidth <= 700;
      const obstacles = [...document.querySelectorAll('#chat-panel,#joystick,.actions,#nearby')]
        .filter(e => e.getClientRects().length)
        .map(e => e.getBoundingClientRect());

      this.text.update(
        interpolatedPlayers,
        { x: camX, y: camY },
        {
          width: canvas.clientWidth,
          height: canvas.clientHeight,
          pixelWidth: viewW,
          pixelHeight: viewH,
          top: mobile ? 90 : 110,
          bottom: canvas.clientHeight,
          obstacles
        },
        selfId
      );
    }
  }

  preview(canvas: HTMLCanvasElement, appearance: Appearance, time = 0) {
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(2.5, 2.5);

    drawCatSprite(ctx, 22, 12, 'down', Math.floor(time / 200) % 4, appearance.fur, 'idle');
    drawAccessory(ctx, 22, 12, appearance.accessory, 'down', 'idle');

    ctx.restore();
  }
}
