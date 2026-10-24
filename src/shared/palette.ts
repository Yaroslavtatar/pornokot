// Color Ramp & Hue-Shifted Palette Generator

export interface ColorRamp {
  outline: string;
  shade: string;
  base: string;
  highlight: string;
}

export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s)) / 100;
  l = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;

  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Hue Shifting Rule: Shift hues towards cool (blue/purple) in shadows, and warm (yellow) in highlights
export function generateHueShiftedRamp(baseHue: number, saturation = 35, lightness = 65): ColorRamp {
  // Outline: Dark + Cool Shift (-20deg hue), High Saturation, Low Lightness
  const outline = hslToHex(baseHue - 20, Math.min(60, saturation + 20), Math.max(12, lightness - 45));

  // Shade: Medium-Dark + Slight Cool Shift (-10deg hue)
  const shade = hslToHex(baseHue - 10, Math.min(50, saturation + 10), Math.max(25, lightness - 20));

  // Base: Target Hue & Lightness
  const base = hslToHex(baseHue, saturation, lightness);

  // Highlight: Light + Warm Shift (+15deg hue), Lower Saturation, High Lightness
  const highlight = hslToHex(baseHue + 15, Math.max(15, saturation - 10), Math.min(92, lightness + 20));

  return { outline, shade, base, highlight };
}

// 12 Natural + 3 Fantasy Preset Palettes
export const PRESET_FUR_PALETTES: Record<string, ColorRamp> = {
  // Natural Palettes
  gray: { outline: '#2e2b28', shade: '#827e7a', base: '#bbb8b2', highlight: '#e8e5e0' },
  lavender: { outline: '#2d253a', shade: '#8b7a9f', base: '#bdabd5', highlight: '#ebdcfb' },
  cream: { outline: '#3b3024', shade: '#b8a07c', base: '#ecd5aa', highlight: '#fcf2db' },
  cocoa: { outline: '#2d1e18', shade: '#704f42', base: '#a47662', highlight: '#d1a894' },
  black: { outline: '#121214', shade: '#282830', base: '#42424d', highlight: '#737380' },
  white: { outline: '#52545c', shade: '#c2c4cc', base: '#f0f2f5', highlight: '#ffffff' },
  ginger: { outline: '#3d1c10', shade: '#b85428', base: '#e87b48', highlight: '#fcae7c' },
  chocolate: { outline: '#1a0d08', shade: '#4d2a1c', base: '#70412e', highlight: '#996550' },
  blue: { outline: '#1a2736', shade: '#4d698a', base: '#7ca0c7', highlight: '#b5d3f5' },
  mint: { outline: '#183329', shade: '#48826e', base: '#7cbda8', highlight: '#bcf0e1' },
  peach: { outline: '#3d201c', shade: '#c4786a', base: '#f2a999', highlight: '#fcd9d2' },
  ash: { outline: '#232629', shade: '#646c73', base: '#99a3ab', highlight: '#cfd8e0' },

  // Rare Fantasy Palettes
  starry: { outline: '#100b29', shade: '#2a1b54', base: '#52349e', highlight: '#a384f5' },
  berry: { outline: '#33081b', shade: '#821f4a', base: '#bd3a72', highlight: '#f788b7' },
  golden: { outline: '#3d2805', shade: '#a67211', base: '#e0a324', highlight: '#fce074' }
};
