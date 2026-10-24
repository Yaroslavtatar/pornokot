import { MovementInput } from './input';
import { Player, TileProp, WSMessage } from './types';

export function inputPacket({ dx, dy, dir }: MovementInput, seq: number): WSMessage {
  return { type: 'input', dx, dy, dir, seq };
}

export function nearestProp(player: Player | undefined | null, props: TileProp[]): TileProp | null {
  if (!player) return null;
  return (
    props
      .filter(p => p.range && Math.hypot(p.x - player.x, p.y - player.y) <= p.range)
      .sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0] || null
  );
}

export function acceptSnapshot(msg: WSMessage): WSMessage | null {
  return ['welcome', 'state'].includes(msg.type) && Array.isArray(msg.players) ? msg : null;
}

export const reconnectDelay = (code: number, retry: number): number | null =>
  code === 4001 ? null : Math.min(10000, 1000 * 2 ** retry);
