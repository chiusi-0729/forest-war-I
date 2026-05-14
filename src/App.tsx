import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  RotateCcw,
  History,
  ShieldCheck,
  EyeOff,
  LayoutGrid
} from 'lucide-react';
import { 
  initGame, 
  isValidMove, 
  performMove, 
  getBestMoveAI, 
  placePiece, 
  removePiece, 
  autoSetup 
} from './logic/gameLogic';
import { Player, GameStatus } from './types';
import { ANIMAL_NAMES } from './constants';
import { SetupPhase } from './components/SetupPhase';

export default function App() {
  const [gameState, setGameState] = useState(initGame());
  const [selectedPos, setSelectedPos] = useState<{ x: number; y: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // AI Logic for Setup
  const handleStartGame = useCallback(() => {
    let finalState = autoSetup(gameState, Player.A);
    finalState.status = GameStatus.BATTLE;
    finalState.currentPlayer = Player.B; 
    setGameState(finalState);
    setMessage('對戰開始！紅方優先。');
  }, [gameState]);

  // AI Turn Handling in Battle
  useEffect(() => {
    if (
      gameState.status === GameStatus.BATTLE && 
      gameState.currentPlayer === Player.A && 
      !gameState.winner && 
      !isAiThinking
    ) {
      setIsAiThinking(true);
      
      const timeoutId = setTimeout(() => {
        const aiMove = getBestMoveAI(gameState);
        
        if (aiMove) {
          setGameState(prev => {
            const nextState = performMove(prev, aiMove.from, aiMove.to);
            if (nextState === prev) {
              console.warn('AI attempted invalid move!', aiMove);
              return { ...prev, winner: Player.B, status: GameStatus.FINISHED };
            }
            return nextState;
          });
        } else {
          setGameState(prev => ({ ...prev, winner: Player.B, status: GameStatus.FINISHED }));
        }
        
        setIsAiThinking(false);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [gameState, isAiThinking]);

  const handleCellClick = useCallback((x: number, y: number) => {
    if (gameState.status !== GameStatus.BATTLE || gameState.winner || isAiThinking) return;
    if (gameState.currentPlayer !== Player.B) return;

    if (selectedPos) {
      if (selectedPos.x === x && selectedPos.y === y) {
        setSelectedPos(null);
        return;
      }

      const moveResult = isValidMove(gameState, selectedPos, { x, y });
      if (moveResult.valid) {
        setGameState(prev => performMove(prev, selectedPos, { x, y }));
        setSelectedPos(null);
        setMessage(null);
      } else {
        const clickedPiece = gameState.board[x][y].piece;
        if (clickedPiece && clickedPiece.player === Player.B) {
          setSelectedPos({ x, y });
          setMessage(null);
        } else {
          setMessage(moveResult.reason || '無效移動');
        }
      }
    } else {
      const piece = gameState.board[x][y].piece;
      if (piece && piece.player === Player.B) {
        setSelectedPos({ x, y });
        setMessage(null);
      }
    }
  }, [gameState, selectedPos, isAiThinking]);

  const resetGame = () => {
    setGameState(initGame());
    setSelectedPos(null);
    setMessage(null);
    setIsAiThinking(false);
  };

  if (gameState.status === GameStatus.SETUP) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col items-center py-8">
        <header className="mb-8 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-2">
            <LayoutGrid className="text-red-500" />
            <h1 className="text-3xl font-black italic tracking-tighter uppercase">Forest War</h1>
          </div>
          <div className="h-1 w-24 bg-red-500 rounded-full" />
        </header>

        <SetupPhase 
          board={gameState.board}
          inventory={gameState.inventory[Player.B]}
          message={message}
          onPlace={(x, y, animal) => {
            const result = placePiece(gameState, Player.B, x, y, animal);
            if ('error' in result) {
              setMessage(result.error);
            } else {
              setGameState(result);
              setMessage(null);
            }
          }}
          onRemove={(x, y) => {
            setGameState(removePiece(gameState, x, y));
            setMessage(null);
          }}
          onAuto={() => {
            setGameState(autoSetup(gameState, Player.B));
          }}
          onFinish={handleStartGame}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 p-2 md:p-8 font-sans selection:bg-red-500/30">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        <div className="w-full lg:w-80 flex flex-col gap-6 order-2 lg:order-1">
          <header className="hidden lg:block">
            <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">
              Forest<br /><span className="text-red-600">War</span>
            </h1>
            <p className="text-slate-500 text-sm mt-2 font-medium tracking-wide uppercase">Fog of War Edition</p>
          </header>

          <div className="space-y-4">
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl backdrop-blur-sm shadow-xl">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <ShieldCheck size={14} /> 當前回合
              </div>
              <div className="flex items-center justify-between">
                <div className={`flex items-center gap-3 transition-opacity ${gameState.currentPlayer === Player.B ? 'opacity-100' : 'opacity-40'}`}>
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-bold text-lg tracking-tight">玩家 (紅方)</span>
                </div>
                <div className={`flex items-center gap-3 transition-opacity ${gameState.currentPlayer === Player.A ? 'opacity-100' : 'opacity-40'}`}>
                  <span className="font-bold text-lg tracking-tight">AI (藍方)</span>
                  <div className={`w-3 h-3 bg-blue-500 rounded-full ${gameState.currentPlayer === Player.A ? 'animate-pulse' : ''}`} />
                </div>
              </div>
              {isAiThinking && (
                <div className="mt-2 text-[10px] text-blue-400 font-mono flex items-center gap-1">
                  <span className="animate-spin duration-[2000ms]">○</span> AI 正在規劃戰術...
                </div>
              )}
            </div>

            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl backdrop-blur-sm divide-y divide-slate-800">
              <div className="pb-3 flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                <span>被俘獲棋子</span>
              </div>
              <div className="pt-3 flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] text-red-500/60 font-black w-full">紅方損失</span>
                  {gameState.capturedPieces[Player.B].map((p, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-bold border border-slate-700">
                      {ANIMAL_NAMES[p.type]}
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] text-blue-500/60 font-black w-full">藍方損失</span>
                  {gameState.capturedPieces[Player.A].map((p, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center text-xs font-bold border border-slate-700">
                      {ANIMAL_NAMES[p.type]}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={resetGame}
                className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm transition-all border border-slate-700"
              >
                <RotateCcw size={16} /> 重新開始
              </button>
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm transition-all border border-slate-700"
              >
                <History size={16} /> 戰鬥紀實
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center order-1 lg:order-2">
          {message && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="w-full bg-red-500/10 border border-red-500/20 px-4 py-2 mb-4 rounded-lg text-sm text-red-500 font-medium text-center"
            >
              {message}
            </motion.div>
          )}

          <div className="relative p-2 md:p-6 bg-slate-950 rounded-[2rem] shadow-2xl border border-slate-800/50 overflow-x-auto max-w-full">
            <div className="grid grid-cols-7 gap-1 md:gap-3">
              {gameState.board.map((row, x) => row.map((cell, y) => {
                const isSelected = selectedPos?.x === x && selectedPos?.y === y;
                const isRiver = cell.type === 'river';
                const isDen = cell.type === 'den';
                const isTrap = cell.type === 'trap';
                const piece = cell.piece;
                const isHumanPiece = piece?.player === Player.B;
                const canSeeEnemyPiece = piece?.isRevealed;
                
                // Traps visibility: Reveal if it's the player's own trap or if it's already triggered (isTrapRevealed)
                const shouldSeeTrap = isTrap && (cell.owner === Player.B || cell.isTrapRevealed);

                return (
                  <button
                    key={`${x}-${y}`}
                    onClick={() => handleCellClick(x, y)}
                    className={`
                      relative w-10 h-10 md:w-16 md:h-16 flex items-center justify-center rounded-lg transition-all
                      ${isRiver ? 'bg-blue-900/30' : 'bg-slate-900'}
                      ${isDen ? 'ring-2 ring-yellow-500/20 bg-yellow-500/5' : 'border border-slate-800'}
                      ${isSelected ? 'ring-2 ring-white scale-105 z-10 shadow-lg' : 'hover:bg-slate-800'}
                      ${shouldSeeTrap ? 'ring-1 ring-amber-500/30 ring-inset' : ''}
                    `}
                  >
                    {isDen && <div className={`w-2 h-2 rounded-full absolute top-1 ${cell.owner === Player.A ? 'bg-blue-500/50' : 'bg-red-500/50'}`} />}
                    
                    {shouldSeeTrap && <div className="absolute inset-0 flex items-center justify-center opacity-20"><span className="text-[10px] md:text-sm text-amber-500 font-bold">阱</span></div>}

                    <AnimatePresence mode="wait">
                      {piece && (
                        <motion.div
                          key={piece.id}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          className={`
                            relative w-8 h-8 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-xs md:text-xl shadow-lg border-2
                            ${isHumanPiece ? 'bg-red-600 border-red-400 text-white' : 
                              (canSeeEnemyPiece ? 'bg-blue-600 border-blue-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500')}
                          `}
                        >
                          {isHumanPiece || canSeeEnemyPiece ? ANIMAL_NAMES[piece.type] : <EyeOff size={16} />}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                );
              }))}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showHistory && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed inset-y-0 right-0 w-full md:w-80 bg-slate-900 border-l border-slate-800 z-50 p-6 flex flex-col"
            >
              <h3 className="text-xl font-bold uppercase mb-4">戰鬥紀實</h3>
              <div className="flex-1 overflow-y-auto space-y-2">
                {gameState.history.map((log, i) => (
                  <div key={i} className="text-xs font-mono p-2 bg-slate-950 rounded border border-slate-800">
                    {i + 1}. {log}
                  </div>
                ))}
              </div>
              <button onClick={() => setShowHistory(false)} className="mt-4 py-2 bg-slate-800 rounded">關閉</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {gameState.winner && (
          <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
            <motion.div className="bg-slate-900 border border-slate-700 p-12 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center">
              <Trophy size={60} className="text-yellow-500 mb-4" />
              <h2 className="text-4xl font-black text-white mb-4 uppercase italic">勝利！</h2>
              <p className="text-slate-400 mb-8">{gameState.winner === Player.B ? '紅方獲勝' : '藍方獲勝'}</p>
              <button onClick={resetGame} className="px-12 py-4 bg-red-600 text-white font-black rounded-2xl">重新開始</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
