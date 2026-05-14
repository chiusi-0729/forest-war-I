import { ANIMAL_NAMES, COLS, DENS, INITIAL_INVENTORY, RIVERS, ROWS, TRAPS } from '../constants';
import { AnimalType, Cell, CellType, GameState, GameStatus, Piece, Player } from '../types';

export function initGame(): GameState {
  const board: Cell[][] = [];

  for (let x = 0; x < ROWS; x++) {
    const row: Cell[] = [];
    for (let y = 0; y < COLS; y++) {
      let type = CellType.NORMAL;
      let owner: Player | undefined;

      if (RIVERS.some(([rx, ry]) => rx === x && ry === y)) {
        type = CellType.RIVER;
      } else if (DENS[Player.A][0] === x && DENS[Player.A][1] === y) {
        type = CellType.DEN;
        owner = Player.A;
      } else if (DENS[Player.B][0] === x && DENS[Player.B][1] === y) {
        type = CellType.DEN;
        owner = Player.B;
      }

      row.push({ x, y, type, owner, piece: null });
    }
    board.push(row);
  }

  return {
    status: GameStatus.SETUP,
    board,
    currentPlayer: Player.B, // Red player starts setup and first move
    winner: null,
    history: [],
    capturedPieces: {
      [Player.A]: [],
      [Player.B]: [],
    },
    inventory: {
      [Player.A]: { ...INITIAL_INVENTORY },
      [Player.B]: { ...INITIAL_INVENTORY },
    }
  };
}

export function placePiece(state: GameState, player: Player, x: number, y: number, item: AnimalType | 'trap'): GameState | { error: string } {
  if (state.status !== GameStatus.SETUP) return { error: 'Cannot place after setup' };
  if (state.inventory[player][item] <= 0) return { error: 'Inventory empty' };
  
  // Zone checks
  if (player === Player.A && x > 2) return { error: 'P1 rows 0-2' };
  if (player === Player.B && x < 6) return { error: 'P2 rows 6-8' };
  
  const cell = state.board[x][y];
  if (cell.type === CellType.DEN) return { error: 'Cannot place in Den' };
  if (cell.piece || cell.type === CellType.TRAP) return { error: 'Cell occupied' };

  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  
  if (item === 'trap') {
    newState.board[x][y].type = CellType.TRAP;
    newState.board[x][y].owner = player;
    newState.board[x][y].isTrapRevealed = false;
  } else {
    const pieceId = `${player}-${item}-${state.inventory[player][item]}`;
    newState.board[x][y].piece = {
      id: pieceId,
      type: item as AnimalType,
      player,
      level: item as number,
      isRevealed: false
    };
  }
  
  newState.inventory[player][item]--;
  return newState;
}

export function removePiece(state: GameState, x: number, y: number): GameState {
  if (state.status !== GameStatus.SETUP) return state;

  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const cell = newState.board[x][y];
  
  if (cell.piece) {
    newState.inventory[cell.piece.player][cell.piece.type]++;
    cell.piece = null;
  } else if (cell.type === CellType.TRAP) {
    newState.inventory[cell.owner!]['trap']++;
    cell.type = CellType.NORMAL;
    cell.owner = undefined;
    cell.isTrapRevealed = undefined;
  }
  return newState;
}

export function autoSetup(state: GameState, player: Player): GameState {
  let currentState = JSON.parse(JSON.stringify(state)) as GameState;
  const rows = player === Player.A ? [0, 1, 2] : [6, 7, 8];
  const possibleCells: [number, number][] = [];
  
  rows.forEach(r => {
    for (let c = 0; c < COLS; c++) {
      if (currentState.board[r][c].type !== CellType.DEN && !currentState.board[r][c].piece) {
        possibleCells.push([r, c]);
      }
    }
  });

  // Shuffle available cells
  for (let i = possibleCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [possibleCells[i], possibleCells[j]] = [possibleCells[j], possibleCells[i]];
  }

  let cellIdx = 0;
  // Place animals
  for (const typeStr of Object.keys(INITIAL_INVENTORY)) {
    if (typeStr === 'trap') continue;
    const type = Number(typeStr) as AnimalType;
    for (let i = 0; i < INITIAL_INVENTORY[type]; i++) {
      if (cellIdx >= possibleCells.length) break;
      const [x, y] = possibleCells[cellIdx++];
      const result = placePiece(currentState, player, x, y, type);
      if ('error' in result) continue;
      currentState = result;
    }
  }
  // Place traps
  for (let i = 0; i < INITIAL_INVENTORY['trap']; i++) {
    if (cellIdx >= possibleCells.length) break;
    const [x, y] = possibleCells[cellIdx++];
    const result = placePiece(currentState, player, x, y, 'trap');
    if ('error' in result) continue;
    currentState = result;
  }

  return currentState;
}

