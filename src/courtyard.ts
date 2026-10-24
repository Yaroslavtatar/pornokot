import { WorldData, Building, WorldObject, Tree } from './types';

const box = (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) => {
  c.fillStyle = color;
  c.fillRect(Math.round(x), Math.round(y), w, h);
};

function patch(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, color: string) {
  c.fillStyle = color;
  for (let dy = -ry; dy <= ry; dy++) {
    const dx = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
    c.fillRect(x - dx, y + dy, dx * 2, 1);
  }
}

function flower(c: CanvasRenderingContext2D, x: number, y: number, tone: string) {
  box(c, x, y, 1, 6, '#53785c');
  box(c, x - 2, y + 3, 2, 1, '#739368');
  box(c, x - 2, y - 1, 5, 3, tone);
  box(c, x - 1, y - 2, 3, 5, tone);
  box(c, x, y, 1, 1, '#fff1c1');
}

function planting(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, seed: number) {
  patch(c, x + 2, y + 3, rx + 2, ry + 1, '#789369');
  patch(c, x, y, rx, ry, '#6a845e');
  patch(c, x, y - 2, rx - 3, ry - 2, '#93a16e');
  for (let i = 0; i < rx * 2; i++) {
    const a = i * 2.399 + seed;
    const r = Math.sqrt((i + 0.5) / (rx * 2));
    const px = Math.round(x + Math.cos(a) * r * (rx - 4));
    const py = Math.round(y + Math.sin(a) * r * (ry - 3));
    box(c, px - 2, py, 5, 2, i % 3 ? '#7c9665' : '#b0b380');
    if (i % 3 === 0) {
      flower(c, px, py - 3, ['#edd3bc', '#cf9ca4', '#e6c884'][i % 3 + Math.floor(i / 3) % 3] || '#c9bdcf');
    }
  }
}

