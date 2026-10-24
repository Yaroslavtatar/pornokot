import { Direction, FurColor, AccessoryType, Pose, Appearance } from './types';

// Palette definitions for pixel art
export const PALETTE = {
  // Fur
  furGray: '#bbb8b2',
  furLavender: '#bdabd5',
  furCream: '#ecd5aa',
  furCocoa: '#a47662',
  outline: '#38302a',
  eye: '#2b231d',
  pinkCheek: '#f58ea0',
  white: '#ffffff',

  // World
  grassBase: '#84a96c',
  grassDark: '#6f9560',
  grassLight: '#99bb80',
  pathBeige: '#e3d3b0',
  pathBorder: '#c4b28d',
  plazaStone: '#ded0b5',
  plazaBorder: '#ad9c86',
  waterTurquoise: '#7fb3ac',
  waterDeep: '#6aa098',

  // Buildings & Decor
  roofPurple: '#8a7aa0',
  roofRose: '#be8179',
  roofBlue: '#7392a8',
  roofSlate: '#6d7582',
  roofGreen: '#729878',
  wallCream: '#f0e6d2',
  wallYellow: '#f5eacc',
  wallPink: '#f7dfd6',
  wallBrick: '#d4a28c',
  woodDark: '#6b5443',
  woodLight: '#a3846c',
  windowGlass: '#95c2be',
  windowFrame: '#e8a299',
  lampGold: '#ffe094',
  flowerPink: '#e8a2b5',
  flowerYellow: '#f3d578',
  flowerWhite: '#fff8eb'
};

const cachedCatSheets = new Map<string, HTMLCanvasElement>();
const cachedPropCanvases = new Map<string, HTMLCanvasElement>();

function createCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [canvas, ctx];
}

function fillRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function fillEllipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(Math.round(cx), Math.round(cy), Math.round(rx), Math.round(ry), 0, 0, Math.PI * 2);
  ctx.fill();
}

// Map fur type to color string
export function getFurColorHex(fur: FurColor): string {
  switch (fur) {
    case 'lavender': return PALETTE.furLavender;
    case 'cream': return PALETTE.furCream;
    case 'cocoa': return PALETTE.furCocoa;
    case 'gray': default: return PALETTE.furGray;
  }
}

