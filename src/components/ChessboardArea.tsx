import React, { useMemo, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import type { Square } from 'chess.js';
import { Clock, Edit2, Check, Circle, CircleDot, Zap } from 'lucide-react';
import type { PlayerColor, GameStatus, PlayerInfo, CapturedPieces } from '../lib/types';
import type { Premove } from '../hooks/useChessGame';

interface ChessboardAreaProps {
  fen: string;
  turn: PlayerColor;
  status: GameStatus;
  myColor: PlayerColor;
  myPlayerName: string;
  opponent: PlayerInfo | null;
  boardOrientation: PlayerColor;
  timeControl: number;
  whiteTime: number;
  blackTime: number;
  captured: { white: CapturedPieces; black: CapturedPieces; scoreDiff: number };
  lastMove: { from: string; to: string } | null;
  selectedSquare: Square | null;
  possibleMoves: Square[];
  premove: Premove | null;
  onPieceDrop: (sourceSquare: Square, targetSquare: Square | null) => boolean;
  onSquareClick: (square: Square) => void;
  onClearPremove: () => void;
  onUpdatePlayerName: (name: string) => void;
}

export const ChessboardArea: React.FC<ChessboardAreaProps> = React.memo(({
  fen,
  turn,
  status,
  myColor,
  myPlayerName,
  opponent,
  boardOrientation,
  timeControl,
  whiteTime,
  blackTime,
  captured,
  lastMove,
  selectedSquare,
  possibleMoves,
  premove,
  onPieceDrop,
  onSquareClick,
  onClearPremove,
  onUpdatePlayerName,
}) => {
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [nameInput, setNameInput] = useState<string>(myPlayerName);

  const formatTime = (seconds: number): string => {
    if (timeControl === 0) return '∞';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTopWhite = boardOrientation === 'black';
  const topColor: PlayerColor = isTopWhite ? 'white' : 'black';
  const bottomColor: PlayerColor = isTopWhite ? 'black' : 'white';

  const topTime = topColor === 'white' ? whiteTime : blackTime;
  const bottomTime = bottomColor === 'white' ? whiteTime : blackTime;

  const topCaptured = topColor === 'white' ? captured.white : captured.black;
  const bottomCaptured = bottomColor === 'white' ? captured.white : captured.black;

  const renderCaptured = (c: CapturedPieces) => {
    const pieces: string[] = [];
    if (c.q > 0) pieces.push(`Q${c.q > 1 ? '×' + c.q : ''}`);
    if (c.r > 0) pieces.push(`R${c.r > 1 ? '×' + c.r : ''}`);
    if (c.b > 0) pieces.push(`B${c.b > 1 ? '×' + c.b : ''}`);
    if (c.n > 0) pieces.push(`N${c.n > 1 ? '×' + c.n : ''}`);
    if (c.p > 0) pieces.push(`P${c.p > 1 ? '×' + c.p : ''}`);

    if (pieces.length === 0) return null;
    return (
      <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono text-slate-400">
        {pieces.map((p, i) => (
          <span key={i} className="bg-[#1b2433] px-1 py-0.5 rounded text-[10px] text-slate-300">
            {p}
          </span>
        ))}
      </div>
    );
  };

  const handleSaveName = () => {
    if (nameInput.trim()) {
      onUpdatePlayerName(nameInput.trim());
      setIsEditingName(false);
    }
  };

  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // Last move highlight (amber)
    if (lastMove) {
      styles[lastMove.from] = { backgroundColor: 'rgba(234, 179, 8, 0.22)' };
      styles[lastMove.to] = { backgroundColor: 'rgba(234, 179, 8, 0.35)' };
    }

    // Selected piece highlight (warm gold)
    if (selectedSquare) {
      styles[selectedSquare] = {
        backgroundColor: 'rgba(245, 158, 11, 0.5)',
      };
    }

    // Legal move target circles
    possibleMoves.forEach((sq) => {
      styles[sq] = {
        background: styles[sq]?.backgroundColor
          ? `radial-gradient(circle, rgba(16, 185, 129, 0.8) 22%, transparent 24%), ${styles[sq].backgroundColor}`
          : 'radial-gradient(circle, rgba(16, 185, 129, 0.75) 22%, transparent 24%)',
        borderRadius: '50%',
      };
    });

    // Premove highlight (distinct modern royal blue)
    if (premove) {
      styles[premove.from] = {
        backgroundColor: 'rgba(59, 130, 246, 0.45)',
        boxShadow: 'inset 0 0 6px rgba(59, 130, 246, 0.8)',
      };
      styles[premove.to] = {
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        boxShadow: 'inset 0 0 6px rgba(59, 130, 246, 0.9)',
      };
    }

    return styles;
  }, [lastMove, selectedSquare, possibleMoves, premove]);

  const chessboardOptions = useMemo(
    () => ({
      position: fen,
      boardOrientation,
      onPieceDrop: ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) =>
        onPieceDrop(sourceSquare as Square, targetSquare as Square | null),
      onSquareClick: ({ square }: { square: string }) => onSquareClick(square as Square),
      darkSquareStyle: { backgroundColor: '#3b4c63' },
      lightSquareStyle: { backgroundColor: '#cbd5e1' },
      squareStyles: customSquareStyles,
      animationDurationInMs: 120,
      showNotation: true,
    }),
    [fen, boardOrientation, onPieceDrop, onSquareClick, customSquareStyles]
  );

  return (
    <div className="flex flex-col items-center w-full max-w-[min(100vw-16px,calc(100dvh-270px),500px)] sm:max-w-[480px] lg:max-w-[500px] mx-auto select-none isolate">
      {/* Top Player Info Bar */}
      <div className="w-full flex items-center justify-between bg-[#141b26] border border-[#232f41] rounded-t-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
              topColor === 'white'
                ? 'bg-slate-200 text-slate-900 border-white'
                : 'bg-slate-900 text-slate-200 border-slate-700'
            }`}
          >
            {topColor === 'white' ? (
              <Circle className="w-3.5 h-3.5 fill-current" />
            ) : (
              <CircleDot className="w-3.5 h-3.5 fill-current" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs sm:text-sm text-slate-100 truncate">
                {topColor === myColor
                  ? `${myPlayerName} (You)`
                  : opponent?.name || (!opponent && status === 'active' ? (topColor === 'white' ? 'White' : 'Black') : 'Waiting...')}
              </span>
              {topColor !== myColor && opponent && (
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    opponent?.connected ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                  }`}
                />
              )}
            </div>

            <div className="flex items-center gap-1 mt-0.5">
              {renderCaptured(topCaptured)}
              {topColor === 'white' && captured.scoreDiff > 0 && (
                <span className="text-[10px] font-bold text-emerald-400">
                  +{captured.scoreDiff}
                </span>
              )}
              {topColor === 'black' && captured.scoreDiff < 0 && (
                <span className="text-[10px] font-bold text-emerald-400">
                  +{Math.abs(captured.scoreDiff)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Top Clock */}
        <div
          className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg font-mono text-xs sm:text-sm font-bold border transition-colors ${
            turn === topColor && status === 'active' && timeControl > 0
              ? topTime <= 30
                ? 'bg-red-950/80 text-red-300 border-red-500 animate-pulse'
                : 'bg-amber-950/60 text-amber-300 border-amber-500/70'
              : 'bg-[#1b2433] text-slate-400 border-[#273447]'
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>{formatTime(topTime)}</span>
        </div>
      </div>

      {/* Board Container with Touch Optimization */}
      <div
        className="w-full aspect-square bg-[#0f141c] border-x border-[#232f41] p-1 flex items-center justify-center relative isolate"
        style={{
          touchAction: 'none',
          transform: 'translateZ(0)',
          WebkitTransform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          if (premove) onClearPremove();
        }}
      >
        <div className="w-full h-full">
          <Chessboard options={chessboardOptions} />
        </div>

        {/* Premove Active Notice */}
        {premove && (
          <div
            onClick={onClearPremove}
            className="absolute bottom-2 left-2 z-20 bg-blue-600 text-white text-[10px] font-semibold px-2 py-1 rounded-md shadow-md cursor-pointer flex items-center gap-1"
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>Premove set (tap to cancel)</span>
          </div>
        )}
      </div>

      {/* Bottom Player Info Bar */}
      <div className="w-full flex items-center justify-between bg-[#141b26] border border-[#232f41] rounded-b-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
              bottomColor === 'white'
                ? 'bg-slate-200 text-slate-900 border-white'
                : 'bg-slate-900 text-slate-200 border-slate-700'
            }`}
          >
            {bottomColor === 'white' ? (
              <Circle className="w-3.5 h-3.5 fill-current" />
            ) : (
              <CircleDot className="w-3.5 h-3.5 fill-current" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    className="bg-[#1b2433] border border-amber-500 rounded px-1 py-0.5 text-xs text-white focus:outline-none w-20"
                    autoFocus
                  />
                  <button onClick={handleSaveName} className="p-0.5 text-emerald-400">
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 group">
                  <span className="font-semibold text-xs sm:text-sm text-slate-100 truncate">
                    {bottomColor === myColor ? `${myPlayerName} (You)` : opponent?.name || 'Player 2'}
                  </span>
                  {bottomColor === myColor && (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-0.5 text-slate-500 hover:text-white"
                      title="Edit name"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {status === 'active' && turn === bottomColor && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0">
                  TURN
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 mt-0.5">
              {renderCaptured(bottomCaptured)}
              {bottomColor === 'white' && captured.scoreDiff > 0 && (
                <span className="text-[10px] font-bold text-emerald-400">
                  +{captured.scoreDiff}
                </span>
              )}
              {bottomColor === 'black' && captured.scoreDiff < 0 && (
                <span className="text-[10px] font-bold text-emerald-400">
                  +{Math.abs(captured.scoreDiff)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Clock */}
        <div
          className={`flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg font-mono text-xs sm:text-sm font-bold border transition-colors ${
            turn === bottomColor && status === 'active' && timeControl > 0
              ? bottomTime <= 30
                ? 'bg-red-950/80 text-red-300 border-red-500 animate-pulse'
                : 'bg-amber-950/60 text-amber-300 border-amber-500/70'
              : 'bg-[#1b2433] text-slate-400 border-[#273447]'
          }`}
        >
          <Clock className="w-3 h-3" />
          <span>{formatTime(bottomTime)}</span>
        </div>
      </div>
    </div>
  );
});
