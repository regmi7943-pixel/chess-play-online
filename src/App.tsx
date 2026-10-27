import { useState, useEffect } from 'react';
import { useChessGame } from './hooks/useChessGame';
import { Navbar } from './components/Navbar';
import { Lobby } from './components/Lobby';
import { ChessboardArea } from './components/ChessboardArea';
import { MoveHistory } from './components/MoveHistory';
import { ChatBox } from './components/ChatBox';
import { GameControls } from './components/GameControls';
import { PromotionDialog } from './components/PromotionDialog';
import { GameOverModal } from './components/GameOverModal';
import { AboutModal } from './components/AboutModal';
import type { GameMode } from './lib/types';
import { MessageSquare, FileText, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

export function App() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [mode, setMode] = useState<GameMode>('online');
  const [timeControl, setTimeControl] = useState<number>(600);
  const [colorPref, setColorPref] = useState<'white' | 'black' | 'random'>('white');
  const [allowPremoves, setAllowPremoves] = useState<boolean>(true);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'moves' | 'chat'>('moves');
  const [showMobilePanel, setShowMobilePanel] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomCode(roomParam.toUpperCase());
      setMode('online');
    }
  }, []);

  const {
    fen,
    turn,
    status,
    winner,
    statusReason,
    myPlayerName,
    myColor,
    opponent,
    spectatorCount,
    whiteTime,
    blackTime,
    premove,
    history,
    lastMove,
    selectedSquare,
    possibleMoves,
    pendingPromotion,
    messages,
    drawOfferedBy,
    rematchOfferedBy,
    boardOrientation,
    captured,
    isCheck,
    onPieceDrop,
    onSquareClick,
    completePromotion,
    cancelPromotion,
    clearPremove,
    sendChatMessage,
    resignGame,
    offerDraw,
    acceptDraw,
    declineDraw,
    requestRematch,
    acceptRematch,
    toggleBoardOrientation,
    updatePlayerName,
    leaveGame,
  } = useChessGame({
    roomCode,
    mode,
    initialTimeControl: timeControl,
    initialColorPreference: colorPref,
    initialEnablePremoves: allowPremoves,
  });

  const [dismissedGameOver, setDismissedGameOver] = useState<boolean>(false);

  useEffect(() => {
    if (status === 'active') {
      setDismissedGameOver(false);
    }
  }, [status]);

  const handleCreateOnlineGame = (tc: number, color: 'white' | 'black' | 'random', premoves: boolean) => {
    leaveGame();
    setDismissedGameOver(false);
    const randomCode = 'CP-' + Math.floor(1000 + Math.random() * 9000);
    setTimeControl(tc);
    setColorPref(color);
    setAllowPremoves(premoves);
    setMode('online');
    setRoomCode(randomCode);

    const newUrl = `${window.location.pathname}?room=${randomCode}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleJoinOnlineGame = (code: string) => {
    leaveGame();
    setDismissedGameOver(false);
    const cleaned = code.trim().toUpperCase();
    setMode('online');
    setRoomCode(cleaned);

    const newUrl = `${window.location.pathname}?room=${cleaned}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleStartLocalGame = () => {
    leaveGame();
    setDismissedGameOver(false);
    setMode('local');
    setRoomCode(null);
    setTimeControl(0);
  };

  const handleLeaveRoom = () => {
    leaveGame();
    setDismissedGameOver(false);
    setRoomCode(null);
    setMode('online');
    window.history.pushState({}, '', window.location.pathname);
  };

  const isGameOver = status !== 'active' && status !== 'waiting';

  return (
    <div className="min-h-screen bg-[#0d121a] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Navigation Header */}
      <Navbar
        roomCode={roomCode}
        mode={mode}
        opponent={opponent}
        spectatorCount={spectatorCount}
        onLeaveRoom={handleLeaveRoom}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 lg:p-6 w-full max-w-7xl mx-auto">
        {!roomCode && mode !== 'local' ? (
          <Lobby
            playerName={myPlayerName}
            onUpdatePlayerName={updatePlayerName}
            onCreateOnlineGame={handleCreateOnlineGame}
            onJoinOnlineGame={handleJoinOnlineGame}
            onStartLocalGame={handleStartLocalGame}
            onOpenAbout={() => setIsAboutOpen(true)}
          />
        ) : (
          <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-3 sm:gap-6 animate-fadeIn">
            {/* Left Column: Chess Board Area */}
            <div className="w-full flex-1 max-w-[min(100vw-16px,500px)] sm:max-w-[480px] lg:max-w-[500px] flex flex-col items-center">
              {/* Check Alert Banner */}
              {isCheck && status === 'active' && (
                <div className="w-full mb-1.5 bg-red-500/20 border border-red-500/40 rounded-xl px-3 py-1 flex items-center justify-center gap-1.5 text-xs text-red-300 font-semibold animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  <span>Check!</span>
                </div>
              )}

              <ChessboardArea
                fen={fen}
                turn={turn}
                status={status}
                myColor={myColor}
                myPlayerName={myPlayerName}
                opponent={opponent}
                boardOrientation={boardOrientation}
                timeControl={timeControl}
                whiteTime={whiteTime}
                blackTime={blackTime}
                captured={captured}
                lastMove={lastMove}
                selectedSquare={selectedSquare}
                possibleMoves={possibleMoves}
                premove={premove}
                onPieceDrop={onPieceDrop}
                onSquareClick={onSquareClick}
                onClearPremove={clearPremove}
                onUpdatePlayerName={updatePlayerName}
              />

              {/* Mobile Game Controls Bar (Directly beneath board on mobile) */}
              <div className="w-full mt-2 lg:hidden bg-[#141b26] border border-[#232f41] rounded-xl p-2 shadow-lg">
                <div className="flex items-center justify-between mb-2 px-1 text-xs">
                  <span className="text-slate-400 text-[11px]">Status</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                      status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : status === 'waiting'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {status === 'active'
                      ? `${turn === 'white' ? 'White' : 'Black'} to move`
                      : status === 'waiting'
                      ? 'Waiting'
                      : status.toUpperCase()}
                  </span>
                </div>

                <GameControls
                  status={status}
                  myColor={myColor}
                  roomCode={roomCode}
                  drawOfferedBy={drawOfferedBy}
                  onResign={resignGame}
                  onOfferDraw={offerDraw}
                  onAcceptDraw={acceptDraw}
                  onDeclineDraw={declineDraw}
                  onFlipBoard={toggleBoardOrientation}
                />

                {/* Mobile Drawer Toggle for Moves/Chat */}
                <button
                  onClick={() => setShowMobilePanel(!showMobilePanel)}
                  className="w-full mt-2 pt-2 border-t border-[#232f41] flex items-center justify-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <span>{showMobilePanel ? 'Hide Moves & Chat' : 'View Moves & Chat'}</span>
                  {showMobilePanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Right Column: Desktop Sidebar & Mobile Expandable Panel */}
            <div
              className={`w-full max-w-[min(100vw-16px,500px)] sm:max-w-[480px] lg:max-w-none lg:w-80 flex-col gap-3 ${
                showMobilePanel ? 'flex' : 'hidden lg:flex'
              }`}
            >
              {/* Desktop Status Card */}
              <div className="hidden lg:block bg-[#141b26] border border-[#232f41] rounded-2xl p-3.5 shadow-xl">
                <div className="flex items-center justify-between mb-2.5 text-xs">
                  <span className="text-slate-400 font-medium">Status</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                      status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : status === 'waiting'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-red-500/10 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {status === 'active'
                      ? `${turn === 'white' ? 'White' : 'Black'} to move`
                      : status === 'waiting'
                      ? 'Waiting'
                      : status.toUpperCase()}
                  </span>
                </div>

                <GameControls
                  status={status}
                  myColor={myColor}
                  roomCode={roomCode}
                  drawOfferedBy={drawOfferedBy}
                  onResign={resignGame}
                  onOfferDraw={offerDraw}
                  onAcceptDraw={acceptDraw}
                  onDeclineDraw={declineDraw}
                  onFlipBoard={toggleBoardOrientation}
                />
              </div>

              {/* Sidebar Tabs (Moves vs Chat) */}
              <div className="bg-[#141b26] border border-[#232f41] rounded-2xl p-3 shadow-xl flex-1 flex flex-col">
                <div className="flex items-center gap-1.5 p-1 bg-[#17202d] rounded-xl mb-2.5 border border-[#232f41]">
                  <button
                    onClick={() => setActiveTab('moves')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'moves'
                        ? 'bg-amber-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Moves</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                      activeTab === 'chat'
                        ? 'bg-amber-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat</span>
                    {messages.length > 0 && activeTab !== 'chat' && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    )}
                  </button>
                </div>

                <div className="flex-1 min-h-[220px]">
                  {activeTab === 'moves' ? (
                    <MoveHistory history={history} fen={fen} />
                  ) : (
                    <ChatBox messages={messages} onSendMessage={sendChatMessage} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Pawn Promotion Dialog */}
      {pendingPromotion && (
        <PromotionDialog
          color={myColor}
          onSelect={completePromotion}
          onCancel={cancelPromotion}
        />
      )}

      {/* Game Over Modal */}
      {isGameOver && !dismissedGameOver && (
        <GameOverModal
          status={status}
          winner={winner}
          reason={statusReason}
          myColor={myColor}
          mode={mode}
          rematchOfferedBy={rematchOfferedBy}
          onRequestRematch={requestRematch}
          onAcceptRematch={acceptRematch}
          onReturnToLobby={handleLeaveRoom}
          onClose={() => setDismissedGameOver(true)}
        />
      )}

      {/* About Modal */}
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </div>
  );
}

export default App;
