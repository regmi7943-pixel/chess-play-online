import React from 'react';
import { Trophy, RefreshCw, ArrowLeft, Frown, Handshake, X } from 'lucide-react';
import type { PlayerColor, GameStatus, GameMode } from '../lib/types';

interface GameOverModalProps {
  status: GameStatus;
  winner: PlayerColor | 'draw' | null;
  reason: string;
  myColor: PlayerColor;
  mode: GameMode;
  rematchOfferedBy: PlayerColor | null;
  onRequestRematch: () => void;
  onAcceptRematch: () => void;
  onReturnToLobby: () => void;
  onClose?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  reason,
  myColor,
  mode,
  rematchOfferedBy,
  onRequestRematch,
  onAcceptRematch,
  onReturnToLobby,
  onClose,
}) => {
  const isWinner = winner === myColor;
  const isDraw = winner === 'draw';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#141b26] border border-[#2b3a4f] rounded-2xl p-5 sm:p-6 max-w-sm w-full text-center shadow-2xl relative">
        {/* Dismiss X button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Review board"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Icon */}
        <div className="flex justify-center mb-3">
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center ${
              isWinner
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : isDraw
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {isWinner ? (
              <Trophy className="w-6 h-6 sm:w-7 sm:h-7" />
            ) : isDraw ? (
              <Handshake className="w-6 h-6 sm:w-7 sm:h-7" />
            ) : (
              <Frown className="w-6 h-6 sm:w-7 sm:h-7" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg sm:text-xl font-bold text-white mb-1">
          {mode === 'local'
            ? winner === 'draw'
              ? 'Draw'
              : `${winner === 'white' ? 'White' : 'Black'} Wins!`
            : isWinner
            ? 'Victory'
            : isDraw
            ? 'Draw'
            : 'Defeat'}
        </h2>

        {/* Reason */}
        <p className="text-slate-400 text-xs mb-4">
          {reason || (winner ? `${winner.toUpperCase()} won` : 'Game finished')}
        </p>

        {/* Rematch banner if opponent offered */}
        {mode === 'online' && rematchOfferedBy && rematchOfferedBy !== myColor && (
          <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-2 mb-3 text-xs text-amber-300 font-medium">
            Opponent requested a rematch!
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {mode === 'local' ? (
            <button
              onClick={onRequestRematch}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-colors active:scale-[0.98]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Play Again</span>
            </button>
          ) : rematchOfferedBy && rematchOfferedBy !== myColor ? (
            <button
              onClick={onAcceptRematch}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors active:scale-[0.98]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Accept Rematch</span>
            </button>
          ) : (
            <button
              onClick={onRequestRematch}
              disabled={rematchOfferedBy === myColor}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-semibold text-xs transition-colors active:scale-[0.98]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{rematchOfferedBy === myColor ? 'Rematch Offered...' : 'Rematch'}</span>
            </button>
          )}

          <button
            onClick={onReturnToLobby}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1c2433] hover:bg-[#253043] border border-[#2b3a4f] text-slate-300 text-xs font-semibold transition-colors active:scale-[0.98]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Lobby</span>
          </button>
        </div>
      </div>
    </div>
  );
};
