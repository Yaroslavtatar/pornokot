import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const assetsDir = path.join(process.cwd(), 'public', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

function createPNG(width, height) {
  const png = new PNG({ width, height });
  png.data.fill(0); // Transparent background
  return png;
}

function setPixel(png, x, y, r, g, b, a = 255) {
  if (x < 0 || x >= png.width || y < 0 || y >= png.height) return;
  const idx = (png.width * y + x) << 2;
  png.data[idx] = r;
  png.data[idx + 1] = g;
  png.data[idx + 2] = b;
  png.data[idx + 3] = a;
}

function fillRect(png, x, y, w, h, r, g, b, a = 255) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      setPixel(png, x + dx, y + dy, r, g, b, a);
    }
  }
}

function fillEllipse(png, cx, cy, rx, ry, r, g, b, a = 255) {
  for (let dy = -ry; dy <= ry; dy++) {
    for (let dx = -rx; dx <= rx; dx++) {
      if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1) {
        setPixel(png, Math.round(cx + dx), Math.round(cy + dy), r, g, b, a);
      }
    }
  }
}

// Colors for Pusheen sprite (tintable fur: r=g=b=200, dark outline: r=g=b=50, pink accent: r=240, g=140, b=160)
const FUR = [200, 196, 190]; // r-g <= 20, max >= 105 -> tintable!
const FUR_LIGHT = [220, 216, 210];
const OUTLINE = [55, 50, 45]; // max < 105 -> remains dark
const EYE = [45, 40, 35];
const PINK = [245, 135, 155]; // r-g = 110 > 20 -> remains pink blush!