// Generate pixel-art cat sprite for a given direction, frame, fur color, and posture
export function drawCatSprite(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dir: Direction,
  frame: number,
  fur: FurColor,
  pose: Pose
) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  const furColor = getFurColorHex(fur);
  const isWalking = pose === 'walk';
  const isSitting = pose === 'sit';
  const isSleeping = pose === 'sleep';

  // Ground shadow under cat
  fillEllipse(ctx, 16, 28, 12, 4, 'rgba(60, 80, 50, 0.35)');

  if (isSleeping) {
    // Sleeping curled up cat
    fillEllipse(ctx, 16, 22, 12, 8, PALETTE.outline);
    fillEllipse(ctx, 16, 22, 11, 7, furColor);
    // Ears
    fillRect(ctx, 8, 14, 3, 3, PALETTE.outline);
    fillRect(ctx, 9, 15, 2, 2, furColor);
    // Closed eyes 'z z'
    fillRect(ctx, 12, 20, 3, 1, PALETTE.eye);
    fillRect(ctx, 18, 20, 3, 1, PALETTE.eye);
    ctx.restore();
    return;
  }

  const yNudge = isSitting ? 2 : (isWalking && (frame % 2 === 1) ? -1 : 0);
  const legShift = isWalking ? (frame % 2 === 0 ? -1 : 1) : 0;

  // Tail swishing animation in idle / walk
  const tailAngle = Math.sin(frame * 0.8) * 3;
  const tailX = dir === 'right' ? 4 : dir === 'left' ? 28 : 22;
  const tailY = 20 + yNudge;

  // Draw Tail
  fillRect(ctx, tailX + tailAngle, tailY - 4, 3, 6, PALETTE.outline);
  fillRect(ctx, tailX + tailAngle + 1, tailY - 3, 1, 4, furColor);

  // Legs
  if (!isSitting) {
    fillRect(ctx, 9 + legShift, 25, 4, 4, PALETTE.outline);
    fillRect(ctx, 10 + legShift, 25, 2, 3, furColor);

    fillRect(ctx, 19 - legShift, 25, 4, 4, PALETTE.outline);
    fillRect(ctx, 20 - legShift, 25, 2, 3, furColor);
  }

  // Chubby Main Body Oval
  fillEllipse(ctx, 16, 18 + yNudge, 12, 9, PALETTE.outline);
  fillEllipse(ctx, 16, 18 + yNudge, 11, 8, furColor);

  // Head Features based on Direction
  const hy = 13 + yNudge;

  if (dir === 'down' || dir === 'left' || dir === 'right') {
    // Ears
    fillRect(ctx, 7, hy - 5, 4, 5, PALETTE.outline);
    fillRect(ctx, 8, hy - 4, 2, 4, furColor);

    fillRect(ctx, 21, hy - 5, 4, 5, PALETTE.outline);
    fillRect(ctx, 22, hy - 4, 2, 4, furColor);
  } else {
    // Back view ears
    fillRect(ctx, 8, hy - 5, 4, 5, PALETTE.outline);
    fillRect(ctx, 9, hy - 4, 2, 4, furColor);

    fillRect(ctx, 20, hy - 5, 4, 5, PALETTE.outline);
    fillRect(ctx, 21, hy - 4, 2, 4, furColor);
    // Back stripes
    fillRect(ctx, 12, hy + 2, 2, 4, PALETTE.outline);
    fillRect(ctx, 18, hy + 2, 2, 4, PALETTE.outline);
  }

  if (dir === 'down') {
    // Face Down
    // Eyes
    fillRect(ctx, 11, hy, 2, 2, PALETTE.eye);
    fillRect(ctx, 19, hy, 2, 2, PALETTE.eye);
    // Cheeks
    fillRect(ctx, 9, hy + 2, 2, 2, PALETTE.pinkCheek);
    fillRect(ctx, 21, hy + 2, 2, 2, PALETTE.pinkCheek);
    // Mouth 'w'
    fillRect(ctx, 14, hy + 3, 1, 1, PALETTE.outline);
    fillRect(ctx, 15, hy + 4, 2, 1, PALETTE.outline);
    fillRect(ctx, 17, hy + 3, 1, 1, PALETTE.outline);
    // Whiskers
    fillRect(ctx, 5, hy + 1, 3, 1, PALETTE.outline);
    fillRect(ctx, 5, hy + 3, 3, 1, PALETTE.outline);
    fillRect(ctx, 24, hy + 1, 3, 1, PALETTE.outline);
    fillRect(ctx, 24, hy + 3, 3, 1, PALETTE.outline);
  } else if (dir === 'left') {
    // Face Left
    fillRect(ctx, 10, hy, 2, 2, PALETTE.eye);
    fillRect(ctx, 8, hy + 2, 2, 2, PALETTE.pinkCheek);
    fillRect(ctx, 12, hy + 3, 2, 1, PALETTE.outline);
    fillRect(ctx, 4, hy + 1, 3, 1, PALETTE.outline);
    fillRect(ctx, 4, hy + 3, 3, 1, PALETTE.outline);
  } else if (dir === 'right') {
    // Face Right
    fillRect(ctx, 20, hy, 2, 2, PALETTE.eye);
    fillRect(ctx, 22, hy + 2, 2, 2, PALETTE.pinkCheek);
    fillRect(ctx, 18, hy + 3, 2, 1, PALETTE.outline);
    fillRect(ctx, 25, hy + 1, 3, 1, PALETTE.outline);
    fillRect(ctx, 25, hy + 3, 3, 1, PALETTE.outline);
  }

  ctx.restore();
}