export function paintCourtyard(c: CanvasRenderingContext2D, world: WorldData) {
  for (const p of world.paths) {
    box(c, p.x - 3, p.y - 3, p.w + 6, p.h + 6, '#8e9274');
    box(c, p.x, p.y, p.w, p.h, '#c7ba9c');
    c.save();
    c.beginPath();
    c.rect(p.x, p.y, p.w, p.h);
    c.clip();
    for (let y = Math.floor(p.y / 12) * 12; y < p.y + p.h; y += 12) {
      for (let x = Math.floor(p.x / 24) * 24 - (y % 24 ? 12 : 0); x < p.x + p.w; x += 24) {
        const k = ((x * 13 + y * 7) >>> 0) % 7;
        box(c, x + 1, y + 1, 23, 11, ['#d9cbb0', '#dfd1b6', '#d3c6aa', '#e1d3b9', '#d6c9ae', '#daceb3', '#ded0b5'][k]);
        box(c, x + 2, y + 1, 20, 1, '#e9ddc5');
        if (k === 2) box(c, x + 5, y + 8, 3, 1, '#c3b799');
      }
    }
    c.restore();
  }

  const p = { x: 608, y: 512, w: 320, h: 256 };
  box(c, p.x, p.y, p.w, p.h, '#ad9c86');
  box(c, p.x + 3, p.y + 3, p.w - 6, p.h - 6, '#d3c2a8');
  for (let y = 516; y < 765; y += 16) {
    for (let x = 612; x < 925; x += 16) {
      const k = ((x / 4 + y / 4) | 0) % 5;
      box(c, x, y, 15, 15, ['#e5d8c0', '#ddd0b7', '#e8ddc8', '#ded2bc', '#e2d5bd'][k]);
      box(c, x, y, 15, 1, '#f0e5d0');
    }
  }

  for (const [cx, cy, sx, sy] of [[608, 512, 1, 1], [927, 512, -1, 1], [608, 767, 1, -1], [927, 767, -1, -1]]) {
    for (let i = 0; i < 25; i++) {
      const span = Math.max(0, 25 - Math.round(Math.sqrt(625 - (25 - i) * (25 - i))));
      box(c, sx > 0 ? cx : cx - span, cy + sy * i, span + 1, 1, '#8cad72');
    }
    for (let i = 0; i < 6; i++) {
      const x = cx + sx * (3 + i * 3);
      const y = cy + sy * (17 - i * 2);
      box(c, x, y, 2, 3, '#719163');
      box(c, x + 2, y + 1, 2, 2, '#a2b481');
    }
  }

  for (const [radius, color] of [[61, '#c5b89f'], [59, '#eee0c7'], [55, '#d8cab1'], [48, '#e6d8bf']] as [number, string][]) {
    patch(c, 768, 568, radius, Math.round(radius * 0.62), color);
  }
  patch(c, 768, 568, 40, 23, '#b6ad96');
  for (let i = 0; i < 16; i++) {
    const a = (i * Math.PI) / 8;
    box(c, 768 + Math.cos(a) * 60, 568 + Math.sin(a) * 37, 2, 2, '#a99c85');
  }

  for (const x of [607, 925]) {
    for (let y = 512; y < 768; y += 10) {
      box(c, x, y, 3, 9, '#b18f79');
      box(c, x, y, 3, 1, '#dbc5a9');
    }
  }

  const plantingsArgs: [number, number, number, number, number][] = [
    [572, 552, 28, 35, 1],
    [965, 560, 29, 37, 4],
    [570, 733, 32, 25, 8],
    [969, 736, 30, 24, 2],
    [669, 792, 30, 12, 5],
    [862, 793, 32, 12, 4],
    [574, 475, 20, 14, 1],
    [898, 475, 20, 14, 2]
  ];
  for (const args of plantingsArgs) {
    planting(c, ...args);
  }

  for (const [x, y] of [[601, 622], [933, 622], [601, 691], [933, 691], [729, 777], [805, 777]]) {
    patch(c, x, y, 10, 5, '#9dad7b');
    for (let i = 0; i < 4; i++) {
      flower(c, x - 7 + i * 4, y - (i % 2) * 3, '#e5d6b4');
    }
  }

  box(c, 707, 481, 58, 5, '#9e907c');
  box(c, 704, 486, 64, 5, '#cbb99b');
  box(c, 705, 486, 62, 1, '#eddec4');
}

export function cafeDetail(c: CanvasRenderingContext2D, b: Building) {
  if (b.id !== 'cafe') return;

  for (const x of [b.x, b.x + b.w - 9]) {
    for (let y = b.y + 62; y < b.y + b.h - 12; y += 12) {
      box(c, x, y, 9, 10, '#e2c6a1');
      box(c, x, y, 9, 1, '#f7e1bd');
    }
  }
  for (let x = b.x + 12; x < b.x + b.w - 8; x += 20) {
    box(c, x, b.y + b.h - 10, 18, 7, '#beab8d');
    box(c, x, b.y + b.h - 10, 18, 1, '#e1d0b0');
  }

  for (let i = 0; i < 8; i++) {
    const x = b.x + 10 + i * 30;
    box(c, x, b.y + 64, 30, 18, i % 2 ? '#fff0d2' : '#bf7e72');
    box(c, x + 1, b.y + 80, 28, 3, i % 2 ? '#e8d9bb' : '#a36961');
  }

  for (const x of [b.x + 25, b.x + b.w - 65]) {
    box(c, x, b.y + 85, 40, 40, '#73928c');
    box(c, x + 3, b.y + 88, 15, 14, '#b2c2af');
    box(c, x + 22, b.y + 88, 14, 14, '#9fb9ac');
    box(c, x + 3, b.y + 108, 14, 14, '#d3be91');
    box(c, x + 22, b.y + 108, 14, 14, '#c6b387');
    box(c, x + 18, b.y + 85, 3, 40, '#f3dfbb');
    box(c, x, b.y + 104, 40, 3, '#f3dfbb');
    box(c, x + 5, b.y + 89, 2, 11, '#d5e1c6');
  }

  box(c, b.x + 94, b.y + 83, 68, 21, '#795e50');
  box(c, b.x + 96, b.y + 85, 64, 17, '#bd8b70');
  box(c, b.x + 117, b.y + 89, 19, 8, '#fae5bd');
  box(c, b.x + 136, b.y + 90, 4, 5, '#fae5bd');
  box(c, b.x + 139, b.y + 91, 1, 3, '#bd8b70');
  box(c, b.x + 114, b.y + 98, 25, 2, '#fae5bd');
  box(c, b.x + 122, b.y + 86, 1, 2, '#efcc9e');
}