function drawPusheenCat(png, offsetX, headTopY, tailX, tailY, legOffset = 0, isWalk = false, frame = 0) {
  const cx = offsetX + 30; // Body center x ~ 30
  const cy = 36; // Body center y ~ 36

  // Shadow under cat
  fillEllipse(png, cx, 47, 18, 5, 110, 130, 95, 80);

  // Tail (curves up towards tailX, tailY)
  // Base tail connected to rear (around cx + 12, cy)
  const tx0 = cx + 10, ty0 = cy + 4;
  const tx1 = offsetX + tailX, ty1 = tailY;
  for (let t = 0; t <= 1; t += 0.05) {
    const tx = Math.round(tx0 + (tx1 - tx0) * t);
    const ty = Math.round(ty0 + (ty1 - ty0) * t - Math.sin(t * Math.PI) * 4);
    fillEllipse(png, tx, ty, 3, 3, OUTLINE[0], OUTLINE[1], OUTLINE[2]);
    fillEllipse(png, tx, ty, 2, 2, FUR[0], FUR[1], FUR[2]);
  }

  // Back legs
  if (isWalk) {
    const l1 = (frame % 2 === 0) ? -2 : 2;
    fillRect(png, cx - 12 + l1, cy + 8, 5, 5, OUTLINE[0], OUTLINE[1], OUTLINE[2]);
    fillRect(png, cx - 11 + l1, cy + 8, 3, 4, FUR[0], FUR[1], FUR[2]);

    fillRect(png, cx + 8 - l1, cy + 8, 5, 5, OUTLINE[0], OUTLINE[1], OUTLINE[2]);
    fillRect(png, cx + 9 - l1, cy + 8, 3, 4, FUR[0], FUR[1], FUR[2]);
  } else {
    fillRect(png, cx - 12, cy + 8, 5, 4, OUTLINE[0], OUTLINE[1], OUTLINE[2]);
    fillRect(png, cx - 11, cy + 8, 3, 3, FUR[0], FUR[1], FUR[2]);

    fillRect(png, cx + 8, cy + 8, 5, 4, OUTLINE[0], OUTLINE[1], OUTLINE[2]);
    fillRect(png, cx + 9, cy + 8, 3, 3, FUR[0], FUR[1], FUR[2]);
  }

  // Main chubby oval body
  fillEllipse(png, cx, cy, 18, 13, OUTLINE[0], OUTLINE[1], OUTLINE[2]);
  fillEllipse(png, cx, cy, 17, 12, FUR[0], FUR[1], FUR[2]);

  // Head portion
  const hy = headTopY + 7;
  fillEllipse(png, cx - 4, hy + 2, 13, 10, OUTLINE[0], OUTLINE[1], OUTLINE[2]);
  fillEllipse(png, cx - 4, hy + 2, 12, 9, FUR[0], FUR[1], FUR[2]);

  // Ears (left ear & right ear)
  // Left ear
  const ear1X = cx - 12, ear1Y = headTopY;
  fillRect(png, ear1X, ear1Y, 5, 6, OUTLINE[0], OUTLINE[1], OUTLINE[2]);
  fillRect(png, ear1X + 1, ear1Y + 1, 3, 5, FUR[0], FUR[1], FUR[2]);

  // Right ear
  const ear2X = cx + 2, ear2Y = headTopY;
  fillRect(png, ear2X, ear2Y, 5, 6, OUTLINE[0], OUTLINE[1], OUTLINE[2]);
  fillRect(png, ear2X + 1, ear2Y + 1, 3, 5, FUR[0], FUR[1], FUR[2]);

  // Stripe on head
  fillRect(png, cx - 6, headTopY + 2, 3, 2, OUTLINE[0], OUTLINE[1], OUTLINE[2]);

  // Back stripes
  fillRect(png, cx + 4, cy - 8, 2, 5, OUTLINE[0], OUTLINE[1], OUTLINE[2]);
  fillRect(png, cx + 9, cy - 6, 2, 5, OUTLINE[0], OUTLINE[1], OUTLINE[2]);

  // Eyes (cute dots)
  setPixel(png, cx - 9, hy + 2, EYE[0], EYE[1], EYE[2]);
  setPixel(png, cx - 8, hy + 2, EYE[0], EYE[1], EYE[2]);

  setPixel(png, cx - 2, hy + 2, EYE[0], EYE[1], EYE[2]);
  setPixel(png, cx - 1, hy + 2, EYE[0], EYE[1], EYE[2]);

  // Pink cheeks
  fillRect(png, cx - 12, hy + 4, 2, 2, PINK[0], PINK[1], PINK[2]);
  fillRect(png, cx + 1, hy + 4, 2, 2, PINK[0], PINK[1], PINK[2]);

  // Mouth '3' / 'w'
  setPixel(png, cx - 6, hy + 4, OUTLINE[0], OUTLINE[1], OUTLINE[2]);
  setPixel(png, cx - 5, hy + 5, OUTLINE[0], OUTLINE[1], OUTLINE[2]);
  setPixel(png, cx - 4, hy + 4, OUTLINE[0], OUTLINE[1], OUTLINE[2]);

  // Whiskers
  setPixel(png, cx - 15, hy + 2, OUTLINE[0], OUTLINE[1], OUTLINE[2]);
  setPixel(png, cx - 14, hy + 3, OUTLINE[0], OUTLINE[1], OUTLINE[2]);
  setPixel(png, cx - 15, hy + 5, OUTLINE[0], OUTLINE[1], OUTLINE[2]);

  setPixel(png, cx + 5, hy + 2, OUTLINE[0], OUTLINE[1], OUTLINE[2]);
  setPixel(png, cx + 4, hy + 3, OUTLINE[0], OUTLINE[1], OUTLINE[2]);
  setPixel(png, cx + 5, hy + 5, OUTLINE[0], OUTLINE[1], OUTLINE[2]);
}

