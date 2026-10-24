import { generateSmartRandomCat, encodeGenomeToBase64, ExtendedCatGenome } from '../shared/genome';
import { drawCatSprite, drawAccessory } from '../sprites';

export function renderCatsGallery(container: HTMLElement) {
  container.innerHTML = `
    <div style="background: #f8f3e6; min-height: 100vh; padding: 24px; color: #465747; font-family: system-ui, sans-serif;">
      <div style="max-width: 1200px; margin: auto;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
          <div>
            <a href="/" style="color: #496e50; text-decoration: none; font-weight: bold; font-size: 14px;">← Назад в игру</a>
            <h1 style="font-family: Georgia, serif; font-size: 32px; margin: 8px 0 0; color: #49674f;">Галлерея Котиков (100 Генераций)</h1>
          </div>
          <button id="regen-cats" style="background: #7a9365; color: white; border: 0; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">
            Сгенерировать ещё 100 ✿
          </button>
        </div>

        <div style="display: flex; gap: 12px; margin-bottom: 20px; align-items: center;">
          <label style="font-size: 13px; font-weight: 600;">Фильтр редкости:</label>
          <select id="rarity-filter" style="padding: 8px 12px; border-radius: 6px; border: 1px solid #c9ccb8; background: white;">
            <option value="all">Все редкости</option>
            <option value="common">Common (Обычные)</option>
            <option value="uncommon">Uncommon (Необычные)</option>
            <option value="rare">Rare (Редкие)</option>
            <option value="epic">Epic (Эпические)</option>
            <option value="legendary">Legendary (Легендарные)</option>
          </select>
        </div>

        <div id="cats-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;"></div>
      </div>
    </div>
  `;

  let cats: ExtendedCatGenome[] = [];

  function generateCatsList() {
    cats = [];
    const seedBase = String(Math.random());
    for (let i = 0; i < 100; i++) {
      cats.push(generateSmartRandomCat(`${seedBase}_cat_${i}`));
    }
    drawGrid();
  }

  function drawGrid() {
    const grid = document.getElementById('cats-grid');
    const filter = (document.getElementById('rarity-filter') as HTMLSelectElement)?.value || 'all';
    if (!grid) return;

    grid.innerHTML = '';
    const filtered = filter === 'all' ? cats : cats.filter(c => c.rarity === filter);

    filtered.forEach((cat, index) => {
      const card = document.createElement('div');
      card.style.cssText = `
        background: #ffffff;
        border: 1px solid #e0dac6;
        border-radius: 12px;
        padding: 14px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(65, 99, 70, 0.08);
      `;

      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 96;
      canvas.style.cssText = 'image-rendering: pixelated; width: 120px; height: 96px; display: block; margin: auto;';

      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.scale(3, 3);

      drawCatSprite(ctx, 4, 4, 'down', 0, cat.furPaletteKey as any, 'idle');
      drawAccessory(ctx, 4, 4, cat.hat, 'down', 'idle');

      const code = encodeGenomeToBase64(cat);

      const rarityColor =
        cat.rarity === 'legendary' ? '#f59e0b' :
        cat.rarity === 'epic' ? '#8b5cf6' :
        cat.rarity === 'rare' ? '#3b82f6' :
        cat.rarity === 'uncommon' ? '#10b981' : '#6b7280';

      card.appendChild(canvas);
      card.innerHTML += `
        <div style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: ${rarityColor}; margin-top: 8px;">
          ${cat.rarity}
        </div>
        <div style="font-size: 12px; font-weight: bold; margin: 4px 0 2px;">Котик #${index + 1}</div>
        <div style="font-size: 10px; color: #8a8c79; font-family: monospace;">Код: ${code}</div>
      `;

      grid.appendChild(card);
    });
  }

  document.getElementById('regen-cats')?.addEventListener('click', generateCatsList);
  document.getElementById('rarity-filter')?.addEventListener('change', drawGrid);

  generateCatsList();
}
