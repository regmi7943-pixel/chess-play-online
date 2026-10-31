import React, { useState } from 'react';
import { Play, Users, Clock, ArrowRight, User, Dices, Circle, CircleDot, Zap, Undo2, Swords, Link2 } from 'lucide-react';

interface LobbyProps {
  playerName: string;
  onUpdatePlayerName: (name: string) => void;
  onCreateOnlineGame: (
    timeControl: number,
    colorPref: 'white' | 'black' | 'random',
    enablePremoves: boolean,
    enableUndo: boolean
  ) => void;
  onJoinOnlineGame: (roomCode: string) => void;
  onStartLocalGame: () => void;
  onOpenAbout: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  playerName,
  onUpdatePlayerName,
  onCreateOnlineGame,
  onJoinOnlineGame,
  onStartLocalGame,
}) => {
  const [selectedTimeControl, setSelectedTimeControl] = useState<number>(600);
  const [selectedColor, setSelectedColor] = useState<'white' | 'black' | 'random'>('white');
  const [enablePremoves, setEnablePremoves] = useState<boolean>(true);
  const [enableUndo, setEnableUndo] = useState<boolean>(true);
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>(playerName);

  const timeControlOptions = [
    { label: '3 min', sub: 'Blitz', value: 180 },
    { label: '5 min', sub: 'Blitz', value: 300 },
    { label: '10 min', sub: 'Rapid', value: 600 },
    { label: '15 min', sub: 'Classical', value: 900 },
    { label: 'Unlimited', sub: 'Casual', value: 0 },
  ];

  const handleCreate = () => {
    if (nameInput.trim()) {
      onUpdatePlayerName(nameInput.trim());
    }
    onCreateOnlineGame(selectedTimeControl, selectedColor, enablePremoves, enableUndo);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    if (nameInput.trim()) {
      onUpdatePlayerName(nameInput.trim());
    }
    onJoinOnlineGame(joinCodeInput.trim().toUpperCase());
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-10 animate-fadeIn">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-1 sm:mb-2">
          Chess Play Online
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
          Real-time chess over WebSockets. No account required.
        </p>
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Card 1: Create Game */}
        <div className="bg-[#141b26] border border-[#232f41] rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Swords className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white leading-tight">Create Room</h2>
                <p className="text-[11px] sm:text-xs text-slate-400">Host a match and invite a friend</p>
              </div>
            </div>

            {/* Display Name Input */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Player Name
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter player name"
                maxLength={20}
                className="w-full bg-[#1b2433] border border-[#2b3a4f] rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Time Control Options */}
            <div className="mb-3 sm:mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Time Control
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 sm:gap-2">
                {timeControlOptions.map((tc) => (
                  <button
                    key={tc.value}
                    type="button"
                    onClick={() => setSelectedTimeControl(tc.value)}
                    className={`py-2 px-1 rounded-xl text-center border transition-all ${
                      selectedTimeControl === tc.value
                        ? 'bg-amber-600/25 border-amber-500 text-white font-semibold shadow-sm'
                        : 'bg-[#1b2433] border-[#273447] text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-xs">{tc.label}</div>
                    <div className="text-[9px] sm:text-[10px] text-slate-400">{tc.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Play as Color Preference */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Play As
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedColor('white')}
                  className={`py-2 px-2 sm:px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                    selectedColor === 'white'
                      ? 'bg-slate-200 text-slate-900 border-white font-semibold'
                      : 'bg-[#1b2433] border-[#273447] text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <Circle className="w-3 h-3 fill-current" />
                  <span>White</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedColor('black')}
                  className={`py-2 px-2 sm:px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                    selectedColor === 'black'
                      ? 'bg-slate-900 text-amber-300 border-amber-500/70 font-semibold'
                      : 'bg-[#1b2433] border-[#273447] text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <CircleDot className="w-3 h-3 fill-current" />
                  <span>Black</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedColor('random')}
                  className={`py-2 px-2 sm:px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                    selectedColor === 'random'
                      ? 'bg-[#273447] text-amber-300 border-amber-500 font-semibold'
                      : 'bg-[#1b2433] border-[#273447] text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Random</span>
                </button>
              </div>
            </div>

            {/* Premove Toggle */}
            <div className="mb-2.5 sm:mb-3 flex items-center justify-between p-2.5 rounded-xl bg-[#1b2433] border border-[#273447]">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-medium text-slate-200">Allow Pre-moves</div>
                  <div className="text-[10px] text-slate-400">Queue moves during opponent turn</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enablePremoves}
                  onChange={(e) => setEnablePremoves(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#253244] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {/* Allow Undo / Redo Toggle */}
            <div className="mb-5 sm:mb-6 flex items-center justify-between p-2.5 rounded-xl bg-[#1b2433] border border-[#273447]">
              <div className="flex items-center gap-2">
                <Undo2 className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-medium text-slate-200">Allow Undo / Redo</div>
                  <div className="text-[10px] text-slate-400">Take back and replay moves during match</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableUndo}
                  onChange={(e) => setEnableUndo(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-[#253244] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>
          </div>

          {/* Create Button */}
          <button
            onClick={handleCreate}
            className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-amber-600/20 active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Create Room</span>
          </button>
        </div>

        {/* Right Column: Join Room + Pass & Play */}
        <div className="space-y-4 sm:space-y-6 flex flex-col justify-between">
          {/* Join Room */}
          <div className="bg-[#141b26] border border-[#232f41] rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                <Link2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white leading-tight">Join Room</h2>
                <p className="text-[11px] sm:text-xs text-slate-400">Enter room code from your opponent</p>
              </div>
            </div>

            <form onSubmit={handleJoin} className="space-y-2.5 sm:space-y-3">
              <input
                type="text"
                value={joinCodeInput}
                onChange={(e) => setJoinCodeInput(e.target.value)}
                placeholder="e.g. CP-7391"
                maxLength={10}
                className="w-full bg-[#1b2433] border border-[#2b3a4f] rounded-xl px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-mono uppercase text-white placeholder-slate-500 tracking-wider focus:outline-none focus:border-sky-500 transition-colors"
              />
              <button
                type="submit"
                disabled={!joinCodeInput.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold text-xs sm:text-sm transition-all active:scale-[0.98]"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Join Game</span>
              </button>
            </form>
          </div>

          {/* Pass & Play */}
          <div className="bg-[#141b26] border border-[#232f41] rounded-2xl p-4 sm:p-6 shadow-xl">
            <div className="flex items-center gap-3 mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white leading-tight">Pass & Play</h2>
                <p className="text-[11px] sm:text-xs text-slate-400">Play locally on this screen</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-3 sm:mb-4 leading-relaxed">
              Two-player chess on this device without connecting online. Unlimited time & takebacks.
            </p>
            <button
              onClick={onStartLocalGame}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1b2433] hover:bg-[#232f42] border border-[#2a384c] text-slate-200 font-semibold text-xs sm:text-sm transition-all active:scale-[0.98]"
            >
              <Play className="w-4 h-4" />
              <span>Start Match</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