export function roofDetail(c: CanvasRenderingContext2D, b: Building, terrain: HTMLCanvasElement) {
  if (b.id !== 'cafe') return;

  c.drawImage(terrain, b.x - 10, b.y - 20, b.w + 20, 80, b.x - 10, b.y - 20, b.w + 20, 80);
  for (let row = 0; row < 7; row++) {
    const y = b.y - 12 + row * 10;
    const inset = 23 - row * 5;
    const left = b.x + inset;
    const width = b.w - inset * 2;
    box(c, left - 2, y, width + 4, 10, '#90645f');
    for (let x = left; x < left + width; x += 18) {
      box(c, x, y, 17, 8, row % 2 ? '#bc8177' : '#c48c7e');
      box(c, x + 1, y, 15, 2, '#dba18c');
      box(c, x + 2, y + 7, 13, 1, '#a47169');
    }
  }
  box(c, b.x - 9, b.y + 56, b.w + 18, 4, '#7d5e57');
  box(c, b.x - 4, b.y + 60, b.w + 8, 3, '#f1d7b2');

  box(c, b.x + 184, b.y - 15, 19, 28, '#a38172');
  for (let y = b.y - 12; y < b.y + 12; y += 6) {
    box(c, b.x + 185, y, 17, 1, '#c4a38c');
    box(c, b.x + 192 + (y % 12 ? 4 : 0), y, 1, 6, '#876e62');
  }
  box(c, b.x + 181, b.y - 18, 25, 5, '#755e57');
}

export function cozyGround(c: CanvasRenderingContext2D) {
  const x = 538;
  const y = 781;
  patch(c, x + 20, y + 13, 29, 12, '#7f986b');
  box(c, x, y, 43, 26, '#d6bea2');
  for (let j = 0; j < 5; j++) {
    for (let i = 0; i < 8; i++) {
      box(c, x + i * 5, y + j * 5, 5, 5, (i + j) % 2 ? '#eedcc5' : '#c89491');
    }
  }
  for (let i = 0; i < 8; i++) {
    box(c, x + i * 5, y - 2, 1, 2, '#f1e1c7');
    box(c, x + i * 5, y + 26, 1, 2, '#f1e1c7');
  }

  box(c, x + 7, y + 7, 15, 10, '#8b7865');
  box(c, x + 8, y + 6, 6, 9, '#fff0cd');
  box(c, x + 15, y + 7, 6, 9, '#ecdbb6');
  box(c, x + 14, y + 7, 1, 9, '#ad9776');
  for (let k = 0; k < 3; k++) {
    box(c, x + 9, y + 8 + k * 2, 4, 1, '#bca988');
  }
  patch(c, x + 31, y + 18, 6, 2, '#a78676');
  patch(c, x + 31, y + 16, 6, 2, '#f3e5c9');
  box(c, x + 28, y + 10, 6, 6, '#f5e6ca');
  box(c, x + 29, y + 10, 4, 1, '#866a56');
  box(c, x + 34, y + 11, 2, 3, '#f5e6ca');
  box(c, x + 24, y + 21, 4, 3, '#b98f63');
}