// Draw accessory over cat
export function drawAccessory(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  accessory: AccessoryType,
  dir: Direction,
  pose: Pose
) {
  if (accessory === 'none' || pose === 'sleep') return;

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));

  const yNudge = pose === 'sit' ? 2 : 0;

  if (accessory === 'mushroom-hat') {
    // Red mushroom hat with white dots
    fillEllipse(ctx, 16, 7 + yNudge, 9, 5, '#b83b3b');
    fillRect(ctx, 10, 10 + yNudge, 12, 2, '#ebdcd5');
    // White dots
    fillRect(ctx, 12, 5 + yNudge, 2, 2, PALETTE.white);
    fillRect(ctx, 18, 6 + yNudge, 2, 2, PALETTE.white);
    fillRect(ctx, 15, 8 + yNudge, 2, 2, PALETTE.white);
  } else if (accessory === 'hat') {
    // Gentleman Top Hat
    fillRect(ctx, 10, 9 + yNudge, 12, 2, PALETTE.outline);
    fillRect(ctx, 12, 2 + yNudge, 8, 8, PALETTE.outline);
    fillRect(ctx, 12, 8 + yNudge, 8, 1, '#d84e4e'); // Red band
  } else if (accessory === 'pink-body-bow') {
    // Cute Pink Body Bow
    fillEllipse(ctx, 13, 19 + yNudge, 3, 2, PALETTE.pinkCheek);
    fillEllipse(ctx, 19, 19 + yNudge, 3, 2, PALETTE.pinkCheek);
    fillRect(ctx, 15, 18 + yNudge, 2, 2, '#d65270');
  } else if (accessory === 'blue-tail-bow') {
    // Blue Tail Bow
    const tailX = dir === 'right' ? 6 : 24;
    fillEllipse(ctx, tailX - 2, 19 + yNudge, 3, 2, '#50a0d8');
    fillEllipse(ctx, tailX + 2, 19 + yNudge, 3, 2, '#50a0d8');
    fillRect(ctx, tailX - 1, 18 + yNudge, 2, 2, '#2d6ea0');
  }

  ctx.restore();
}

// Building Renderer - Generates beautiful pixel-art buildings
export function generateBuildingCanvas(type: string): HTMLCanvasElement {
  const cached = cachedPropCanvases.get(`building-${type}`);
  if (cached) return cached;

  let width = 128;
  let height = 112;
  if (type === 'townhall') { width = 160; height = 144; }

  const [canvas, ctx] = createCanvas(width, height);

  const wallColor =
    type === 'townhall' ? PALETTE.wallYellow :
    type === 'outfits' ? PALETTE.wallPink :
    type === 'cafe' ? PALETTE.wallCream :
    type === 'bakery' ? PALETTE.wallBrick :
    type === 'library' ? PALETTE.wallCream :
    type === 'flowershop' ? '#e2f0d6' : PALETTE.wallCream;

  const roofColor =
    type === 'townhall' ? PALETTE.roofPurple :
    type === 'outfits' ? PALETTE.roofRose :
    type === 'cafe' ? PALETTE.roofBlue :
    type === 'bakery' ? PALETTE.roofSlate :
    type === 'library' ? PALETTE.roofPurple :
    type === 'flowershop' ? PALETTE.roofGreen : PALETTE.roofRose;

  // Main Wall Base
  fillRect(ctx, 8, 32, width - 16, height - 32, wallColor);
  fillRect(ctx, 8, height - 12, width - 16, 12, PALETTE.woodDark);

  // Roof Overhang
  fillRect(ctx, 4, 16, width - 8, 20, roofColor);
  fillRect(ctx, 2, 34, width - 4, 4, PALETTE.outline);

  // Roof Tiles Pattern
  for (let y = 18; y < 34; y += 4) {
    for (let x = 6; x < width - 12; x += 12) {
      fillRect(ctx, x + (y % 8 ? 6 : 0), y, 10, 1, 'rgba(255, 255, 255, 0.25)');
    }
  }

  // Door
  const doorX = Math.round(width / 2 - 12);
  const doorY = height - 48;
  fillRect(ctx, doorX, doorY, 24, 36, PALETTE.woodDark);
  fillRect(ctx, doorX + 2, doorY + 2, 20, 32, PALETTE.woodLight);
  fillRect(ctx, doorX + 18, doorY + 18, 3, 3, PALETTE.lampGold); // Handle

  // Windows
  const winY = 48;
  for (const winX of [doorX - 32, doorX + 36]) {
    if (winX > 12 && winX < width - 36) {
      fillRect(ctx, winX - 2, winY - 2, 28, 28, PALETTE.windowFrame);
      fillRect(ctx, winX, winY, 24, 24, PALETTE.windowGlass);
      fillRect(ctx, winX + 11, winY, 2, 24, PALETTE.windowFrame);
      fillRect(ctx, winX, winY + 11, 24, 2, PALETTE.windowFrame);

      // Window flower box
      fillRect(ctx, winX - 4, winY + 24, 32, 6, PALETTE.woodDark);
      for (let fx = winX - 2; fx < winX + 26; fx += 6) {
        fillEllipse(ctx, fx + 3, winY + 23, 3, 3, fx % 12 === 0 ? PALETTE.flowerPink : PALETTE.flowerYellow);
      }
    }
  }

  // Sign board
  const signX = Math.round(width / 2 - 36);
  const signY = 24;
  fillRect(ctx, signX, signY, 72, 16, PALETTE.woodDark);
  fillRect(ctx, signX + 2, signY + 2, 68, 12, '#fbf5e6');

  // Text / Emblem on sign
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.outline;
  const label =
    type === 'townhall' ? 'РАТУША' :
    type === 'outfits' ? 'НАРЯДЫ' :
    type === 'cafe' ? 'КОФЕЙНЯ' :
    type === 'bakery' ? 'ПЕКАРНЯ' :
    type === 'library' ? 'КНИГИ' :
    type === 'flowershop' ? 'ЦВЕТЫ' : 'ДОМИК';
  ctx.fillText(label, width / 2, signY + 11);

  cachedPropCanvases.set(`building-${type}`, canvas);
  return canvas;
}

