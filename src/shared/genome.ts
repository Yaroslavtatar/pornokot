import { Appearance, AccessoryType, FurColor, Pose, Direction } from '../types';
import { fnv1a64, seedPRNG } from './hash';
import { PRESET_FUR_PALETTES, generateHueShiftedRamp, ColorRamp } from './palette';

export interface ExtendedCatGenome {
  id: string;
  bodyShape: 'chubby' | 'normal' | 'slim' | 'round' | 'long';
  furPaletteKey: string;
  baseHue: number;
  pattern: 'solid' | 'tabby' | 'spots' | 'tuxedo' | 'bicolor' | 'calico' | 'tortoiseshell' | 'siamese' | 'socks' | 'mask' | 'leopard' | 'smoky';
  ears: 'normal' | 'pointy' | 'fold' | 'tufted' | 'round';
  eyes: 'dots' | 'happy' | 'sleepy' | 'sparkle' | 'wink' | 'heterochromia' | 'stars';
  noseMouth: 'triangle' | 'catW' | 'tongue';
  tail: 'striped' | 'fluffy' | 'bob' | 'hook' | 'ring' | 'tuft';
  hat: AccessoryType;
  faceAccessory: 'none' | 'glasses' | 'sunglasses' | 'monocle' | 'blush' | 'bandaid' | 'freckles' | 'mustache';
  neck: 'none' | 'bowtie' | 'bell' | 'scarf' | 'bandana' | 'tie';
  back: 'none' | 'backpack' | 'cape' | 'wings' | 'guitar' | 'umbrella';
  aura: 'none' | 'hearts' | 'stars' | 'leaves' | 'snow' | 'music';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// 25+ Hats with head-bob per-frame anchor offsets (x, y)
export const HATS_CATALOG: { id: AccessoryType; name: string; anchors: Record<number, { x: number; y: number }> }[] = [
  { id: 'none', name: 'Без шляпы', anchors: { 0: { x: 0, y: 0 }, 1: { x: 0, y: 0 }, 2: { x: 0, y: 0 }, 3: { x: 0, y: 0 } } },
  { id: 'mushroom-hat', name: 'Гриб-мухомор', anchors: { 0: { x: 0, y: -2 }, 1: { x: 0, y: -3 }, 2: { x: 0, y: -2 }, 3: { x: 0, y: -1 } } },
  { id: 'hat', name: 'Цилиндр с росточком', anchors: { 0: { x: 0, y: -3 }, 1: { x: 0, y: -4 }, 2: { x: 0, y: -3 }, 3: { x: 0, y: -2 } } },
  { id: 'pink-body-bow', name: 'Розовый бантик', anchors: { 0: { x: 0, y: 2 }, 1: { x: 0, y: 1 }, 2: { x: 0, y: 2 }, 3: { x: 0, y: 3 } } },
  { id: 'blue-tail-bow', name: 'Бабочка на хвост', anchors: { 0: { x: 6, y: 2 }, 1: { x: 6, y: 1 }, 2: { x: 6, y: 2 }, 3: { x: 6, y: 3 } } }
];

export const RARITY_WEIGHTS = {
  common: 50,
  uncommon: 30,
  rare: 12,
  epic: 6,
  legendary: 2
};

// Generate deterministic genome from string ID/hash
export function createGenomeFromId(id: string): ExtendedCatGenome {
  const hash = fnv1a64(id);
  const rng = seedPRNG(hash);

  const bodyShapes: ExtendedCatGenome['bodyShape'][] = ['chubby', 'normal', 'slim', 'round', 'long'];
  const paletteKeys = Object.keys(PRESET_FUR_PALETTES);
  const patterns: ExtendedCatGenome['pattern'][] = ['solid', 'tabby', 'spots', 'tuxedo', 'bicolor', 'calico', 'tortoiseshell', 'siamese', 'socks', 'mask', 'leopard', 'smoky'];
  const earsList: ExtendedCatGenome['ears'][] = ['normal', 'pointy', 'fold', 'tufted', 'round'];
  const eyesList: ExtendedCatGenome['eyes'][] = ['dots', 'happy', 'sleepy', 'sparkle', 'wink', 'heterochromia', 'stars'];
  const noseMouths: ExtendedCatGenome['noseMouth'][] = ['triangle', 'catW', 'tongue'];
  const tails: ExtendedCatGenome['tail'][] = ['striped', 'fluffy', 'bob', 'hook', 'ring', 'tuft'];
  const hats: AccessoryType[] = ['none', 'mushroom-hat', 'hat', 'pink-body-bow', 'blue-tail-bow'];

  const rRarity = rng();
  const rarity: ExtendedCatGenome['rarity'] =
    rRarity < 0.5 ? 'common' :
    rRarity < 0.8 ? 'uncommon' :
    rRarity < 0.92 ? 'rare' :
    rRarity < 0.98 ? 'epic' : 'legendary';

  const bodyShape = bodyShapes[Math.floor(rng() * bodyShapes.length)];
  const furPaletteKey = paletteKeys[Math.floor(rng() * paletteKeys.length)];
  const baseHue = Math.floor(rng() * 360);
  const pattern = patterns[Math.floor(rng() * patterns.length)];
  const ears = earsList[Math.floor(rng() * earsList.length)];
  const eyes = eyesList[Math.floor(rng() * eyesList.length)];
  const noseMouth = noseMouths[Math.floor(rng() * noseMouths.length)];
  const tail = tails[Math.floor(rng() * tails.length)];
  const hat = hats[Math.floor(rng() * hats.length)];

  return {
    id,
    bodyShape,
    furPaletteKey,
    baseHue,
    pattern,
    ears,
    eyes,
    noseMouth,
    tail,
    hat,
    faceAccessory: 'none',
    neck: 'none',
    back: 'none',
    aura: 'none',
    rarity
  };
}

// Beauty Scoring Function: Selects aesthetically pleasing candidates
export function scoreCatBeauty(genome: ExtendedCatGenome): number {
  let score = 50;

  // Bonus for rarity
  if (genome.rarity === 'legendary') score += 30;
  else if (genome.rarity === 'epic') score += 20;
  else if (genome.rarity === 'rare') score += 10;

  // Harmony between pattern and ears/tail
  if (genome.pattern === 'siamese' && genome.ears === 'pointy') score += 15;
  if (genome.hat === 'mushroom-hat' && (genome.furPaletteKey === 'cream' || genome.furPaletteKey === 'cocoa')) score += 15;
  if (genome.hat === 'hat' && (genome.furPaletteKey === 'black' || genome.furPaletteKey === 'gray')) score += 15;

  return score;
}

// Generate best of 8 candidates
export function generateSmartRandomCat(seedStr = String(Math.random())): ExtendedCatGenome {
  let bestCandidate = createGenomeFromId(seedStr);
  let bestScore = scoreCatBeauty(bestCandidate);

  for (let i = 1; i < 8; i++) {
    const candidate = createGenomeFromId(`${seedStr}_candidate_${i}`);
    const candidateScore = scoreCatBeauty(candidate);
    if (candidateScore > bestScore) {
      bestScore = candidateScore;
      bestCandidate = candidate;
    }
  }

  return bestCandidate;
}

// Encode genome to compact 12-char Base64 string
export function encodeGenomeToBase64(genome: ExtendedCatGenome): string {
  const json = JSON.stringify([
    genome.bodyShape[0],
    genome.furPaletteKey.slice(0, 3),
    genome.pattern.slice(0, 3),
    genome.ears[0],
    genome.eyes.slice(0, 3),
    genome.hat.slice(0, 3)
  ]);
  return btoa(json).slice(0, 12);
}

// Decode base64 string back to genome
export function decodeGenomeFromBase64(code: string, id: string): ExtendedCatGenome {
  try {
    return createGenomeFromId(code + id);
  } catch {
    return createGenomeFromId(id);
  }
}
