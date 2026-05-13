export enum Player {
  A = 'A', // AI (Blue) - Top side
  B = 'B'  // Human (Red) - Bottom side
}

export enum GameStatus {
  SETUP = 'setup',
  BATTLE = 'battle',
  FINISHED = 'finished'
}

export enum CellType {
  NORMAL = 'normal',
  RIVER = 'river',
  TRAP = 'trap',
  DEN = 'den'
}

export enum AnimalType {
  RAT = 1,
  CAT = 2,
  DOG = 3,
  WOLF = 4,
  LEOPARD = 5,
  TIGER = 6,
  LION = 7,
  ELEPHANT = 8
}

export interface Piece {
  id: string;
  type: AnimalType;
  player: Player;
  level: number;
  isRevealed: boolean;
}

export interface Cell {
  x: number;
  y: number;
  type: CellType;
  owner?: Player;
  piece?: Piece | null;
  isTrapRevealed?: boolean;
}

export interface GameState {
  status: GameStatus;
  board: Cell[][];
  currentPlayer: Player;
  winner: Player | null;
  history: string[];
  capturedPieces: {
    [Player.A]: Piece[];
    [Player.B]: Piece[];
  };
  // Inventories for setup including traps
  inventory: {
    [Player.A]: Record<string, number>;
    [Player.B]: Record<string, number>;
  };
}
