import React from 'react';
import { motion } from 'motion/react';
import { AnimalType, Player } from '../types';
import { ANIMAL_NAMES } from '../constants';
import { ShieldCheck, Eraser, Play, Shuffle } from 'lucide-react';

interface SetupPhaseProps {
  onPlace: (x: number, y: number, item: AnimalType | 'trap') => void;
  onRemove: (x: number, y: number) => void;
  onAuto: () => void;
  onFinish: () => void;
  inventory: Record<string, number>;
  board: any[][];
  message: string | null;
}

export const SetupPhase: React.FC<SetupPhaseProps> = ({ 
  onPlace, onRemove, onAuto, onFinish, inventory, board, message 
}) => {
  const [selectedItem, setSelectedItem] = React.useState<AnimalType | 'trap' | null>(null);
  
  const totalInInventory = (Object.values(inventory) as number[]).reduce((a, b) => a + b, 0);
  const totalSlots = 16 + 3; // 16 animals + 3 traps

  return (
    <div className="flex flex-col items-center gap-6 p-4 md:p-8 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
          <ShieldCheck className="text-red-500" />
          自由佈局階段
        </h2>
        <p className="text-slate-400 text-sm max-w-md">
          請在棋盤下方三列 (第 6-8 列) 放置你的 16 枚棋子與 3 個陷阱。
          對手看不見你的佈局，陷阱預設是隱藏的，直到有人掉進去。
        </p>
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500/50 text-red-500 px-4 py-2 rounded-lg text-sm"
        >
          {message}
        </motion.div>
      )}

      <div className="flex flex-wrap justify-center gap-3 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        {/* Animals */}
        {Object.entries(ANIMAL_NAMES).sort((a, b) => Number(a[0]) - Number(b[0])).map(([type, name]) => {
          const animalType = Number(type) as AnimalType;
          const count = inventory[animalType] || 0;
          const isSelected = selectedItem === animalType;
          return (
            <button
              key={type}
              onClick={() => setSelectedItem(animalType)}
              disabled={count === 0}
              className={`
                relative flex flex-col items-center justify-center w-16 h-16 rounded-lg border-2 transition-all
                ${count === 0 ? 'opacity-20 cursor-not-allowed border-transparent' : 
                  isSelected ? 'border-red-500 bg-red-500/20 text-white scale-110 shadow-lg shadow-red-500/20' : 
                  'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'}
              `}
            >
              <span className="text-xl font-bold">{name}</span>
              <span className="text-[10px] absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950">
                {count}
              </span>
            </button>
          );
        })}
        {/* Traps */}
        <button
          onClick={() => setSelectedItem('trap')}
          disabled={(inventory['trap'] || 0) === 0}
          className={`
            relative flex flex-col items-center justify-center w-16 h-16 rounded-lg border-2 transition-all
            ${(inventory['trap'] || 0) === 0 ? 'opacity-20 cursor-not-allowed border-transparent' : 
              selectedItem === 'trap' ? 'border-amber-500 bg-amber-500/20 text-white scale-110 shadow-lg shadow-amber-500/20' : 
              'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'}
          `}
        >
          <span className="text-xl font-bold">阱</span>
          <span className="text-[10px] absolute -top-2 -right-2 bg-amber-500 text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950">
            {inventory['trap'] || 0}
          </span>
        </button>
      </div>

      <div className="flex gap-4">
        <button 
          onClick={onAuto}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-all text-sm font-medium"
        >
          <Shuffle size={16} /> 自動佈局
        </button>
        <button 
          onClick={onFinish}
          disabled={totalInInventory > 0}
          className={`
            flex items-center gap-2 px-6 py-2 rounded-lg transition-all text-sm font-bold
            ${totalInInventory === 0 
              ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20' 
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
          `}
        >
          <Play size={16} /> 確認完成 ({totalSlots - totalInInventory}/{totalSlots})
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 md:gap-2 bg-slate-950 p-2 md:p-3 rounded-xl border border-slate-800 shadow-2xl overflow-auto">
        {board.map((row, x) => (
          row.map((cell, y) => {
            const isSelectable = x >= 6;
            const piece = cell.piece;
            const isTrap = cell.type === 'trap' && cell.owner === Player.B;
            return (
              <div
                key={`${x}-${y}`}
                onClick={() => {
                  if (!isSelectable) return;
                  if (piece || isTrap) {
                    onRemove(x, y);
                  } else if (selectedItem) {
                    onPlace(x, y, selectedItem);
                  }
                }}
                className={`
                  w-10 h-10 md:w-12 md:h-12 rounded-sm relative flex items-center justify-center cursor-pointer transition-all
                  ${x >= 6 ? 'bg-red-950/10 hover:bg-red-900/30 ring-1 ring-inset ring-red-500/10' : 'bg-slate-900/10 opacity-30'}
                  ${cell.type === 'den' ? 'ring-2 ring-gold shadow-inner' : ''}
                `}
              >
                {piece && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-8 h-8 md:w-10 md:h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-black/40 border border-red-400"
                  >
                    {ANIMAL_NAMES[piece.type]}
                  </motion.div>
                )}
                {isTrap && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-8 h-8 md:w-10 md:h-10 bg-amber-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-black/40 border border-amber-400"
                  >
                    阱
                  </motion.div>
                )}
                {isSelectable && !piece && !isTrap && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-red-500/10">
                    <span className="text-[10px] text-red-500 font-mono italic">PLACE</span>
                  </div>
                )}
              </div>
            );
          })
        ))}
      </div>
    </div>
  );
};
