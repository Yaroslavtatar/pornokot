import { CATALOG, CatalogItem } from '../shared/catalog';
import { generateBuildingCanvas, generateTreeCanvas, generateFountainCanvas, PALETTE } from '../sprites';

export function renderObjectsGallery(container: HTMLElement) {
  container.innerHTML = `
    <div style="background: #f8f3e6; min-height: 100vh; padding: 24px; color: #465747; font-family: system-ui, sans-serif;">
      <div style="max-width: 1200px; margin: auto;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
          <div>
            <a href="/" style="color: #496e50; text-decoration: none; font-weight: bold; font-size: 14px;">← Назад в игру</a>
            <h1 style="font-family: Georgia, serif; font-size: 32px; margin: 8px 0 0; color: #49674f;">Каталог Объектов и Тайлов (${CATALOG.length}+ Типов)</h1>
          </div>
        </div>

        <div id="objects-categories"></div>
      </div>
    </div>
  `;

  const categories = Array.from(new Set(CATALOG.map(item => item.category)));
  const categoriesContainer = document.getElementById('objects-categories');
  if (!categoriesContainer) return;

  categories.forEach(cat => {
    const section = document.createElement('div');
    section.style.marginBottom = '32px';

    const categoryTitle =
      cat === 'tiles' ? 'Тайлы и Покрытия' :
      cat === 'benches' ? 'Скамейки и Места для Отдыха' :
      cat === 'lamps' ? 'Фонари и Освещение' :
      cat === 'fountains' ? 'Фонтаны и Водные Объекты' :
      cat === 'trees' ? 'Деревья и Растительность' :
      cat === 'nature' ? 'Декор Природы и Плед' :
      cat === 'fences' ? 'Заборы и Ограды' :
      cat === 'furniture' ? 'Уличная Мебель' : 'Здания и Магазины';

    section.innerHTML = `<h2 style="font-size: 20px; font-weight: bold; border-bottom: 2px solid #c9ccb8; padding-bottom: 8px; margin-bottom: 16px; color: #36543c;">${categoryTitle}</h2>`;

    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px;';

    const items = CATALOG.filter(i => i.category === cat);
    items.forEach(item => {
      const card = document.createElement('div');
      card.style.cssText = `
        background: white;
        border: 1px solid #e0dac6;
        border-radius: 12px;
        padding: 16px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(65, 99, 70, 0.06);
      `;

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(64, item.pixelSize.w);
      canvas.height = Math.max(64, item.pixelSize.h);
      canvas.style.cssText = 'image-rendering: pixelated; max-width: 100%; display: block; margin: auto;';

      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;

      if (item.category === 'buildings') {
        const bldgType = item.id.replace('bldg_', '');
        const bldg = generateBuildingCanvas(bldgType);
        canvas.width = bldg.width;
        canvas.height = bldg.height;
        ctx.drawImage(bldg, 0, 0);
      } else if (item.category === 'trees') {
        const tree = generateTreeCanvas();
        canvas.width = tree.width;
        canvas.height = tree.height;
        ctx.drawImage(tree, 0, 0);
      } else if (item.category === 'fountains') {
        const ftn = generateFountainCanvas();
        canvas.width = ftn.width;
        canvas.height = ftn.height;
        ctx.drawImage(ftn, 0, 0);
      } else {
        ctx.fillStyle = PALETTE.pathBeige;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = PALETTE.woodDark;
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(item.name.slice(0, 10), canvas.width / 2, canvas.height / 2);
      }

      card.appendChild(canvas);
      card.innerHTML += `
        <div style="font-size: 13px; font-weight: bold; margin-top: 10px;">${item.name}</div>
        <div style="font-size: 10px; color: #8a8c79; margin-top: 4px;">Размер: ${item.tileSize.w}x${item.tileSize.h} тайлов (${item.pixelSize.w}x${item.pixelSize.h}px)</div>
      `;

      grid.appendChild(card);
    });

    section.appendChild(grid);
    categoriesContainer.appendChild(section);
  });
}
