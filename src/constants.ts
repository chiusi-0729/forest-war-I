import { AnimalType, Player } from './types';

export const ROWS = 9;
export const COLS = 7;

export const ANIMAL_NAMES: Record<AnimalType, string> = {
  [AnimalType.RAT]: '鼠',
  [AnimalType.CAT]: '貓',
  [AnimalType.DOG]: '犬',
  [AnimalType.WOLF]: '狼',
  [AnimalType.LEOPARD]: '豹',
  [AnimalType.TIGER]: '虎',
  [AnimalType.LION]: '獅',
  [AnimalType.ELEPHANT]: '象',
};

// Each player gets 2 of each animal and 3 traps
export const INITIAL_INVENTORY: Record<string, number> = {
  [AnimalType.RAT]: 2,
  [AnimalType.CAT]: 2,
  [AnimalType.DOG]: 2,
  [AnimalType.WOLF]: 2,
  [AnimalType.LEOPARD]: 2,
  [AnimalType.TIGER]: 2,
  [AnimalType.LION]: 2,
  [AnimalType.ELEPHANT]: 2,
  'trap': 3,
};

export const RIVERS = [
  [3, 1], [3, 2], [4, 1], [4, 2], [5, 1], [5, 2],
  [3, 4], [3, 5], [4, 4], [4, 5], [5, 4], [5, 5]
];

export const TRAPS = {
  [Player.A]: [] as number[][],
  [Player.B]: [] as number[][]
};

export const DENS = {
  [Player.A]: [0, 3],
  [Player.B]: [8, 3]
};
