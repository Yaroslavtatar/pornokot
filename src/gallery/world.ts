import { WorldState } from '../types';
import { Scene } from '../scene';

export function renderWorldGallery(container: HTMLElement) {
  const urlParams = new URLSearchParams(window.location.search);
  const seedParam = parseInt(urlParams.get('seed') || '12345', 10);

  container.innerHTML = `
    <div style="position: fixed; inset: 0; background: #84a96c; overflow: hidden;">
      <canvas id="gallery-world-canvas" style="display: block; width: 100%; height: 100%; image-rendering: pixelated;"></canvas>

      <div style="position: fixed; top: 16px; left: 16px; background: rgba(255, 250, 240, 0.92); border: 1px solid #d8cdb7; border-radius: 12px; padding: 14px; color: #3f5047; font-family: system-ui, sans-serif; box-shadow: 0 4px 16px rgba(0,0,0,0.15); z-index: 10;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px;">
          <a href="/" style="color: #496e50; text-decoration: none; font-weight: bold; font-size: 13px;">← Назад в игру</a>
          <span style="font-size: 11px; background: #e2f0d6; color: #36543c; padding: 2px 8px; border-radius: 10px; font-weight: bold;">FREE CAMERA INSPECTOR</span>
        </div>

        <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px;">Инспектор Мира</div>

        <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 12px;">
          <label style="font-size: 12px;">Seed:</label>
          <input id="world-seed-input" type="number" value="${seedParam}" style="width: 90px; padding: 4px 8px; border-radius: 6px; border: 1px solid #ccc;" />
          <button id="apply-seed-btn" style="background: #7a9365; color: white; border: 0; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">Применить</button>
        </div>

        <div style="font-size: 11px; color: #7e8571;">Управление: Перетаскивай мышью для перемещения камеры</div>
      </div>
    </div>
  `;

  const canvas = document.getElementById('gallery-world-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  const worldState: WorldState = { seed: seedParam, timeOfDay: 12, isNight: false };
  const scene = new Scene(canvas, worldState);

  // Free camera dragging
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;

  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    scene.camera.x -= dx / scene.zoom;
    scene.camera.y -= dy / scene.zoom;
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  document.getElementById('apply-seed-btn')?.addEventListener('click', () => {
    const input = document.getElementById('world-seed-input') as HTMLInputElement;
    if (input) {
      window.location.search = `?seed=${input.value}`;
    }
  });

  function renderLoop(time: number) {
    scene.draw([], 'inspector', time);
    requestAnimationFrame(renderLoop);
  }

  requestAnimationFrame(renderLoop);
}
