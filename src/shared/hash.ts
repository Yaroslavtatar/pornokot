// FNV-1a 64-bit deterministic hash and 2D domain-warped fBm noise

export function fnv1a64(str: string): bigint {
  let hash = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let i = 0; i < str.length; i++) {
    hash ^= BigInt(str.charCodeAt(i));
    hash = (hash * prime) & 0xffffffffffffffffn;
  }
  return hash;
}

export function seedPRNG(seed: number | bigint): () => number {
  let s = typeof seed === 'bigint' ? Number(seed & 0x7fffffffn) : Math.abs(seed) || 12345;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function hash2D(seed: number, x: number, y: number): number {
  let n = Math.sin(x * 12.9898 + y * 78.233 + seed * 43758.5453) * 43758.5453;
  return n - Math.floor(n);
}

export function smoothNoise2D(seed: number, x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = x0 + 1;
  const y1 = y0 + 1;

  const dx = x - x0;
  const dy = y - y0;

  // Smoothstep interpolation
  const sx = dx * dx * (3 - 2 * dx);
  const sy = dy * dy * (3 - 2 * dy);

  const n00 = hash2D(seed, x0, y0);
  const n10 = hash2D(seed, x1, y0);
  const n01 = hash2D(seed, x0, y1);
  const n11 = hash2D(seed, x1, y1);

  const top = n00 + sx * (n10 - n00);
  const bottom = n01 + sx * (n11 - n01);

  return top + sy * (bottom - top);
}

// Fractional Brownian Motion (fBm) with Octaves
export function fbm2D(seed: number, x: number, y: number, octaves = 4, persistence = 0.5, lacunarity = 2.0): number {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    total += smoothNoise2D(seed + i * 100, x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }

  return total / maxValue;
}

// Domain Warped fBm Noise for natural biomes, rivers and coastlines
export function domainWarpNoise2D(seed: number, x: number, y: number): number {
  const qx = fbm2D(seed, x, y, 3);
  const qy = fbm2D(seed + 123, x + 5.2, y + 1.3, 3);

  const rx = fbm2D(seed + 456, x + 4.0 * qx + 1.7, y + 4.0 * qy + 9.2, 3);
  const ry = fbm2D(seed + 789, x + 4.0 * qx + 8.3, y + 4.0 * qy + 2.8, 3);

  return fbm2D(seed + 999, x + 4.0 * rx, y + 4.0 * ry, 4);
}
