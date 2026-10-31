import React from 'react';
import { X, ExternalLink, ShieldCheck, Radio, Globe, Crown } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
      <div className="bg-[#141b26] border border-[#2b3a4f] rounded-2xl p-5 sm:p-6 max-w-md w-full text-left relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Crown className="w-5 h-5 fill-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Chess Play Online</h2>
            <p className="text-xs text-slate-400">Open source stack & real-time sync</p>
          </div>
        </div>

        <div className="space-y-2.5 mb-5">
          {/* chess.js */}
          <a
            href="https://github.com/jhlywa/chess.js"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2.5 p-3 rounded-xl bg-[#1b2433] hover:bg-[#232f42] border border-[#273447] transition-colors group"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white group-hover:text-amber-300">
                  jhlywa/chess.js
                </span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Chess move generation, legal moves, checkmate, stalemate, and FEN/PGN.
              </p>
            </div>
          </a>

          {/* react-chessboard */}
          <a
            href="https://github.com/Clariity/react-chessboard"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2.5 p-3 rounded-xl bg-[#1b2433] hover:bg-[#232f42] border border-[#273447] transition-colors group"
          >
            <Globe className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white group-hover:text-emerald-300">
                  Clariity/react-chessboard
                </span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Interactive board UI with drag-and-drop piece manipulation.
              </p>
            </div>
          </a>

          {/* Supabase WebSockets */}
          <a
            href="https://supabase.com/realtime"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2.5 p-3 rounded-xl bg-[#1b2433] hover:bg-[#232f42] border border-[#273447] transition-colors group"
          >
            <Radio className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white group-hover:text-sky-300">
                  Supabase Realtime WebSockets
                </span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Low-latency bidirectional move broadcast and presence.
              </p>
            </div>
          </a>
        </div>

        <div className="flex justify-end pt-3 border-t border-[#232f41]">
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-lg bg-[#1b2433] hover:bg-[#232f42] text-slate-300 text-xs font-medium border border-[#273447] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