export function furnitureDetail(c: CanvasRenderingContext2D, o: WorldObject) {
  if (o.type === 'bench') {
    for (const x of [o.x - 27, o.x + 25]) {
      box(c, x, o.y - 14, 2, 28, '#52645a');
      box(c, x - 2, o.y - 14, 6, 2, '#56655a');
      box(c, x - 2, o.y - 3, 6, 2, '#52645a');
      box(c, x - 1, o.y + 13, 5, 2, '#48594e');
    }
    for (let i = 0; i < 3; i++) {
      box(c, o.x - 25, o.y - 18 + i * 5, 49, 1, '#e0c293');
      box(c, o.x - 11 + i * 8, o.y - 17 + i * 5, 10, 1, '#aa8b65');
      for (const x of [o.x - 24, o.x + 23]) {
        box(c, x, o.y - 17 + i * 5, 1, 1, '#796e57');
      }
    }
    box(c, o.x - 27, o.y - 4, 54, 1, '#e4bf8b');
    box(c, o.x - 26, o.y + 3, 52, 1, '#896c52');
  }
  if (o.type === 'fountain') {
    for (const [x, y, w] of [
      [-22, -7, 11],
      [11, 2, 13],
      [-14, 5, 9],
      [17, -6, 5]
    ]) {
      box(c, o.x + x, o.y + y, w, 1, '#bad8c6');
    }
    for (const [x, y] of [
      [-31, 1],
      [-21, 10],
      [5, 13],
      [27, 7]
    ]) {
      box(c, o.x + x, o.y + y, 4, 2, '#a9ad90');
      box(c, o.x + x, o.y + y - 1, 4, 1, '#efdfbd');
    }
    box(c, o.x - 8, o.y - 17, 3, 9, '#a4b5a1');
    box(c, o.x - 3, o.y - 24, 2, 10, '#edf0cd');
  }
}

export function gardenTree(c: CanvasRenderingContext2D, t: Tree): boolean {
  if (!((t.x === 480 && t.y === 416) || (t.x === 960 && t.y === 352) || (t.x === 480 && t.y === 864))) return false;
  const x = t.x;
  const y = t.y;

  patch(c, x + 6, y + 4, 35, 10, '#6c865c');
  box(c, x - 8, y - 48, 16, 48, '#685f4d');
  box(c, x - 5, y - 48, 10, 45, '#977e58');
  box(c, x - 4, y - 43, 3, 31, '#ba9b69');
  box(c, x + 4, y - 35, 3, 27, '#79684e');
  box(c, x - 11, y - 1, 24, 3, '#766a4e');
  box(c, x - 15, y + 2, 7, 2, '#73664b');
  box(c, x + 9, y, 9, 2, '#73664b');
  const lobes = [
    [-32, -65, 25, 22],
    [27, -64, 27, 24],
    [-29, -89, 24, 23],
    [17, -91, 30, 26],
    [-5, -105, 27, 21],
    [-3, -72, 34, 26]
  ];
  for (const [dx, dy, rx, ry] of lobes) {
    patch(c, x + dx, y + dy, rx, ry, '#446b52');
  }
  for (const [dx, dy, rx, ry] of lobes) {
    patch(c, x + dx - 2, y + dy - 4, rx - 3, ry - 4, '#6e9365');
    patch(c, x + dx - 5, y + dy - 9, rx - 7, ry - 9, '#90aa73');
  }
  for (const [dx, dy] of [
    [-38, -94],
    [-12, -115],
    [16, -108],
    [33, -83],
    [-27, -69],
    [2, -85],
    [-2, -55]
  ]) {
    box(c, x + dx, y + dy, 7, 2, '#b3bd85');
    box(c, x + dx - 3, y + dy + 2, 9, 2, '#a1b67b');
    box(c, x + dx + 8, y + dy + 10, 5, 2, '#517b57');
  }
  return true;
}
