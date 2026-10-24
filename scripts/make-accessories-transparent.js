import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';

const assetsDir = path.join(process.cwd(), 'public', 'assets');

const accessories = [
  'accessory-mushroom-hat.png',
  'accessory-pink-body-bow.png',
  'accessory-hat.png',
  'accessory-blue-tail-bow.png'
];

for (const file of accessories) {
  const filePath = path.join(assetsDir, file);
  if (!fs.existsSync(filePath)) continue;

  const data = fs.readFileSync(filePath);
  const png = PNG.sync.read(data);

  for (let y = 0; y < png.height; y++) {
    for (let x = 0; x < png.width; x++) {
      const idx = (png.width * y + x) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];

      // Convert pure white or near-white background pixels to transparent
      if (r > 240 && g > 240 && b > 240) {
        png.data[idx + 3] = 0;
      }
    }
  }

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(filePath, buffer);
  console.log(`Updated transparency for ${file}`);
}
