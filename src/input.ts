import { Direction, InputVector } from './types';

export interface MovementInput extends InputVector {
  dir?: Direction;
}

export function createInputSender(send: (msg: MovementInput) => boolean) {
  let last: MovementInput = { dx: 0, dy: 0 };
  let at = -Infinity;

  return {
    poll(vector: MovementInput, now: number) {
      const changed = vector.dx !== last.dx || vector.dy !== last.dy || vector.dir !== last.dir;
      const stop = !vector.dx && !vector.dy && (last.dx !== 0 || last.dy !== 0);
      if (!stop && !(changed && now - at >= 60) && now - at < 180) return false;
      send({ ...vector, at: now });
      last = { ...vector };
      at = now;
      return true;
    }
  };
}

export function movement(keys: Set<string>, target: Element | null): MovementInput {
  if (target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || (target as HTMLElement).isContentEditable)) {
    return { dx: 0, dy: 0 };
  }

  const right = keys.has('KeyD') || keys.has('ArrowRight');
  const left = keys.has('KeyA') || keys.has('ArrowLeft');
  const down = keys.has('KeyS') || keys.has('ArrowDown');
  const up = keys.has('KeyW') || keys.has('ArrowUp');

  const x = Number(right) - Number(left);
  const y = Number(down) - Number(up);
  const n = Math.hypot(x, y) || 1;

  let dir: Direction = 'down';
  if (right) dir = 'right';
  else if (left) dir = 'left';
  else if (up) dir = 'up';
  else if (down) dir = 'down';

  return { dx: x / n, dy: y / n, dir };
}
