import { Direction, Pose } from './types';

export type BodyShape = 'chubby' | 'normal' | 'slim' | 'ball' | 'long';
export type EarType = 'normal' | 'folded' | 'tufted' | 'round' | 'pointed';
export type EyeType = 'dots' | 'happy' | 'sleepy' | 'shiny' | 'wink' | 'heterochromia' | 'stars';
export type NoseMouthType = 'triangle' | 'w_mouth' | 'tongue_out';
export type TailType = 'striped' | 'fluffy' | 'stub' | 'hook' | 'ring' | 'tuft';

export type PatternType =
  | 'solid'
  | 'tabby'
  | 'spots'
  | 'tuxedo'
  | 'bicolor'
  | 'calico'
  | 'tortoiseshell'
  | 'siamese'
  | 'socks'
  | 'mask'
  | 'leopard'
  | 'smoky';

export type HatType =
  | 'none'
  | 'top_hat'
  | 'mushroom'
  | 'bow'
  | 'crown'
  | 'beret'
  | 'cowboy'
  | 'chef'
  | 'witch'
  | 'beanie'
  | 'cap'
  | 'party'
  | 'flower_crown'
  | 'headphones'
  | 'straw'
  | 'pirate'
  | 'hoodie'
  | 'halo'
  | 'helmet'
  | 'leaf'
  | 'flowerpot'
  | 'teacup'
  | 'pumpkin'
  | 'pineapple'
  | 'horns'
  | 'antennas';

export type FaceAccessory = 'none' | 'glasses' | 'sunglasses' | 'monocle' | 'blush' | 'plaster' | 'freckles' | 'mustache';
export type NeckAccessory = 'none' | 'bowtie' | 'bell_collar' | 'scarf' | 'bandana' | 'tie';
export type BackAccessory = 'none' | 'backpack' | 'cape' | 'butterfly_wings' | 'angel_wings' | 'guitar' | 'umbrella';
export type AuraType = 'none' | 'hearts' | 'stars' | 'leaves' | 'snowflakes' | 'notes';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface ColorRamp {
  outline: string;
  shade: string;
  base: string;
  highlight: string;
}

export interface CatGenome {
  bodyShape: BodyShape;
  furHue: number; // 0..360
  furSat: number; // 0..100
  furLit: number; // 0..100
  palettePreset?: string;
  pattern: PatternType;
  patternColorHex?: string;
  ears: EarType;
  eyes: EyeType;
  noseMouth: NoseMouthType;
  tail: TailType;
  hat: HatType;
  hatColorHex?: string;
  faceAccessory: FaceAccessory;
  neck: NeckAccessory;
  back: BackAccessory;
  aura: AuraType;
  rarity: Rarity;
}

export const NATURAL_PALETTES: Record<string, { h: number; s: number; l: number }> = {
  gray: { h: 210, s: 8, l: 72 },
  lavender: { h: 265, s: 30, l: 75 },
  cream: { h: 42, s: 60, l: 82 },
  ginger: { h: 24, s: 75, l: 62 },
  black: { h: 220, s: 15, l: 30 },
  white: { h: 200, s: 10, l: 94 },
  chocolate: { h: 20, s: 45, l: 40 },
  skyblue: { h: 195, s: 50, l: 78 },
  mint: { h: 155, s: 40, l: 76 },
  peach: { h: 18, s: 70, l: 80 },
  ash: { h: 200, s: 12, l: 58 },
  // Rare Fantasy
  starlight: { h: 280, s: 70, l: 65 },
  berry: { h: 330, s: 65, l: 60 },
  gold: { h: 48, s: 90, l: 55 }
};

export const HATS_LIST: HatType[] = [
  'none',
  'top_hat',
  'mushroom',
  'bow',
  'crown',
  'beret',
  'cowboy',
  'chef',
  'witch',
  'beanie',
  'cap',
  'party',
  'flower_crown',
  'headphones',
  'straw',
  'pirate',
  'hoodie',
  'halo',
  'helmet',
  'leaf',
  'flowerpot',
  'teacup',
  'pumpkin',
  'pineapple',
  'horns',
  'antennas'
];

