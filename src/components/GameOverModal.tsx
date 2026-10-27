import React from 'react';
import { Trophy, RefreshCw, ArrowLeft, Frown, Handshake } from 'lucide-react';
import type { PlayerColor, GameStatus } from '../lib/types';

interface GameOverModalProps {
  status: GameStatus;
  winner: PlayerColor | 'draw' | null;
  reason: string;
  myColor: PlayerColor;
  rematchOfferedBy: PlayerColor | null;
  onRequestRematch: () => void;
  onAcceptRematch: () => void;
  onReturnToLobby: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  reason,
  myColor,
  rematchOfferedBy,
  onRequestRematch,
  onAcceptRematch,
  onReturnToLobby,
}) => {
  const isWinner = winner === myColor;
  const isDraw = winner === 'draw';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#141b26] border border-[#2b3a4f] rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl relative">
        {/* Icon */}
        <div className="flex justify-center mb-3">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              isWinner
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : isDraw
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {isWinner ? (
              <Trophy className="w-7 h-7" />
            ) : isDraw ? (
              <Handshake className="w-7 h-7" />
            ) : (
              <Frown className="w-7 h-7" />
            )}
          </div>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white mb-1">
          {isWinner ? 'Victory' : isDraw ? 'Draw' : 'Defeat'}
        </h2>

        {/* Reason */}
        <p className="text-slate-400 text-xs mb-5">
          {reason || (winner ? `${winner.toUpperCase()} won` : 'Game finished')}
        </p>

        {/* Rematch banner */}
        {rematchOfferedBy && rematchOfferedBy !== myColor && (
          <div className="bg-amber-500/15 border border-amber-500/30 rounded-xl p-2.5 mb-4 text-xs text-amber-300">
            Opponent requested a rematch
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {rematchOfferedBy && rematchOfferedBy !== myColor ? (
            <button
              onClick={onAcceptRematch}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Accept Rematch
            </button>
          ) : (
            <button
              onClick={onRequestRematch}
              disabled={rematchOfferedBy === myColor}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold text-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {rematchOfferedBy === myColor ? 'Rematch Offered' : 'Rematch'}
            </button>
          )}

          <button
            onClick={onReturnToLobby}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1c2433] hover:bg-[#253043] border border-[#2b3a4f] text-slate-300 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Lobby
          </button>
        </div>
      </div>
    </div>
  );
};