export function isValidMove(
  state: GameState,
  from: { x: number; y: number },
  to: { x: number; y: number }
): { valid: boolean; reason?: string } {
  const { x: fx, y: fy } = from;
  const { x: tx, y: ty } = to;

  const piece = state.board[fx][fy].piece;
  if (!piece) return { valid: false, reason: 'No piece' };
  if (piece.player !== state.currentPlayer) return { valid: false, reason: 'Not your turn' };

  const targetCell = state.board[tx][ty];
  if (targetCell.type === CellType.DEN && targetCell.owner === piece.player) {
    return { valid: false, reason: 'Cannot enter own Den' };
  }

  const dx = Math.abs(tx - fx);
  const dy = Math.abs(ty - fy);

  if (dx + dy !== 1) return { valid: false, reason: 'Move one step' };
  if (targetCell.type === CellType.RIVER) {
    return { valid: false, reason: 'No pieces can enter river area' };
  }

  return canCapture(piece, targetCell, state.board[fx][fy]);
}

function canCapture(attacker: Piece, targetCell: Cell, fromCell: Cell): { valid: boolean; reason?: string } {
  // If stepping into enemy trap, it's allowed but will result in capture in performMove
  if (targetCell.type === CellType.TRAP && targetCell.owner !== attacker.player) {
    return { valid: true };
  }

  const targetPiece = targetCell.piece;
  if (!targetPiece) return { valid: true };

  if (targetPiece.player === attacker.player) return { valid: false, reason: 'Own piece blocked' };

  if (fromCell.type === CellType.RIVER && targetCell.type !== CellType.RIVER) {
    return { valid: false, reason: 'Rat in water cannot attack land' };
  }

  let tLevel = targetPiece.level;
  // Note: Standard trap rank-to-0 rule is replaced by direct capture in performMove for STEPPING on it.
  // But if a piece is ALREADY in a trap (which shouldn't happen with direct capture), we handle it.
  if (targetCell.type === CellType.TRAP && targetCell.owner !== targetPiece.player) tLevel = 0;

  if (attacker.type === AnimalType.RAT && targetPiece.type === AnimalType.ELEPHANT && tLevel > 0) return { valid: true };
  if (attacker.type === AnimalType.ELEPHANT && targetPiece.type === AnimalType.RAT) return { valid: false, reason: 'Elephant cannot eat rat' };

  if (attacker.level >= tLevel) return { valid: true };
  return { valid: false, reason: 'Level too low' };
}

function countPlayerPieces(board: Cell[][], player: Player): number {
  return board.flat().filter(cell => cell.piece?.player === player).length;
}

export function performMove(state: GameState, from: { x: number; y: number }, to: { x: number; y: number }): GameState {
  const newState = JSON.parse(JSON.stringify(state)) as GameState;
  const piece = newState.board[from.x][from.y].piece;
  if (!piece) return state;

  const targetCell = newState.board[to.x][to.y];
  const targetPiece = targetCell.piece;

  let actionLabel = '';

  // Rule: If land on enemy trap, piece is immediately captured and trap disappears
  if (targetCell.type === CellType.TRAP && targetCell.owner !== piece.player) {
    newState.capturedPieces[piece.player].push(piece);
    newState.board[from.x][from.y].piece = null;
    
    // Trap disappears after use
    targetCell.type = CellType.NORMAL;
    targetCell.owner = undefined;
    targetCell.isTrapRevealed = undefined;
    
    actionLabel = ' 誤入陷阱，棋子與陷阱同歸於盡';
    
    // Process game ending and turn switch
    const opponent = piece.player === Player.A ? Player.B : Player.A;
    newState.currentPlayer = opponent;
    newState.history.push(`${piece.player === Player.A ? '藍' : '紅'}${ANIMAL_NAMES[piece.type]} (${from.x},${from.y})->(${to.x},${to.y})${actionLabel}`);
    
    // Check if game ends
    const hasCurrentPlayerPieces = newState.board.flat().some(cell => cell.piece?.player === piece.player);
    if (!hasCurrentPlayerPieces) {
      newState.winner = opponent;
      newState.status = GameStatus.FINISHED;
    }
    
    if (!newState.winner) {
      const moves = getAllLegalMoves(newState, opponent);
      if (moves.length === 0) {
        newState.winner = piece.player;
        newState.status = GameStatus.FINISHED;
      }
    }

    return newState;
  }

  if (targetPiece) {
    piece.isRevealed = true;
    targetPiece.isRevealed = true;

    let tLevel = targetPiece.level;
    const isTargetInEnemyTrap = targetCell.type === CellType.TRAP && targetCell.owner !== targetPiece.player;
    if (isTargetInEnemyTrap) tLevel = 0;

    const isRatEatingElephant = piece.type === AnimalType.RAT && targetPiece.type === AnimalType.ELEPHANT && tLevel > 0;

    if (piece.level === tLevel && tLevel > 0) {
      newState.capturedPieces[piece.player].push(piece);
      newState.capturedPieces[targetPiece.player].push(targetPiece);
      newState.board[to.x][to.y].piece = null;
      actionLabel = ' 同歸於盡';
    } else if (piece.level > tLevel || isRatEatingElephant || tLevel === 0) {
      newState.capturedPieces[targetPiece.player].push(targetPiece);
      newState.board[to.x][to.y].piece = piece;
      actionLabel = isTargetInEnemyTrap ? ' 陷入陷阱被捕獲' : ' 捕獲';
    } else {
      newState.capturedPieces[piece.player].push(piece);
      newState.board[from.x][from.y].piece = null;
      actionLabel = ' 攻擊失敗';
    }
  } else {
    newState.board[to.x][to.y].piece = piece;
  }

  newState.board[from.x][from.y].piece = null;

  const hasPiecesA = countPlayerPieces(newState.board, Player.A);
  const hasPiecesB = countPlayerPieces(newState.board, Player.B);
  if (!newState.winner && hasPiecesA === 0 && hasPiecesB === 0) {
    newState.history.push('雙方棋子除陷阱外全數陣亡，判平手');
    newState.status = GameStatus.FINISHED;
    return newState;
  }

  // Win by Den capture
  if (targetCell.type === CellType.DEN && targetCell.owner !== piece.player) {
    newState.winner = piece.player;
    newState.status = GameStatus.FINISHED;
  }

  const opponent = piece.player === Player.A ? Player.B : Player.A;
  
  // Win by elimination
  const hasOpponentPieces = countPlayerPieces(newState.board, opponent) > 0;
  if (!hasOpponentPieces) {
    newState.winner = piece.player;
    newState.status = GameStatus.FINISHED;
  }

  // Switch turn
  newState.currentPlayer = opponent;
  newState.history.push(`${piece.player === Player.A ? '藍' : '紅'}${ANIMAL_NAMES[piece.type]} (${from.x},${from.y})->(${to.x},${to.y})${actionLabel}`);

  // Check if opponent has any legal moves left
  if (!newState.winner) {
    const moves = getAllLegalMoves(newState, opponent);
    if (moves.length === 0) {
      newState.winner = piece.player;
      newState.status = GameStatus.FINISHED;
    }
  }

  return newState;
}