export const HAT_LABELS: Record<HatType, string> = {
  none: 'Без шляпы',
  top_hat: 'Цилиндр',
  mushroom: 'Мухомор',
  bow: 'Бантик',
  crown: 'Корона',
  beret: 'Берет',
  cowboy: 'Ковбойская',
  chef: 'Колпак повара',
  witch: 'Ведьмина',
  beanie: 'Шапка с помпоном',
  cap: 'Кепка',
  party: 'Колпак именинника',
  flower_crown: 'Венок из цветов',
  headphones: 'Наушники',
  straw: 'Соломенная',
  pirate: 'Пиратская',
  hoodie: 'Капюшон с ушками',
  halo: 'Нимб',
  helmet: 'Шлем',
  leaf: 'Листик',
  flowerpot: 'Цветочный горшок',
  teacup: 'Чашка',
  pumpkin: 'Тыква',
  pineapple: 'Ананас',
  horns: 'Рожки',
  antennas: 'Антенны'
};

// HSL to RGB Helper
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

// Generate Hue-Shifted 4-Tone Color Ramp
export function generateColorRamp(hue: number, sat: number, lit: number): ColorRamp {
  // Hue shift: shadow shifted to cooler hue (-12deg), highlight shifted to warmer hue (+10deg)
  const shadowHue = (hue - 12 + 360) % 360;
  const highlightHue = (hue + 10) % 360;

  const outline = hslToHex(shadowHue, Math.min(100, sat + 15), Math.max(12, lit - 40));
  const shade = hslToHex(shadowHue, Math.min(100, sat + 8), Math.max(20, lit - 18));
  const base = hslToHex(hue, sat, lit);
  const highlight = hslToHex(highlightHue, Math.max(0, sat - 10), Math.min(96, lit + 16));

  return { outline, shade, base, highlight };
}

// Per-frame Hat Sway Anchors (x, y offsets per direction & frame)
export function getHatAnchor(hat: HatType, dir: Direction, frame: number, pose: Pose): { x: number; y: number } {
  if (hat === 'none' || pose === 'sleep') return { x: 0, y: 0 };

  const ySway = pose === 'sit' ? 2 : Math.sin(frame * 1.2) * 1;
  const xSway = dir === 'right' ? 1 : dir === 'left' ? -1 : 0;

  return { x: xSway, y: Math.round(ySway) };
}

// Compute WCAG-like relative luminance for contrast check
export function getRelativeLuminance(hex: string): number {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Evaluate Palette & Accessory Harmony Score (0 to 100)
export function evaluateBeautyScore(g: CatGenome): number {
  let score = 70;

  // Contrast check: Hat vs Fur
  if (g.hat !== 'none') {
    const furLit = g.furLit / 100;
    const hatHex = g.hatColorHex || '#8b5a2b';
    const hatLit = getRelativeLuminance(hatHex);
    const contrast = Math.abs(furLit - hatLit);

    if (contrast < 0.15) score -= 25; // Penalize low contrast
    else score += 15;
  }

  // Rarity bonus
  if (g.rarity === 'legendary') score += 20;
  if (g.rarity === 'epic') score += 10;

  return Math.min(100, Math.max(0, score));
}

// Default Base Genome
export function createDefaultGenome(): CatGenome {
  return {
    bodyShape: 'chubby',
    furHue: 210,
    furSat: 8,
    furLit: 72,
    palettePreset: 'gray',
    pattern: 'tabby',
    ears: 'normal',
    eyes: 'dots',
    noseMouth: 'triangle',
    tail: 'striped',
    hat: 'top_hat',
    hatColorHex: '#6b4c3b',
    faceAccessory: 'none',
    neck: 'none',
    back: 'none',
    aura: 'none',
    rarity: 'common'
  };
}

// Base64 12-char Genome Encoding / Decoding
export function encodeGenome(g: CatGenome): string {
  const shapes: BodyShape[] = ['chubby', 'normal', 'slim', 'ball', 'long'];
  const patterns: PatternType[] = [
    'solid',
    'tabby',
    'spots',
    'tuxedo',
    'bicolor',
    'calico',
    'tortoiseshell',
    'siamese',
    'socks',
    'mask',
    'leopard',
    'smoky'
  ];
  const earsList: EarType[] = ['normal', 'folded', 'tufted', 'round', 'pointed'];
  const eyesList: EyeType[] = ['dots', 'happy', 'sleepy', 'shiny', 'wink', 'heterochromia', 'stars'];

  const bytes = new Uint8Array([
    shapes.indexOf(g.bodyShape) & 0x07,
    Math.round((g.furHue / 360) * 255),
    Math.round((g.furSat / 100) * 255),
    Math.round((g.furLit / 100) * 255),
    patterns.indexOf(g.pattern) & 0x0f,
    earsList.indexOf(g.ears) & 0x07,
    eyesList.indexOf(g.eyes) & 0x07,
    HATS_LIST.indexOf(g.hat) & 0x1f,
    ['none', 'glasses', 'sunglasses', 'monocle', 'blush', 'plaster', 'freckles', 'mustache'].indexOf(g.faceAccessory) & 0x07
  ]);

  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/=/g, '').slice(0, 12);
}