// Tree Generator
export function generateTreeCanvas(): HTMLCanvasElement {
  const cached = cachedPropCanvases.get('tree');
  if (cached) return cached;

  const [canvas, ctx] = createCanvas(64, 80);

  // Trunk
  fillRect(ctx, 28, 48, 8, 28, PALETTE.woodDark);
  fillRect(ctx, 32, 48, 4, 28, PALETTE.woodLight);

  // Layered Canopy Ovals
  fillEllipse(ctx, 32, 32, 24, 20, PALETTE.grassDark);
  fillEllipse(ctx, 28, 28, 20, 16, PALETTE.grassBase);
  fillEllipse(ctx, 24, 22, 14, 12, PALETTE.grassLight);

  // Highlights / Leaf details
  for (let i = 0; i < 8; i++) {
    fillEllipse(ctx, 16 + i * 4, 16 + (i % 3) * 6, 4, 3, PALETTE.grassLight);
  }

  cachedPropCanvases.set('tree', canvas);
  return canvas;
}

// Fountain Generator
export function generateFountainCanvas(): HTMLCanvasElement {
  const cached = cachedPropCanvases.get('fountain');
  if (cached) return cached;

  const [canvas, ctx] = createCanvas(64, 64);

  // Stone Basin
  fillEllipse(ctx, 32, 36, 28, 16, PALETTE.plazaBorder);
  fillEllipse(ctx, 32, 34, 26, 14, PALETTE.plazaStone);
  fillEllipse(ctx, 32, 32, 22, 10, PALETTE.waterTurquoise);

  // Central Pillar
  fillRect(ctx, 29, 14, 6, 20, PALETTE.plazaBorder);
  fillRect(ctx, 30, 14, 4, 20, PALETTE.plazaStone);

  // Upper Basin
  fillEllipse(ctx, 32, 16, 12, 5, PALETTE.plazaBorder);
  fillEllipse(ctx, 32, 15, 10, 4, PALETTE.waterTurquoise);

  cachedPropCanvases.set('fountain', canvas);
  return canvas;
}
