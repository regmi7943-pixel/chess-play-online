import React, { useState } from 'react';
import { Flag, Handshake, RotateCcw, Share2, Check, AlertTriangle, RefreshCw, Trophy, ArrowLeft } from 'lucide-react';
import type { PlayerColor, GameStatus, GameMode } from '../lib/types';

interface GameControlsProps {
  status: GameStatus;
  myColor: PlayerColor;
  roomCode: string | null;
  mode?: GameMode;
  drawOfferedBy: PlayerColor | null;
  rematchOfferedBy?: PlayerColor | null;
  onResign: () => void;
  onOfferDraw: () => void;
  onAcceptDraw: () => void;
  onDeclineDraw: () => void;
  onFlipBoard: () => void;
  onRequestRematch?: () => void;
  onAcceptRematch?: () => void;
  onReturnToLobby?: () => void;
  onReopenModal?: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  status,
  myColor,
  roomCode,
  mode = 'online',
  drawOfferedBy,
  rematchOfferedBy,
  onResign,
  onOfferDraw,
  onAcceptDraw,
  onDeclineDraw,
  onFlipBoard,
  onRequestRematch,
  onAcceptRematch,
  onReturnToLobby,
  onReopenModal,
}) => {
  const [showResignConfirm, setShowResignConfirm] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const copyLink = () => {
    if (!roomCode) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const isGameOver = status !== 'active' && status !== 'waiting';

  return (
    <div className="flex flex-col gap-2.5">
      {/* Draw Offer Notification */}
      {drawOfferedBy && drawOfferedBy !== myColor && !isGameOver && (
        <div className="bg-blue-500/15 border border-blue-500/40 rounded-xl p-3 flex items-center justify-between gap-2 animate-pulse">
          <div className="text-xs text-blue-300 font-medium">
            Opponent offered a draw. Accept?
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={onAcceptDraw}
              className="py-1 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
            >
              Accept
            </button>
            <button
              onClick={onDeclineDraw}
              className="py-1 px-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Resign confirmation popup */}
      {showResignConfirm ? (
        <div className="bg-red-500/15 border border-red-500/40 rounded-xl p-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-red-300 font-medium">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Are you sure you want to resign?</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                setShowResignConfirm(false);
                onResign();
              }}
              className="py-1 px-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
            >
              Yes, Resign
            </button>
            <button
              onClick={() => setShowResignConfirm(false)}
              className="py-1 px-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Action buttons row */
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Flip Board */}
          <button
            onClick={onFlipBoard}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1c2433] hover:bg-[#253043] border border-[#2b3a4f] text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Flip</span>
          </button>

          {isGameOver ? (
            <>
              {/* Rematch Button */}
              {mode === 'local' ? (
                onRequestRematch && (
                  <button
                    onClick={onRequestRematch}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-semibold text-white transition-colors active:scale-[0.98]"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Play Again</span>
                  </button>
                )
              ) : rematchOfferedBy && rematchOfferedBy !== myColor ? (
                onAcceptRematch && (
                  <button
                    onClick={onAcceptRematch}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors active:scale-[0.98] animate-pulse"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Accept Rematch</span>
                  </button>
                )
              ) : (
                onRequestRematch && (
                  <button
                    onClick={onRequestRematch}
                    disabled={rematchOfferedBy === myColor}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-400 text-xs font-semibold text-white transition-colors active:scale-[0.98]"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{rematchOfferedBy === myColor ? 'Offered' : 'Rematch'}</span>
                  </button>
                )
              )}

              {/* Re-open Modal */}
              {onReopenModal && (
                <button
                  onClick={onReopenModal}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1c2433] hover:bg-[#253043] border border-[#2b3a4f] text-xs font-medium text-amber-300 hover:text-white transition-colors"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Results</span>
                </button>
              )}

              {/* Return to Lobby */}
              {onReturnToLobby && (
                <button
                  onClick={onReturnToLobby}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-[#2b3a4f] text-xs font-semibold text-slate-200 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Lobby</span>
                </button>
              )}
            </>
          ) : (
            <>
              {/* Share Link */}
              {roomCode && (
                <button
                  onClick={copyLink}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1c2433] hover:bg-[#253043] border border-[#2b3a4f] text-xs font-medium text-slate-300 hover:text-white transition-colors"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </>
                  )}
                </button>
              )}

              {/* Offer Draw */}
              <button
                onClick={onOfferDraw}
                disabled={status !== 'active' || drawOfferedBy === myColor}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#1c2433] hover:bg-[#253043] disabled:opacity-40 disabled:cursor-not-allowed border border-[#2b3a4f] text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                <Handshake className="w-3.5 h-3.5" />
                <span>{drawOfferedBy === myColor ? 'Draw Sent' : 'Draw'}</span>
              </button>

              {/* Resign */}
              <button
                onClick={() => setShowResignConfirm(true)}
                disabled={status !== 'active'}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-red-600/15 hover:bg-red-600/25 disabled:opacity-40 disabled:cursor-not-allowed border border-red-500/30 text-xs font-semibold text-red-300 hover:text-red-200 transition-colors"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Resign</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
