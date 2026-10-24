import { Player, TileProp } from './types';
import { nearestProp } from './protocol';

export function updateHud(
  { interact, sleep }: { interact: HTMLButtonElement; sleep: HTMLButtonElement },
  player: Player | undefined,
  props: TileProp[],
  mobile: boolean
) {
  if (!player) return;
  const o = nearestProp(player, props);
  const text = o
    ? `${o.type === 'bench' ? 'Сесть / встать' : o.type === 'lamp' ? 'Зажечь / погасить' : 'Плескаться'} · ${
        o.type === 'bench' ? 'Лавочка' : o.type === 'lamp' ? 'Фонарь' : 'Фонтан'
      }${mobile ? '' : ' [E]'}`
    : '';

  if (interact.disabled !== !o) interact.disabled = !o;
  if (interact.textContent !== text) interact.textContent = text;
  const sleeping = player.pose === 'sleep';
  const pressed = String(sleeping);
  const title = sleeping ? 'Проснуться' : 'Спать';
  if (sleep.getAttribute('aria-pressed') !== pressed) sleep.setAttribute('aria-pressed', pressed);
  if (sleep.title !== title) sleep.title = title;
}
