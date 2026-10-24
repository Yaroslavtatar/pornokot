export type Direction = 'down' | 'up' | 'left' | 'right';
export type FurColor = 'gray' | 'lavender' | 'cream' | 'cocoa';
export type AccessoryType = 'none' | 'mushroom-hat' | 'hat' | 'pink-body-bow' | 'blue-tail-bow';
export type Pose = 'idle' | 'walk' | 'sit' | 'sleep';

export interface Appearance {
  fur: FurColor;
  accessory: AccessoryType;
}

export interface PlayerEmote {
  kind: 'heart' | 'wave' | 'happy';
  until: number;
}

export interface PlayerMessage {
  text: string;
  until: number;
}

export interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  dir: Direction;
  moving: boolean;
  pose: Pose;
  appearance: Appearance;
  emote?: PlayerEmote | null;
  message?: PlayerMessage | null;
}

export type TileType = 'grass' | 'path' | 'plaza' | 'water' | 'bridge' | 'flower' | 'wood';

export interface TileProp {
  id: string;
  type: 'bench' | 'lamp' | 'fountain' | 'tree' | 'building' | 'picnic' | 'flowerbed';
  buildingType?: 'townhall' | 'outfits' | 'cafe' | 'bakery' | 'library' | 'flowershop' | 'house';
  x: number;
  y: number;
  w: number;
  h: number;
  range?: number;
  state?: any;
}

export interface ChunkData {
  cx: number;
  cy: number;
  tiles: TileType[][]; // 16x16 matrix
  noiseVariations: number[][]; // 16x16 float matrix for grass brightness noise
  props: TileProp[];
}

export interface WorldState {
  seed: number;
  timeOfDay: number; // 0 to 24 (hours)
  isNight: boolean;
}

export interface BootstrapResponse {
  selfId: string;
  profile: {
    name: string;
    appearance: Appearance;
  };
  worldState: WorldState;
}

export interface WSMessage {
  type:
    | 'welcome'
    | 'state'
    | 'chat'
    | 'error'
    | 'input'
    | 'pose'
    | 'emote'
    | 'interact'
    | 'profile'
    | 'request_chunks'
    | 'chunk_data';
  selfId?: string;
  players?: Player[];
  worldState?: WorldState;
  chunks?: ChunkData[];
  requestedChunks?: { cx: number; cy: number }[];
  name?: string;
  text?: string;
  message?: string;
  pose?: Pose;
  kind?: 'heart' | 'wave' | 'happy';
  objectId?: string;
  appearance?: Appearance;
  dx?: number;
  dy?: number;
  dir?: Direction;
  seq?: number;
}
