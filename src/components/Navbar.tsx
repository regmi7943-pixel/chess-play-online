import { useState } from 'react';
import { Volume2, VolumeX, Copy, Check, Info, ArrowLeft, Radio, Users, Crown } from 'lucide-react';
import { soundManager } from '../lib/sounds';
import type { GameMode, PlayerInfo } from '../lib/types';

interface NavbarProps {
  roomCode: string | null;
  mode: GameMode;
  opponent: PlayerInfo | null;
  spectatorCount: number;
  onLeaveRoom: () => void;
  onOpenAbout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  roomCode,
  mode,
  opponent,
  spectatorCount,
  onLeaveRoom,
  onOpenAbout,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [copied, setCopied] = useState<boolean>(false);

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const copyRoomLink = () => {
    if (!roomCode) return;
    const url = `${window.location.origin}${window.location.pathname}?room=${roomCode}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <header className="w-full bg-[#141b26]/90 backdrop-blur-md border-b border-[#243042] sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={roomCode ? onLeaveRoom : undefined}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
            <Crown className="w-5 h-5 fill-white" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-white block leading-none">
              Chess Play Online
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase block mt-1">
              Multiplayer
            </span>
          </div>
        </div>

        {/* Room & Connection Info (When in game) */}
        {roomCode && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#1b2433] border border-[#2b3a4f] py-1 px-2.5 rounded-lg text-xs">
              <span className="text-slate-400">Room:</span>
              <span className="font-mono font-bold text-amber-400">{roomCode}</span>
              <button
                onClick={copyRoomLink}
                title="Copy share link"
                className="ml-1 p-1 hover:bg-[#28364a] text-slate-300 hover:text-white rounded transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* WebSocket connection status */}
            <div className="hidden md:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 py-1 px-2.5 rounded-lg text-xs text-emerald-400">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Real-time WebSocket</span>
            </div>

            {/* Opponent Status */}
            {mode === 'online' && (
              <div
                className={`hidden sm:flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs border ${
                  opponent?.connected
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    opponent?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span>{opponent?.connected ? 'Opponent Online' : 'Waiting for Player 2...'}</span>
              </div>
            )}

            {/* Spectator count */}
            {spectatorCount > 0 && (
              <div className="hidden lg:flex items-center gap-1 py-1 px-2 rounded-lg text-xs bg-slate-800 text-slate-300 border border-slate-700">
                <Users className="w-3 h-3" />
                <span>{spectatorCount}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            className="p-2 rounded-lg bg-[#1c2433] hover:bg-[#253043] border border-[#2b3a4f] text-slate-300 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          {/* About / Tech modal */}
          <button
            onClick={onOpenAbout}
            title="About & Open Source Repos"
            className="p-2 rounded-lg bg-[#1c2433] hover:bg-[#253043] border border-[#2b3a4f] text-slate-300 hover:text-white transition-colors"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* Leave room */}
          {roomCode && (
            <button
              onClick={onLeaveRoom}
              className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-300 text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lobby</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