export function decodeGenome(code: string): CatGenome {
  try {
    const pad = code.padEnd(12, '=');
    const binary = atob(pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const shapes: BodyShape[] = ['chubby', 'normal', 'slim', 'ball', 'long'];
    const patterns: PatternType[] = [
      'solid',
      'tabby',
      'spots',
      'tuxedo',
      'bicolor',
      'calico',
      'tortoiseshell',
      'siamese',
      'socks',
      'mask',
      'leopard',
      'smoky'
    ];
    const earsList: EarType[] = ['normal', 'folded', 'tufted', 'round', 'pointed'];
    const eyesList: EyeType[] = ['dots', 'happy', 'sleepy', 'shiny', 'wink', 'heterochromia', 'stars'];

    return {
      bodyShape: shapes[bytes[0] % shapes.length] || 'chubby',
      furHue: Math.round(((bytes[1] || 150) / 255) * 360),
      furSat: Math.round(((bytes[2] || 20) / 255) * 100),
      furLit: Math.round(((bytes[3] || 70) / 255) * 100),
      pattern: patterns[bytes[4] % patterns.length] || 'tabby',
      ears: earsList[bytes[5] % earsList.length] || 'normal',
      eyes: eyesList[bytes[6] % eyesList.length] || 'dots',
      noseMouth: 'triangle',
      tail: 'striped',
      hat: HATS_LIST[bytes[7] % HATS_LIST.length] || 'none',
      faceAccessory:
        (['none', 'glasses', 'sunglasses', 'monocle', 'blush', 'plaster', 'freckles', 'mustache'] as FaceAccessory[])[
          bytes[8] % 8
        ] || 'none',
      neck: 'none',
      back: 'none',
      aura: 'none',
      rarity: 'common'
    };
  } catch {
    return createDefaultGenome();
  }
}

// Smart Random Cat Generator with 8 Candidates evaluation
export function generateSmartRandomCat(): CatGenome {
  const candidates: CatGenome[] = [];

  for (let i = 0; i < 8; i++) {
    const keys = Object.keys(NATURAL_PALETTES);
    const presetKey = keys[Math.floor(Math.random() * keys.length)];
    const p = NATURAL_PALETTES[presetKey];

    const shapes: BodyShape[] = ['chubby', 'normal', 'slim', 'ball', 'long'];
    const patterns: PatternType[] = [
      'solid',
      'tabby',
      'spots',
      'tuxedo',
      'bicolor',
      'calico',
      'siamese',
      'socks',
      'smoky'
    ];
    const earsList: EarType[] = ['normal', 'folded', 'tufted', 'round', 'pointed'];
    const eyesList: EyeType[] = ['dots', 'happy', 'sleepy', 'shiny', 'wink'];

    const hatIndex = Math.floor(Math.random() * HATS_LIST.length);
    const hat = HATS_LIST[hatIndex];

    const cand: CatGenome = {
      bodyShape: shapes[Math.floor(Math.random() * shapes.length)],
      furHue: p.h + Math.floor(Math.random() * 10 - 5),
      furSat: p.s,
      furLit: p.l,
      palettePreset: presetKey,
      pattern: patterns[Math.floor(Math.random() * patterns.length)],
      ears: earsList[Math.floor(Math.random() * earsList.length)],
      eyes: eyesList[Math.floor(Math.random() * eyesList.length)],
      noseMouth: 'triangle',
      tail: 'striped',
      hat,
      hatColorHex: hslToHex((p.h + 120) % 360, 60, 50),
      faceAccessory: Math.random() > 0.6 ? 'glasses' : 'none',
      neck: 'none',
      back: 'none',
      aura: 'none',
      rarity: Math.random() > 0.9 ? 'epic' : 'common'
    };

    candidates.push(cand);
  }

  // Select candidate with highest beauty score
  candidates.sort((a, b) => evaluateBeautyScore(b) - evaluateBeautyScore(a));
  return candidates[0];
}

// Tweak/Mutate current genome
export function mutateGenome(g: CatGenome): CatGenome {
  const mut = { ...g };
  mut.furHue = (mut.furHue + Math.floor(Math.random() * 40 - 20) + 360) % 360;
  mut.furLit = Math.min(90, Math.max(30, mut.furLit + Math.floor(Math.random() * 20 - 10)));
  const hatIndex = (HATS_LIST.indexOf(mut.hat) + 1) % HATS_LIST.length;
  mut.hat = HATS_LIST[hatIndex];
  return mut;
}
