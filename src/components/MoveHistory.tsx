import React, { useRef, useEffect, useState } from 'react';
import { Copy, Check, FileText, Undo2, Redo2 } from 'lucide-react';
import type { MoveRecord } from '../lib/types';

interface MoveHistoryProps {
  history: MoveRecord[];
  fen: string;
  canUndo?: boolean;
  canRedo?: boolean;
  allowUndo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export const MoveHistory: React.FC<MoveHistoryProps> = React.memo(({
  history,
  fen,
  canUndo = false,
  canRedo = false,
  allowUndo = true,
  onUndo,
  onRedo,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copiedPgn, setCopiedPgn] = useState<boolean>(false);
  const [copiedFen, setCopiedFen] = useState<boolean>(false);

  const movePairs: Array<{ number: number; white: string; black?: string }> = [];
  for (let i = 0; i < history.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: history[i].san,
      black: history[i + 1]?.san,
    });
  }

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history.length]);

  const copyPGN = () => {
    let pgnString = '';
    movePairs.forEach((pair) => {
      pgnString += `${pair.number}. ${pair.white} ${pair.black ? pair.black + ' ' : ''}`;
    });
    navigator.clipboard.writeText(pgnString.trim()).then(() => {
      setCopiedPgn(true);
      setTimeout(() => setCopiedPgn(false), 2000);
    });
  };

  const copyFEN = () => {
    navigator.clipboard.writeText(fen).then(() => {
      setCopiedFen(true);
      setTimeout(() => setCopiedFen(false), 2000);
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#141b26] border border-[#232f41] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#17202d] border-b border-[#232f41]">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>Moves ({history.length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          {allowUndo && (onUndo || onRedo) && (
            <div className="flex items-center gap-1 border-r border-[#232f41] pr-1.5">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                title="Undo move"
                className="p-1 rounded bg-[#1b2433] hover:bg-[#253244] disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-colors"
              >
                <Undo2 className="w-3 h-3 text-amber-400" />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                title="Redo move"
                className="p-1 rounded bg-[#1b2433] hover:bg-[#253244] disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-colors"
              >
                <Redo2 className="w-3 h-3 text-amber-400" />
              </button>
            </div>
          )}
          <button
            onClick={copyPGN}
            title="Copy PGN"
            className="flex items-center gap-1 py-0.5 px-2 rounded bg-[#1b2433] hover:bg-[#253244] text-[10px] text-slate-300 transition-colors"
          >
            {copiedPgn ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>PGN</span>
          </button>
          <button
            onClick={copyFEN}
            title="Copy FEN"
            className="flex items-center gap-1 py-0.5 px-2 rounded bg-[#1b2433] hover:bg-[#253244] text-[10px] text-slate-300 transition-colors"
          >
            {copiedFen ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>FEN</span>
          </button>
        </div>
      </div>

      {/* Move list */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-2 space-y-0.5 max-h-[180px] sm:max-h-[220px] min-h-[120px]">
        {movePairs.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No moves yet.
          </div>
        ) : (
          movePairs.map((pair) => (
            <div
              key={pair.number}
              className="flex items-center text-xs py-1 px-2 rounded hover:bg-[#1b2433] transition-colors"
            >
              <span className="w-7 text-slate-500 font-mono text-right mr-3">
                {pair.number}.
              </span>
              <span className="w-16 font-semibold text-slate-200 font-mono">
                {pair.white}
              </span>
              <span className="w-16 font-semibold text-slate-300 font-mono">
                {pair.black || ''}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
});
