import './index.css';
import { movement, createInputSender, MovementInput } from './input';
import { inputPacket, nearestProp, acceptSnapshot, reconnectDelay } from './protocol';
import { accessoryChoices, accessoryLabels, normalizeAccessory } from './render';
import { Scene } from './scene';
import { updateHud } from './perf-hud';
import { Profiler } from './client/profiler';
import { Player, WorldState, Appearance, FurColor, AccessoryType, WSMessage, TileProp } from './types';
import { renderCatsGallery } from './gallery/cats';
import { renderObjectsGallery } from './gallery/objects';
import { renderWorldGallery } from './gallery/world';

// Client Router
const pathname = window.location.pathname;

if (pathname === '/gallery/cats') {
  renderCatsGallery(document.body);
} else if (pathname === '/gallery/objects') {
  renderObjectsGallery(document.body);
} else if (pathname === '/gallery/world') {
  renderWorldGallery(document.body);
} else {
  // Main Multiplayer Game
  bootMainGame();
}

function bootMainGame() {
  const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T | null;

  let selfId: string;
  let worldState: WorldState = { seed: 98765, timeOfDay: 12, isNight: false };
  let scene: Scene | null = null;
  let players: Player[] = [];
  let socket: WebSocket | null = null;
  let seq = 0;
  let retry = 0;
  let connected = false;
  const keys = new Set<string>();
  let touch: MovementInput = { dx: 0, dy: 0 };
  let draft: Appearance = { fur: 'gray', accessory: 'none' };
  let profilePending = false;
  let noticeTimer: any = null;
  let entered = false;
  let entryPending = false;
  let entryReady = false;

  const profiler = new Profiler();
  const inputSender = createInputSender(m => send(inputPacket(m, ++seq)));

  function flushInput() {
    if (!connected) return;
    const target = document.activeElement;
    const wardrobe = $<HTMLDialogElement>('wardrobe');
    const blocked = (wardrobe && wardrobe.open) || document.hidden;
    let m = blocked ? { dx: 0, dy: 0 } : movement(keys, target);
    if (
      !blocked &&
      target &&
      !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) &&
      !(target as HTMLElement).isContentEditable &&
      (touch.dx || touch.dy)
    ) {
      m = { ...touch };
    }
    inputSender.poll(m, performance.now());
  }

  setInterval(flushInput, 20);

  const me = () => players.find(p => p.id === selfId);
  const mobileHud = matchMedia('(max-width:700px)');

  function getVisibleProps(): TileProp[] {
    if (!scene) return [];
    const props: TileProp[] = [];
    for (const chunk of scene.chunks.values()) {
      const chunkX = chunk.cx * 256;
      const chunkY = chunk.cy * 256;
      for (const p of chunk.props) {
        props.push({ ...p, x: chunkX + p.x, y: chunkY + p.y });
      }
    }
    return props;
  }

  function refreshHud() {
    const interactBtn = $<HTMLButtonElement>('interact');
    const sleepBtn = $<HTMLButtonElement>('sleep');
    if (interactBtn && sleepBtn) {
      updateHud({ interact: interactBtn, sleep: sleepBtn }, me(), getVisibleProps(), mobileHud.matches);
    }
  }

  mobileHud.addEventListener('change', refreshHud);

  function notice(text: string, delay = 4000) {
    clearTimeout(noticeTimer);
    const el = $('notice');
    if (el) el.textContent = text;
    if (delay && el) {
      noticeTimer = setTimeout(() => {
        el.textContent = '';
      }, delay);
    }
  }

  function send(data: any) {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data));
      return true;
    }
    notice('Нет связи. Подключаемся снова…');
    return false;
  }

  function resetInput() {
    keys.clear();
    touch = { dx: 0, dy: 0 };
    const stick = $('stick');
    if (stick) stick.style.transform = '';
    flushInput();
  }

  function history(name: string, text: string) {
    const historyEl = $('history');
    if (!historyEl) return;
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = name + ': ';
    li.append(strong, document.createTextNode(text));
    historyEl.append(li);
    while (historyEl.children.length > 80) {
      historyEl.firstChild?.remove();
    }
    historyEl.scrollTop = historyEl.scrollHeight;
  }

  function connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL('/ws', location.href);
      url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(url.href);
      socket = ws;
      let welcomed = false;

      const timeout = setTimeout(() => {
        if (!welcomed) {
          ws.close();
          reject(new Error('Не удалось подключиться. Нажми «Играть», чтобы повторить.'));
        }
      }, 8000);

      ws.onmessage = event => {
        if (socket !== ws) return;
        let msg: WSMessage;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        if (msg.worldState) {
          worldState = msg.worldState;
          if (scene) scene.worldState = worldState;
          const clockEl = $('clock');
          if (clockEl) {
            const hours = Math.floor(worldState.timeOfDay) % 24;
            const minutes = Math.floor((worldState.timeOfDay % 1) * 60);
            const hh = hours.toString().padStart(2, '0');
            const mm = minutes.toString().padStart(2, '0');
            const icon = worldState.timeOfDay >= 6 && worldState.timeOfDay < 19 ? '☀️' : '🌙';
            clockEl.textContent = `${hh}:${mm} ${icon}`;
          }
        }

        const state = acceptSnapshot(msg);
        if (state) {
          players = state.players || [];
          selfId = state.selfId || selfId;

          if (!welcomed && msg.type === 'welcome' && me()) {
            welcomed = true;
            clearTimeout(timeout);
            entered = true;

            const entryEl = $('entry');
            const gameEl = $('game');
            if (entryEl) entryEl.hidden = true;
            if (gameEl) {
              gameEl.hidden = false;
              gameEl.inert = false;
            }
            (document.activeElement as HTMLElement)?.blur();
            resolve();
          }

          if (!connected) {
            connected = true;
            retry = 0;
            $('signal')?.classList.add('live');
            notice('Ты на поляне. Устраивайся поуютнее ✿');
          }

          const n = players.length;
          const online = `${n} онлайн`;
          const onlineEl = $('online');
          if (onlineEl && onlineEl.textContent !== online) {
            onlineEl.textContent = online;
          }

          refreshHud();

          if (profilePending) {
            const p = me();
            const nameInput = $<HTMLInputElement>('name');
            if (
              p &&
              nameInput &&
              p.name === nameInput.value.trim() &&
              p.appearance.fur === draft.fur &&
              p.appearance.accessory === draft.accessory
            ) {
              profilePending = false;
              ($<HTMLDialogElement>('wardrobe'))?.close();
              notice('Образ сохранён');
            }
          }
          return;
        }

        if (msg.type === 'chat' && msg.name && msg.text) {
          history(msg.name, msg.text);
        }

        if (msg.type === 'error') {
          notice(msg.message || 'Действие недоступно');
          if (profilePending) {
            profilePending = false;
            const statusEl = $('profile-status');
            if (statusEl) statusEl.textContent = msg.message || 'Не удалось сохранить';
          }
        }
      };

      ws.onclose = event => {
        if (socket !== ws) return;
        clearTimeout(timeout);
        if (!welcomed && !entered) {
          reject(new Error('Не удалось войти. Попробуй нажать «Играть» ещё раз.'));
          return;
        }

        connected = false;
        resetInput();
        $('signal')?.classList.remove('live');
        const onlineEl = $('online');
        if (onlineEl) onlineEl.textContent = 'Нет связи';
        profilePending = false;

        const delay = reconnectDelay(event.code, retry++);
        if (delay === null) {
          notice('Этот котик открыт в другой вкладке. Продолжай там или обнови эту страницу.', 0);
          return;
        }

        notice('Связь потеряна. Возвращаемся на поляну…', 0);
        setTimeout(() => connect().catch(() => {}), delay);
      };

      ws.onerror = () => {};
    });
  }

  function doInteract() {
    const o = nearestProp(me(), getVisibleProps());
    if (o) {
      send({
        type: 'interact',
        objectId: o.id
      });
    }
  }

  window.addEventListener('keydown', e => {
    if (!entered) return;
    const target = e.target as HTMLElement;
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable;
    const wardrobe = $<HTMLDialogElement>('wardrobe');

    if (e.code === 'Escape') {
      resetInput();
      if (e.target === $('chat')) (e.target as HTMLElement).blur();
      return;
    }

    if ((wardrobe && wardrobe.open) || typing) return;

    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
      keys.add(e.code);
    }

    if (e.code === 'KeyE' && !e.repeat) {
      doInteract();
    }

    if (e.code === 'Enter') {
      e.preventDefault();
      $('chat')?.focus();
      resetInput();
    }
  });

  window.addEventListener('keyup', e => {
    keys.delete(e.code);
    flushInput();
  });

  window.addEventListener('blur', resetInput);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) resetInput();
  });
  document.addEventListener('focusin', e => {
    const target = e.target as HTMLElement;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
      resetInput();
    }
  });

  const interactBtn = $('interact');
  if (interactBtn) interactBtn.onclick = doInteract;

  const chatForm = $('chat-form');
  if (chatForm) {
    chatForm.onsubmit = e => {
      e.preventDefault();
      const chatInput = $<HTMLInputElement>('chat');
      if (!chatInput) return;
      const text = chatInput.value.trim();
      if (text && send({ type: 'chat', text })) {
        chatInput.value = '';
        chatInput.blur();
      }
    };
  }

  const chatToggle = $('chat-toggle');
  if (chatToggle) {
    chatToggle.onclick = () => {
      const panel = $('chat-panel');
      if (panel) {
        const collapsed = panel.classList.toggle('collapsed');
        chatToggle.setAttribute('aria-expanded', String(!collapsed));
      }
    };
  }

  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-emote]')) {
    button.onclick = () => {
      const kind = button.dataset.emote;
      if (kind) {
        send({ type: 'emote', kind });
      }
    };
  }

  const sleepBtn = $('sleep');
  if (sleepBtn) {
    sleepBtn.onclick = () => {
      resetInput();
      send({
        type: 'pose',
        pose: me()?.pose === 'sleep' ? 'idle' : 'sleep'
      });
    };
  }

  const names: Record<string, string> = {
    gray: 'Серый',
    lavender: 'Сирень',
    cream: 'Крем',
    cocoa: 'Какао',
    none: 'Без',
    ...accessoryLabels
  };

  const accessoryTitles: Record<string, string> = {
    ...accessoryLabels,
    none: 'Без аксессуара'
  };

  const colors: Record<string, string> = {
    gray: '#bbb8b2',
    lavender: '#bdabd5',
    cream: '#ecd5aa',
    cocoa: '#a47662'
  };

  const choiceConfigs: [string, string[], 'fur' | 'accessory'][] = [
    ['furs', ['gray', 'lavender', 'cream', 'cocoa'], 'fur'],
    ['accessories', accessoryChoices as string[], 'accessory'],
    ['entry-furs', ['gray', 'lavender', 'cream', 'cocoa'], 'fur'],
    ['entry-accessories', accessoryChoices as string[], 'accessory']
  ];

  for (const [containerId, values, key] of choiceConfigs) {
    const container = $(containerId);
    if (!container) continue;

    for (const value of values) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.value = value;

      if (key === 'fur') {
        const s = document.createElement('span');
        s.className = 'swatch';
        s.style.background = colors[value];
        b.append(s);
      } else {
        b.title = accessoryTitles[value] || value;
        b.setAttribute('aria-label', accessoryTitles[value] || value);
      }

      b.append(document.createTextNode(names[value] || value));
      b.onclick = () => {
        if (key === 'fur') draft.fur = value as FurColor;
        if (key === 'accessory') draft.accessory = value as AccessoryType;
        refreshChoices();
      };
      container.append(b);
    }
  }

  function refreshChoices() {
    for (const [id, key] of [
      ['furs', 'fur'],
      ['accessories', 'accessory'],
      ['entry-furs', 'fur'],
      ['entry-accessories', 'accessory']
    ] as const) {
      const el = $(id);
      if (!el) continue;
      for (const child of Array.from(el.children) as HTMLElement[]) {
        const val = child.dataset.value;
        const pressed = key === 'fur' ? val === draft.fur : val === draft.accessory;
        child.setAttribute('aria-pressed', String(pressed));
      }
    }

    const previewCanvas = $<HTMLCanvasElement>('preview');
    if (scene && previewCanvas) {
      scene.preview(previewCanvas, draft);
    }
  }

  const customizeBtn = $('customize');
  if (customizeBtn) {
    customizeBtn.onclick = () => {
      const p = me();
      if (!p) return;
      resetInput();
      draft = {
        ...p.appearance,
        accessory: normalizeAccessory(p.appearance?.accessory)
      };
      const nameInput = $<HTMLInputElement>('name');
      if (nameInput) nameInput.value = p.name;
      const statusEl = $('profile-status');
      if (statusEl) statusEl.textContent = '';
      refreshChoices();
      $<HTMLDialogElement>('wardrobe')?.showModal();
    };
  }

  const closeDrawerBtn = $('close-drawer');
  if (closeDrawerBtn) {
    closeDrawerBtn.onclick = () => $<HTMLDialogElement>('wardrobe')?.close();
  }

  const profileForm = $('profile-form');
  if (profileForm) {
    profileForm.onsubmit = e => {
      e.preventDefault();
      const statusEl = $('profile-status');
      if (statusEl) statusEl.textContent = 'Сохраняем…';
      const nameInput = $<HTMLInputElement>('name');
      profilePending = send({
        type: 'profile',
        name: nameInput?.value.trim() || '',
        appearance: { ...draft }
      });
    };
  }

  let pointerId: number | null = null;
  const joy = $('joystick');

  function joystick(e: PointerEvent) {
    if (!joy || pointerId !== e.pointerId) return;
    const box = joy.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    const n = Math.hypot(x, y);
    const scale = Math.min(n, 34) / (n || 1);

    const stick = $('stick');
    if (stick) stick.style.transform = `translate(${x * scale}px,${y * scale}px)`;

    const dx = x / (n || 1);
    const dy = y / (n || 1);
    let dir = 'down' as any;
    if (Math.abs(dx) > Math.abs(dy)) {
      dir = dx > 0 ? 'right' : 'left';
    } else {
      dir = dy > 0 ? 'down' : 'up';
    }

    touch = n < 8 ? { dx: 0, dy: 0 } : { dx, dy, dir };
  }

  if (joy) {
    joy.onpointerdown = e => {
      e.preventDefault();
      $<HTMLInputElement>('chat')?.blur();
      pointerId = e.pointerId;
      joy.setPointerCapture(pointerId);
      joystick(e);
    };

    joy.onpointermove = joystick as any;

    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      joy.addEventListener(type, () => {
        pointerId = null;
        touch = { dx: 0, dy: 0 };
        const stick = $('stick');
        if (stick) stick.style.transform = '';
        flushInput();
      });
    }
  }

  function frame(time: number) {
    const frameStart = profiler.beginFrame();

    const entryPreview = $<HTMLCanvasElement>('entry-preview');
    if (scene && !entered && entryPreview) {
      scene.preview(entryPreview, draft, time);
    }
    if (scene && !connected) {
      scene.text.dispose();
    }
    if (scene && connected && me()) {
      const worldCanvas = $<HTMLCanvasElement>('world');
      if (worldCanvas) {
        scene.draw(players, selfId, time);
      }
    }

    profiler.endFrame(frameStart, {
      drawCalls: scene ? scene.chunks.size + players.length : 0,
      chunksLoaded: scene ? scene.chunks.size : 0,
      entityCount: players.length
    });

    requestAnimationFrame(frame);
  }

  function entryLock(locked: boolean) {
    entryPending = locked;
    const entryForm = $('entry-form');
    if (entryForm) {
      entryForm.setAttribute('aria-busy', String(locked));
      for (const control of entryForm.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button,input')) {
        control.disabled = locked;
      }
    }
  }

  const entryForm = $('entry-form');
  if (entryForm) {
    entryForm.onsubmit = async e => {
      e.preventDefault();
      if (!entryReady || entryPending || entered) return;
      const entryName = $<HTMLInputElement>('entry-name');
      const name = entryName?.value.trim() || '';

      if (name.length < 2 || /[\u0000-\u001f\u007f-\u009f]/u.test(name)) {
        const statusEl = $('entry-status');
        if (statusEl) statusEl.textContent = 'Ник: от 2 до 20 символов, без управляющих знаков.';
        return;
      }

      const selected = {
        name,
        appearance: { ...draft }
      };

      entryLock(true);
      const statusEl = $('entry-status');
      if (statusEl) statusEl.textContent = 'Сохраняем образ…';

      try {
        const res = await fetch('/api/profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(selected),
          signal: AbortSignal.timeout(8000)
        });

        if (!res.ok) {
          throw new Error(
            res.status === 429
              ? 'Слишком быстро. Подожди немного и попробуй снова.'
              : res.status === 401
              ? 'Гостевой профиль недоступен. Обнови страницу.'
              : res.status === 400
              ? 'Проверь ник и выбранный образ.'
              : 'Не удалось сохранить образ. Попробуй ещё раз.'
          );
        }

        await res.json();
        if (statusEl) statusEl.textContent = 'Заходим на поляну…';
        await connect();
      } catch (error: any) {
        if (statusEl) {
          statusEl.textContent =
            error.name === 'TimeoutError'
              ? 'Сервер не ответил. Образ остаётся здесь — попробуй ещё раз.'
              : error instanceof TypeError
              ? 'Не удалось связаться с сервером. Проверь интернет и попробуй ещё раз.'
              : error.message;
        }
      } finally {
        entryLock(false);
      }
    };
  }

  async function boot() {
    try {
      const res = await fetch('/api/bootstrap');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      selfId = data.selfId;
      worldState = data.worldState || { seed: 98765, timeOfDay: 12, isNight: false };

      const guestLabel = document.querySelector('.guest');
      if (guestLabel) {
        guestLabel.textContent = `Котик ${selfId.slice(0, 8)}`;
      }

      const worldCanvas = $<HTMLCanvasElement>('world');
      if (!worldCanvas) throw new Error('Canvas #world not found');

      scene = new Scene(worldCanvas, worldState);

      draft = {
        ...data.profile.appearance,
        accessory: normalizeAccessory(data.profile.appearance?.accessory)
      };

      const entryName = $<HTMLInputElement>('entry-name');
      if (entryName) entryName.value = data.profile.name;

      refreshChoices();
      entryReady = true;
      entryLock(false);

      const statusEl = $('entry-status');
      if (statusEl) statusEl.textContent = '';

      requestAnimationFrame(frame);
    } catch (error: any) {
      const statusEl = $('entry-status');
      if (statusEl) {
        statusEl.textContent = `Не удалось загрузить профиль (${error.message}). Повтор через 3 секунды.`;
      }
      setTimeout(boot, 3000);
    }
  }

  window.addEventListener('pagehide', () => scene?.text.dispose());
  entryLock(true);
  boot();

  Object.defineProperty(window, 'worldClient', {
    get: () => ({
      selfId,
      players: structuredClone(players),
      worldState: structuredClone(worldState),
      connected
    })
  });
}
