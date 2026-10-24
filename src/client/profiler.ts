// F3 Profiler Overlay Module

export interface ProfilerData {
  fps: number;
  frameTimeMs: number;
  drawCalls: number;
  chunksLoaded: number;
  entityCount: number;
  memoryMb?: number;
  pingMs?: number;
}

export class Profiler {
  visible = false;
  element: HTMLDivElement;
  frameCount = 0;
  lastTime = performance.now();
  currentFps = 60;
  frameTimes: number[] = [];

  constructor() {
    this.element = document.createElement('div');
    this.element.id = 'profiler-overlay';
    this.element.hidden = true;
    this.element.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(18, 24, 20, 0.88);
      color: #7de8a2;
      font-family: ui-monospace, 'Cascadia Code', monospace;
      font-size: 11px;
      line-height: 1.5;
      padding: 10px 14px;
      border: 1px solid #365e44;
      border-radius: 8px;
      z-index: 9999;
      pointer-events: none;
      box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    `;
    document.body.appendChild(this.element);

    window.addEventListener('keydown', e => {
      if (e.code === 'F3') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  toggle() {
    this.visible = !this.visible;
    this.element.hidden = !this.visible;
  }

  beginFrame(): number {
    return performance.now();
  }

  endFrame(startTime: number, extraData: Partial<ProfilerData> = {}) {
    const now = performance.now();
    const dt = now - startTime;
    this.frameTimes.push(dt);
    if (this.frameTimes.length > 30) this.frameTimes.shift();

    this.frameCount++;
    if (now - this.lastTime >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastTime));
      this.frameCount = 0;
      this.lastTime = now;
    }

    if (this.visible) {
      const avgDt = (this.frameTimes.reduce((a, b) => a + b, 0) / (this.frameTimes.length || 1)).toFixed(2);
      const mem = (performance as any).memory ? ((performance as any).memory.usedJSHeapSize / 1048576).toFixed(1) : null;

      this.element.innerHTML = `
        <div style="color: #ffd875; font-weight: bold; margin-bottom: 4px;">[F3 PROFILER OVERLAY]</div>
        <div>FPS: <b style="color: ${this.currentFps >= 50 ? '#7de8a2' : '#ff7a7a'}">${this.currentFps}</b> (${avgDt} ms/frame)</div>
        <div>Draw Calls: <b>${extraData.drawCalls || 0}</b></div>
        <div>Active Chunks: <b>${extraData.chunksLoaded || 0}</b></div>
        <div>Entities: <b>${extraData.entityCount || 0}</b></div>
        ${mem ? `<div>JS Heap: <b>${mem} MB</b></div>` : ''}
        ${extraData.pingMs ? `<div>Ping: <b>${extraData.pingMs} ms</b></div>` : ''}
      `;
    }
  }
}