// 1. Generate pusheen-idle.png (7 frames, 448x64)
const headTopsIdle = [22, 22, 22, 22, 21, 21, 21];
const tailTipsIdle = [[46, 19], [46, 19], [46, 19], [46, 19], [46, 18], [46, 18], [46, 18]];
const pngIdle = createPNG(64 * 7, 64);
for (let f = 0; f < 7; f++) {
  drawPusheenCat(
    pngIdle,
    f * 64,
    headTopsIdle[f],
    tailTipsIdle[f][0],
    tailTipsIdle[f][1],
    0,
    false,
    f
  );
}
fs.writeFileSync(path.join(assetsDir, 'pusheen-idle.png'), PNG.sync.write(pngIdle));

// 2. Generate pusheen-walk.png (5 frames, 320x64)
const headTopsWalk = [22, 22, 21, 22, 23];
const tailTipsWalk = [[46, 19], [45, 19], [45, 18], [46, 19], [46, 20]];
const pngWalk = createPNG(64 * 5, 64);
for (let f = 0; f < 5; f++) {
  drawPusheenCat(
    pngWalk,
    f * 64,
    headTopsWalk[f],
    tailTipsWalk[f][0],
    tailTipsWalk[f][1],
    0,
    true,
    f
  );
}
fs.writeFileSync(path.join(assetsDir, 'pusheen-walk.png'), PNG.sync.write(pngWalk));

// 3. Generate accessory-mushroom-hat.png (64x64)
const pngMushroom = createPNG(64, 64);
// Red cap with white dots at (x=24..34, y=14..22)
fillEllipse(pngMushroom, 26, 18, 9, 6, 225, 65, 65); // Cap
fillEllipse(pngMushroom, 26, 18, 9, 6, 225, 65, 65);
fillRect(pngMushroom, 24, 18, 5, 2, 255, 255, 255); // Stem / brim
fillEllipse(pngMushroom, 23, 16, 2, 2, 255, 255, 255); // Dot 1
fillEllipse(pngMushroom, 28, 15, 2, 2, 255, 255, 255); // Dot 2
fillEllipse(pngMushroom, 31, 18, 1, 1, 255, 255, 255); // Dot 3
fs.writeFileSync(path.join(assetsDir, 'accessory-mushroom-hat.png'), PNG.sync.write(pngMushroom));

// 4. Generate accessory-blue-tail-bow.png (64x64)
const pngBlueBow = createPNG(64, 64);
// Blue bow around tail at (x=46, y=19)
fillEllipse(pngBlueBow, 43, 19, 4, 3, 85, 145, 225);
fillEllipse(pngBlueBow, 49, 19, 4, 3, 85, 145, 225);
fillEllipse(pngBlueBow, 46, 19, 2, 2, 50, 100, 180);
fs.writeFileSync(path.join(assetsDir, 'accessory-blue-tail-bow.png'), PNG.sync.write(pngBlueBow));

// 5. Generate accessory-pink-body-bow.png (64x64)
const pngPinkBow = createPNG(64, 64);
// Pink bow around neck/chest at (x=24, y=36)
fillEllipse(pngPinkBow, 21, 36, 4, 3, 245, 135, 175);
fillEllipse(pngPinkBow, 27, 36, 4, 3, 245, 135, 175);
fillEllipse(pngPinkBow, 24, 36, 2, 2, 210, 90, 130);
fs.writeFileSync(path.join(assetsDir, 'accessory-pink-body-bow.png'), PNG.sync.write(pngPinkBow));

// 6. Generate accessory-hat.png (64x64)
const pngHat = createPNG(64, 64);
// Top hat at (x=26, y=14)
fillRect(pngHat, 20, 19, 12, 2, 50, 50, 60); // Brim
fillRect(pngHat, 22, 11, 8, 8, 40, 40, 50); // Cylinder
fillRect(pngHat, 22, 17, 8, 2, 190, 60, 60); // Red ribbon band
fs.writeFileSync(path.join(assetsDir, 'accessory-hat.png'), PNG.sync.write(pngHat));

console.log('All game sprite assets successfully generated in public/assets!');