export function getAllLegalMoves(state: GameState, player: Player): { from: { x: number, y: number }, to: { x: number, y: number } }[] {
  const moves: { from: { x: number, y: number }, to: { x: number, y: number } }[] = [];
  const dummyState = { ...state, currentPlayer: player };

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const p = state.board[r][c].piece;
      if (p && p.player === player) {
        // Orthogonal
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [dr, dc] of dirs) {
          const tr = r + dr, tc = c + dc;
          if (tr >= 0 && tr < ROWS && tc >= 0 && tc < COLS) {
            if (isValidMove(dummyState, { x: r, y: c }, { x: tr, y: tc }).valid) {
              moves.push({ from: { x: r, y: c }, to: { x: tr, y: tc } });
            }
          }
        }
      }
    }
  }
  return moves;
}

export function getBestMoveAI(state: GameState): { from: { x: number, y: number }, to: { x: number, y: number } } | null {
  const moves = getAllLegalMoves(state, Player.A);
  if (moves.length === 0) return null;

  const den = DENS[Player.B];
  let bestScore = -Infinity;
  let candidates: typeof moves = [];

  moves.forEach(m => {
    let score = 0;
    const fromPiece = state.board[m.from.x][m.from.y].piece!;
    const targetCell = state.board[m.to.x][m.to.y];
    const targetPiece = targetCell.piece;

    if (targetPiece) {
      score += (targetPiece.level * 100) + 100;
      if (fromPiece.type === AnimalType.RAT && targetPiece.type === AnimalType.ELEPHANT) score += 500;
      if (!targetPiece.isRevealed) score += 200;
    }

    const d1 = Math.abs(m.from.x - den[0]) + Math.abs(m.from.y - den[1]);
    const d2 = Math.abs(m.to.x - den[0]) + Math.abs(m.to.y - den[1]);
    score += (d1 - d2) * 20;

    if (targetCell.type === CellType.DEN && targetCell.owner === Player.B) score += 20000;
    
    // AI avoids traps it knows about (revealed or its own)
    const knownTrap = targetCell.type === CellType.TRAP && (targetCell.isTrapRevealed || targetCell.owner === Player.A);
    if (knownTrap) {
      if (targetCell.owner === Player.B) {
        score -= 5000; // Large penalty for known enemy trap (certain death)
      } else {
        // Own trap is fine, but maybe slightly less ideal than normal terrain?
        score += 50; 
      }
    }

    if (score > bestScore) {
      bestScore = score;
      candidates = [m];
    } else if (score === bestScore) {
      candidates.push(m);
    }
  });

  return candidates[Math.floor(Math.random() * candidates.length)];
}
