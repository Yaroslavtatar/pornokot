import { Player } from './types';
import { normalizeAccessory } from './render';

export interface ViewBounds {
  width: number;
  height: number;
  pixelWidth: number;
  pixelHeight: number;
  top: number;
  bottom: number;
  obstacles?: DOMRect[];
}

export function clampLabel(
  point: { x: number; y: number },
  width: number,
  height: number,
  bounds: ViewBounds
) {
  const x = Math.max(width / 2 + 8, Math.min(bounds.width - width / 2 - 8, point.x));
  let y = Math.max(bounds.top, Math.min(bounds.bottom - height - 8, point.y));
  for (const o of [...(bounds.obstacles || [])].sort((a, b) => b.y - a.y)) {
    if (x + width / 2 > o.x && x - width / 2 < o.x + o.width && y + height + 8 > o.y && y < o.y + o.height) {
      y = Math.max(bounds.top, o.y - height - 8);
    }
  }
  return { x, y };
}

export function projectLabel(player: Player, camera: { x: number; y: number }, view: ViewBounds) {
  return {
    x: ((player.x - camera.x) * view.width) / view.pixelWidth,
    y: ((player.y - camera.y + (player.pose === 'sit' ? -5 : 0)) * view.height) / view.pixelHeight
  };
}

interface LabelNode {
  group: HTMLDivElement;
  name: HTMLDivElement;
  speech: HTMLDivElement;
  nameText?: string;
  speechText?: string;
  nameSize?: DOMRect | null;
  speechSize?: DOMRect | null;
  metricsKey?: string;
}

export class WorldText {
  root: HTMLElement;
  doc: Document;
  nodes: Map<string, LabelNode>;
  metricsVersion: number;
  fontsChanged: () => void;

  constructor(root: HTMLElement, doc: Document = globalThis.document) {
    this.root = root;
    this.doc = doc;
    this.nodes = new Map();
    this.metricsVersion = 0;
    this.fontsChanged = () => {
      this.metricsVersion++;
    };
    (doc.fonts as any)?.addEventListener?.('loadingdone', this.fontsChanged);
  }

  update(players: Player[], camera: { x: number; y: number }, view: ViewBounds, selfId: string, now = Date.now()) {
    const live = new Set(players.map(p => p.id));
    for (const [id, node] of this.nodes) {
      if (!live.has(id)) {
        node.group.remove();
        this.nodes.delete(id);
      }
    }

    const metricsKey = `${view.width}:${view.height}:${this.metricsVersion}`;
    const visible: { node: LabelNode; p: Player; point: { x: number; y: number }; talking: boolean }[] = [];

    // Phase 1: content & visibility writes
    for (const p of players) {
      let node = this.nodes.get(p.id);
      if (!node) {
        const group = this.doc.createElement('div');
        const name = this.doc.createElement('div');
        const speech = this.doc.createElement('div');
        group.className = 'world-label';
        group.dataset.playerId = p.id;
        name.className = 'world-name';
        speech.className = 'world-speech';
        group.append(name, speech);
        this.root.append(group);
        node = { group, name, speech };
        this.nodes.set(p.id, node);
      }

      const { group, name, speech } = node;
      const point = projectLabel(p, camera, view);
      const hidden = point.x < -100 || point.x > view.width + 100 || point.y < -100 || point.y > view.height + 100;
      if (group.hidden !== hidden) group.hidden = hidden;
      if (hidden) continue;

      const self = String(p.id === selfId);
      const talking = Boolean(p.message && p.message.until > now);
      const text = talking && p.message ? p.message.text : '';

      if (node.nameText !== p.name) {
        name.textContent = p.name;
        node.nameText = p.name;
        node.nameSize = null;
      }
      if (name.dataset.self !== self) {
        name.dataset.self = self;
        node.nameSize = null;
      }
      if (speech.hidden !== !talking) {
        speech.hidden = !talking;
        node.speechSize = null;
      }
      if (node.speechText !== text) {
        speech.textContent = text;
        node.speechText = text;
        node.speechSize = null;
      }
      if (node.metricsKey !== metricsKey) {
        node.nameSize = null;
        node.speechSize = null;
        node.metricsKey = metricsKey;
      }

      visible.push({ node, p, point, talking });
    }

    // Phase 2: dirty visible sizes
    for (const { node, talking } of visible) {
      if (!node.nameSize) node.nameSize = node.name.getBoundingClientRect();
      if (talking && !node.speechSize) node.speechSize = node.speech.getBoundingClientRect();
    }

    // Phase 3: position all labels
    for (const { node, p, point, talking } of visible) {
      const { name, speech, nameSize: ns, speechSize: ss } = node;
      if (!ns) continue;
      const accessory = normalizeAccessory(p.appearance?.accessory);
      const top =
        accessory === 'hat'
          ? 40
          : accessory === 'mushroom-hat'
          ? 37
          : accessory === 'blue-tail-bow'
          ? 33
          : accessory === 'pink-body-bow'
          ? 27
          : 26;
      const gap = 6;
      const speechSpace = talking && ss ? ss.height + gap : 0;
      const headClearance = (top * view.height) / view.pixelHeight + 6;

      const block = clampLabel(
        {
          x: point.x,
          y: point.y - headClearance - ns.height - speechSpace
        },
        Math.max(ns.width, talking && ss ? ss.width : 0),
        ns.height + speechSpace,
        view
      );

      const left = `${block.x}px`;
      const nameTop = `${block.y + speechSpace}px`;
      const speechTop = `${block.y}px`;

      if (name.style.left !== left) name.style.left = left;
      if (name.style.top !== nameTop) name.style.top = nameTop;
      if (speech.style.left !== left) speech.style.left = left;
      if (speech.style.top !== speechTop) speech.style.top = speechTop;
    }
  }

  dispose() {
    for (const node of this.nodes.values()) node.group.remove();
    this.nodes.clear();
  }
}
