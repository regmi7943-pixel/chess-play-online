import React from 'react';
import type { PlayerColor } from '../lib/types';

interface PromotionDialogProps {
  color: PlayerColor;
  onSelect: (piece: 'q' | 'r' | 'b' | 'n') => void;
  onCancel: () => void;
}

export const PromotionDialog: React.FC<PromotionDialogProps> = ({
  onSelect,
  onCancel,
}) => {
  const pieces: Array<{ type: 'q' | 'r' | 'b' | 'n'; label: string; short: string }> = [
    { type: 'q', label: 'Queen', short: 'Q' },
    { type: 'r', label: 'Rook', short: 'R' },
    { type: 'b', label: 'Bishop', short: 'B' },
    { type: 'n', label: 'Knight', short: 'N' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
      <div className="bg-[#141b26] border border-[#2b3a4f] rounded-2xl p-5 max-w-xs w-full text-center">
        <h3 className="text-base font-bold text-white mb-1">Promote Pawn</h3>
        <p className="text-xs text-slate-400 mb-4">Choose a piece</p>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {pieces.map((p) => (
            <button
              key={p.type}
              onClick={() => onSelect(p.type)}
              className="flex flex-col items-center justify-center py-3 px-2 rounded-xl bg-[#1b2433] hover:bg-amber-600/20 border border-[#273447] hover:border-amber-500 transition-all active:scale-95 group"
            >
              <span className="text-xl font-black text-amber-400 group-hover:scale-110 transition-transform font-mono">
                {p.short}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">{p.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
