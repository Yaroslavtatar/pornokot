import { AccessoryType, FurColor } from './types';

export const accessoryChoices: AccessoryType[] = ['none', 'mushroom-hat', 'hat', 'pink-body-bow', 'blue-tail-bow'];

export const accessoryLabels: Record<string, string> = {
  'mushroom-hat': 'Грибная Шапочка',
  hat: 'Мистер Шапка',
  'pink-body-bow': 'Бантик',
  'blue-tail-bow': 'Бабочка'
};

const accessoryNames = new Set(accessoryChoices);

export function normalizeAccessory(value: string | undefined): AccessoryType {
  if (value === 'heart') return 'none';
  if (value === 'bow') return 'pink-body-bow';
  return accessoryNames.has(value as AccessoryType) ? (value as AccessoryType) : 'none';
}
