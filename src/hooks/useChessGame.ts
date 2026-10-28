import { useState, useEffect, useRef, useCallback } from 'react';
import { Chess, type Square } from 'chess.js';
import { supabase, getOrCreatePlayerSession } from '../lib/supabase';
import { soundManager } from '../lib/sounds';
import confetti from 'canvas-confetti';
import type {
  PlayerColor,
  GameMode,
  GameStatus,
  PlayerInfo,
  ChatMessage,
  CapturedPieces,
  MoveRecord,
  RoomPresence,
} from '../lib/types';

const logSync = (msg: string, data?: unknown) => {
  const now = new Date();
  const timeStr = `${now.toTimeString().slice(0, 8)}.${now.getMilliseconds().toString().padStart(3, '0')}`;
  const prefix = `[ChessSync ${timeStr}]`;
  if (data !== undefined) {
    console.log(`%c${prefix} %c${msg}`, 'color: #38bdf8; font-weight: bold;', 'color: #e2e8f0;', data);
  } else {
    console.log(`%c${prefix} %c${msg}`, 'color: #38bdf8; font-weight: bold;', 'color: #e2e8f0;');
  }
};

interface UseChessGameProps {
  roomCode: string | null;
  mode: GameMode;
  isHost?: boolean;
  initialTimeControl?: number;
  initialColorPreference?: 'white' | 'black' | 'random';
  initialEnablePremoves?: boolean;
}

export interface Premove {
  from: Square;
  to: Square;
  promotion?: string;
}

export function useChessGame({
  roomCode,
  mode,
  isHost: initialIsHost = true,
  initialTimeControl = 600,
  initialColorPreference = 'white',
  initialEnablePremoves = true,
}: UseChessGameProps) {
  const chessRef = useRef<Chess>(new Chess());
  const [fen, setFen] = useState<string>(chessRef.current.fen());
  const [turn, setTurn] = useState<PlayerColor>('white');
  const [status, setStatus] = useState<GameStatus>('waiting');
  const [winner, setWinner] = useState<PlayerColor | 'draw' | null>(null);
  const [statusReason, setStatusReason] = useState<string>('');

  // Players info
  const session = useRef(getOrCreatePlayerSession());
  const [myPlayerId] = useState<string>(session.current.id);
  const [myPlayerName, setMyPlayerName] = useState<string>(session.current.defaultName);
  const [myColor, setMyColor] = useState<PlayerColor>(initialIsHost ? 'white' : 'black');
  const [isHost, setIsHost] = useState<boolean>(initialIsHost);
  const [isSpectator, setIsSpectator] = useState<boolean>(false);
  const [opponent, setOpponent] = useState<PlayerInfo | null>(null);
  const [spectatorCount, setSpectatorCount] = useState<number>(0);

  // Time controls
  const [timeControl, setTimeControl] = useState<number>(initialTimeControl);
  const [whiteTime, setWhiteTime] = useState<number>(initialTimeControl);
  const [blackTime, setBlackTime] = useState<number>(initialTimeControl);

  // Pre-move feature
  const [enablePremoves, setEnablePremoves] = useState<boolean>(initialEnablePremoves);
  const [premove, setPremove] = useState<Premove | null>(null);

  // Move history
  const [history, setHistory] = useState<MoveRecord[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  // Square selection and legal move highlights
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);

  // Promotion
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Draw & Rematch states
  const [drawOfferedBy, setDrawOfferedBy] = useState<PlayerColor | null>(null);
  const [rematchOfferedBy, setRematchOfferedBy] = useState<PlayerColor | null>(null);

  // Board Orientation
  const [boardOrientation, setBoardOrientation] = useState<PlayerColor>('white');

  // Channel & Timers
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const timerIntervalRef = useRef<number | null>(null);

  // REFS for stable access in WebSocket callbacks (eliminates re-subscription flicker!)
  const myColorRef = useRef<PlayerColor>('white');
  myColorRef.current = myColor;

  const isHostRef = useRef<boolean>(initialIsHost);
  isHostRef.current = isHost;

  useEffect(() => {
    setIsHost(initialIsHost);
    isHostRef.current = initialIsHost;
  }, [initialIsHost]);

  const myPlayerNameRef = useRef<string>(myPlayerName);
  myPlayerNameRef.current = myPlayerName;

  const statusRef = useRef<GameStatus>(status);
  statusRef.current = status;

  const timeControlRef = useRef<number>(timeControl);
  timeControlRef.current = timeControl;

  const whiteTimeRef = useRef<number>(whiteTime);
  whiteTimeRef.current = whiteTime;

  const blackTimeRef = useRef<number>(blackTime);
  blackTimeRef.current = blackTime;

  const historyRef = useRef<MoveRecord[]>(history);
  historyRef.current = history;

  const enablePremovesRef = useRef<boolean>(enablePremoves);
  enablePremovesRef.current = enablePremoves;

  const isSpectatorRef = useRef<boolean>(isSpectator);
  isSpectatorRef.current = isSpectator;

  useEffect(() => {
    isSpectatorRef.current = isSpectator;
  }, [isSpectator]);

  useEffect(() => {
    setTimeControl(initialTimeControl);
    timeControlRef.current = initialTimeControl;
    setWhiteTime(initialTimeControl);
    whiteTimeRef.current = initialTimeControl;
    setBlackTime(initialTimeControl);
    blackTimeRef.current = initialTimeControl;
  }, [initialTimeControl]);

  useEffect(() => {
    setEnablePremoves(initialEnablePremoves);
    enablePremovesRef.current = initialEnablePremoves;
  }, [initialEnablePremoves]);

  const premoveRef = useRef<Premove | null>(null);
  premoveRef.current = premove;

  const tryExecutePremoveRef = useRef<() => void>(() => {});
  const refreshGameStateRef = useRef<() => void>(() => {});
  const resetGameRef = useRef<(swap?: boolean, tcOverride?: number) => void>(() => {});

  // Calculate captured pieces
  const getCapturedPieces = useCallback((): { white: CapturedPieces; black: CapturedPieces; scoreDiff: number } => {
    const startingCounts: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const currentCountsWhite: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };
    const currentCountsBlack: Record<string, number> = { p: 0, n: 0, b: 0, r: 0, q: 0 };

    const board = chessRef.current.board();
    for (const row of board) {
      for (const piece of row) {
        if (piece) {
          if (piece.color === 'w') {
            currentCountsWhite[piece.type] = (currentCountsWhite[piece.type] || 0) + 1;
          } else {
            currentCountsBlack[piece.type] = (currentCountsBlack[piece.type] || 0) + 1;
          }
        }
      }
    }

    const capturedByWhite: CapturedPieces = {
      p: Math.max(0, startingCounts.p - currentCountsBlack.p),
      n: Math.max(0, startingCounts.n - currentCountsBlack.n),
      b: Math.max(0, startingCounts.b - currentCountsBlack.b),
      r: Math.max(0, startingCounts.r - currentCountsBlack.r),
      q: Math.max(0, startingCounts.q - currentCountsBlack.q),
    };

    const capturedByBlack: CapturedPieces = {
      p: Math.max(0, startingCounts.p - currentCountsWhite.p),
      n: Math.max(0, startingCounts.n - currentCountsWhite.n),
      b: Math.max(0, startingCounts.b - currentCountsWhite.b),
      r: Math.max(0, startingCounts.r - currentCountsWhite.r),
      q: Math.max(0, startingCounts.q - currentCountsWhite.q),
    };

    const values = { p: 1, n: 3, b: 3, r: 5, q: 9 };
    const whitePoints =
      capturedByWhite.p * values.p +
      capturedByWhite.n * values.n +
      capturedByWhite.b * values.b +
      capturedByWhite.r * values.r +
      capturedByWhite.q * values.q;

    const blackPoints =
      capturedByBlack.p * values.p +
      capturedByBlack.n * values.n +
      capturedByBlack.b * values.b +
      capturedByBlack.r * values.r +
      capturedByBlack.q * values.q;

    return {
      white: capturedByWhite,
      black: capturedByBlack,
      scoreDiff: whitePoints - blackPoints,
    };
  }, []);

  // Update game state from chess.js
  const refreshGameState = useCallback(() => {
    const chess = chessRef.current;
    const currentFen = chess.fen();
    setFen(currentFen);
    const currentTurn = chess.turn() === 'w' ? 'white' : 'black';
    setTurn(currentTurn);

    if (chess.isGameOver()) {
      if (chess.isCheckmate()) {
        const winningColor = currentTurn === 'white' ? 'black' : 'white';
        setStatus('checkmate');
        setWinner(winningColor);
        setStatusReason(`Checkmate! ${winningColor === 'white' ? 'White' : 'Black'} wins.`);
        soundManager.playGameOver(winningColor === myColorRef.current);
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      } else if (chess.isDraw()) {
        setStatus('draw');
        setWinner('draw');
        if (chess.isStalemate()) {
          setStatusReason('Stalemate');
        } else if (chess.isThreefoldRepetition()) {
          setStatusReason('Threefold repetition');
        } else if (chess.isInsufficientMaterial()) {
          setStatusReason('Insufficient material');
        } else {
          setStatusReason('50-move rule');
        }
        soundManager.playGameOver(false);
      }
    }
  }, []);

  // Execute a verified move
  const executeMove = useCallback(
    (
      from: Square,
      to: Square,
      promotion: string = 'q',
      broadcast: boolean = true
    ): boolean => {
      try {
        const chess = chessRef.current;
        const piece = chess.get(from);
        if (!piece) return false;

        const moveResult = chess.move({
          from,
          to,
          promotion,
        });

        if (!moveResult) return false;

        if (chess.isCheck()) {
          soundManager.playCheck();
        } else if (moveResult.captured) {
          soundManager.playCapture();
        } else {
          soundManager.playMove();
        }

        const newRecord: MoveRecord = {
          san: moveResult.san,
          from: moveResult.from,
          to: moveResult.to,
          piece: moveResult.piece,
          captured: moveResult.captured,
          color: moveResult.color,
          fen: chess.fen(),
        };

        setHistory((prev) => [...prev, newRecord]);
        setLastMove({ from, to });
        setSelectedSquare(null);
        setPossibleMoves([]);
        refreshGameState();

        if (broadcast && channelRef.current && mode === 'online') {
          const moveSendTs = Date.now();
          logSync(`[Move] Broadcasting move ${from}-${to} (SAN: ${moveResult.san})`);
          channelRef.current.send({
            type: 'broadcast',
            event: 'move',
            payload: {
              from,
              to,
              promotion,
              san: moveResult.san,
              fen: chess.fen(),
              turn: chess.turn() === 'w' ? 'white' : 'black',
              whiteTime: whiteTimeRef.current,
              blackTime: blackTimeRef.current,
              sentAt: moveSendTs,
            },
          });
        }

        return true;
      } catch (err) {
        console.error('Error executing move:', err);
        return false;
      }
    },
    [mode, refreshGameState]
  );

  // Check if a move requires promotion
  const isPromotionMove = useCallback((from: Square, to: Square): boolean => {
    const chess = chessRef.current;
    const piece = chess.get(from);
    if (!piece || piece.type !== 'p') return false;

    if (piece.color === 'w' && to.endsWith('8')) return true;
    if (piece.color === 'b' && to.endsWith('1')) return true;

    return false;
  }, []);

  // Try to execute queued pre-move when turn arrives
  const tryExecutePremove = useCallback(() => {
    const pm = premoveRef.current;
    if (!pm) return;

    const chess = chessRef.current;
    const currentTurn = chess.turn() === 'w' ? 'white' : 'black';
    if (currentTurn !== myColorRef.current) return;

    // Check if pre-move is legal in current position
    const moves = chess.moves({ square: pm.from, verbose: true });
    const isLegal = moves.some((m) => m.to === pm.to);

    if (isLegal) {
      executeMove(pm.from, pm.to, pm.promotion || 'q', true);
    }
    // Clear pre-move regardless
    setPremove(null);
  }, [executeMove]);

  // Handle piece drop
  const onPieceDrop = useCallback(
    (sourceSquare: Square, targetSquare: Square | null): boolean => {
      if (!targetSquare) return false;
      if (statusRef.current !== 'active') return false;

      const chess = chessRef.current;
      const currentEngineTurn = chess.turn() === 'w' ? 'white' : 'black';

      // Online mode pre-move check: if it is NOT my turn, record as pre-move if enabled!
      if (mode === 'online') {
        if (isSpectatorRef.current) return false;
        const piece = chess.get(sourceSquare);
        if (!piece || (piece.color === 'w' ? 'white' : 'black') !== myColorRef.current) {
          return false;
        }

        if (currentEngineTurn !== myColorRef.current) {
          if (enablePremovesRef.current) {
            // Register pre-move
            setPremove({
              from: sourceSquare,
              to: targetSquare,
              promotion: isPromotionMove(sourceSquare, targetSquare) ? 'q' : undefined,
            });
            setSelectedSquare(null);
            setPossibleMoves([]);
            return false;
          }
          return false;
        }
      }

      // Check if move is legal
      const legalMoves = chess.moves({ square: sourceSquare, verbose: true });
      const isValid = legalMoves.some((m) => m.to === targetSquare);
      if (!isValid) return false;

      // Check for promotion
      if (isPromotionMove(sourceSquare, targetSquare)) {
        setPendingPromotion({ from: sourceSquare, to: targetSquare });
        return false;
      }

      return executeMove(sourceSquare, targetSquare, 'q', true);
    },
    [mode, isPromotionMove, executeMove]
  );

  // Handle square click
  const onSquareClick = useCallback(
    (square: Square) => {
      if (statusRef.current !== 'active') return;

      const chess = chessRef.current;
      const currentEngineTurn = chess.turn() === 'w' ? 'white' : 'black';

      // Pre-move handling when opponent's turn in online mode
      if (mode === 'online' && currentEngineTurn !== myColorRef.current) {
        if (!enablePremovesRef.current || isSpectatorRef.current) return;

        // Cancel existing pre-move on empty square click
        if (premoveRef.current && square === premoveRef.current.to) {
          setPremove(null);
          return;
        }

        if (selectedSquare) {
          const piece = chess.get(square);
          if (piece && (piece.color === 'w' ? 'white' : 'black') === myColorRef.current) {
            setSelectedSquare(square);
            return;
          }
          // Set pre-move
          setPremove({
            from: selectedSquare,
            to: square,
            promotion: isPromotionMove(selectedSquare, square) ? 'q' : undefined,
          });
          setSelectedSquare(null);
          setPossibleMoves([]);
          return;
        } else {
          const piece = chess.get(square);
          if (piece && (piece.color === 'w' ? 'white' : 'black') === myColorRef.current) {
            setSelectedSquare(square);
          }
          return;
        }
      }

      // Normal turn square click
      if (selectedSquare) {
        const clickedPiece = chess.get(square);
        const currentTurnColor = chess.turn();
        if (clickedPiece && clickedPiece.color === currentTurnColor) {
          if (square === selectedSquare) {
            setSelectedSquare(null);
            setPossibleMoves([]);
            return;
          }
          setSelectedSquare(square);
          const moves = chess.moves({ square, verbose: true });
          setPossibleMoves(moves.map((m) => m.to as Square));
          return;
        }

        const moves = chess.moves({ square: selectedSquare, verbose: true });
        const validMove = moves.find((m) => m.to === square);

        if (validMove) {
          if (isPromotionMove(selectedSquare, square)) {
            setPendingPromotion({ from: selectedSquare, to: square });
            setSelectedSquare(null);
            setPossibleMoves([]);
            return;
          }

          executeMove(selectedSquare, square, 'q', true);
          setSelectedSquare(null);
          setPossibleMoves([]);
          return;
        } else {
          setSelectedSquare(null);
          setPossibleMoves([]);
          return;
        }
      }

      const piece = chess.get(square);
      if (piece) {
        const pieceColor = piece.color === 'w' ? 'white' : 'black';
        if (mode === 'online' && pieceColor !== myColorRef.current) return;
        if (mode === 'local' && pieceColor !== currentEngineTurn) return;

        setSelectedSquare(square);
        const moves = chess.moves({ square, verbose: true });
        setPossibleMoves(moves.map((m) => m.to as Square));
      }
    },
    [mode, selectedSquare, isPromotionMove, executeMove]
  );

  const completePromotion = useCallback(
    (promotionPiece: 'q' | 'r' | 'b' | 'n') => {
      if (!pendingPromotion) return;
      executeMove(pendingPromotion.from, pendingPromotion.to, promotionPiece, true);
      setPendingPromotion(null);
    },
    [pendingPromotion, executeMove]
  );

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
    setSelectedSquare(null);
    setPossibleMoves([]);
  }, []);

  const clearPremove = useCallback(() => {
    setPremove(null);
  }, []);

  const sendChatMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const msg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        senderName: myPlayerNameRef.current,
        senderColor: myColorRef.current,
        text: text.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, msg]);

      if (channelRef.current && mode === 'online') {
        channelRef.current.send({
          type: 'broadcast',
          event: 'chat',
          payload: msg,
        });
      }
    },
    [mode]
  );

  const resignGame = useCallback(() => {
    if (statusRef.current !== 'active' || isSpectatorRef.current) return;
    const resigningColor = mode === 'online' ? myColorRef.current : (chessRef.current.turn() === 'w' ? 'white' : 'black');
    const opponentColor = resigningColor === 'white' ? 'black' : 'white';

    setStatus('resigned');
    setWinner(opponentColor);
    setStatusReason(`${resigningColor === 'white' ? 'White' : 'Black'} resigned`);
    soundManager.playGameOver(opponentColor === myColorRef.current);

    if (channelRef.current && mode === 'online') {
      channelRef.current.send({
        type: 'broadcast',
        event: 'resign',
        payload: { resignedBy: resigningColor },
      });
    }
  }, [mode]);

  const offerDraw = useCallback(() => {
    if (statusRef.current !== 'active' || isSpectatorRef.current) return;
    setDrawOfferedBy(myColorRef.current);

    if (channelRef.current && mode === 'online') {
      channelRef.current.send({
        type: 'broadcast',
        event: 'draw_offer',
        payload: { offeredBy: myColorRef.current },
      });
    }
  }, [mode]);

  const acceptDraw = useCallback(() => {
    if (isSpectatorRef.current) return;
    setStatus('draw');
    setWinner('draw');
    setStatusReason('Draw agreed');
    setDrawOfferedBy(null);
    soundManager.playGameOver(false);

    if (channelRef.current && mode === 'online') {
      channelRef.current.send({
        type: 'broadcast',
        event: 'draw_accept',
        payload: {},
      });
    }
  }, [mode]);

  const declineDraw = useCallback(() => {
    if (isSpectatorRef.current) return;
    setDrawOfferedBy(null);

    if (channelRef.current && mode === 'online') {
      channelRef.current.send({
        type: 'broadcast',
        event: 'draw_decline',
        payload: {},
      });
    }
  }, [mode]);

  const resetGame = useCallback(
    (swapColors: boolean = true, tcOverride?: number) => {
      chessRef.current = new Chess();
      setFen(chessRef.current.fen());
      setTurn('white');
      setStatus('active');
      setWinner(null);
      setStatusReason('');
      setHistory([]);
      setLastMove(null);
      setSelectedSquare(null);
      setPossibleMoves([]);
      setPendingPromotion(null);
      setPremove(null);
      setDrawOfferedBy(null);
      setRematchOfferedBy(null);

      const tc = typeof tcOverride === 'number' ? tcOverride : timeControlRef.current;
      setTimeControl(tc);
      timeControlRef.current = tc;
      setWhiteTime(tc);
      whiteTimeRef.current = tc;
      setBlackTime(tc);
      blackTimeRef.current = tc;

      if (swapColors && mode === 'online') {
        const newColor = myColorRef.current === 'white' ? 'black' : 'white';
        setMyColor(newColor);
        myColorRef.current = newColor;
        setBoardOrientation(newColor);
        setOpponent((prev) => (prev ? { ...prev, color: newColor === 'white' ? 'black' : 'white' } : null));
      }

      soundManager.playGameStart();
    },
    [mode]
  );

  tryExecutePremoveRef.current = tryExecutePremove;
  refreshGameStateRef.current = refreshGameState;
  resetGameRef.current = resetGame;

  const acceptRematch = useCallback(() => {
    resetGame(true);

    if (channelRef.current && mode === 'online') {
      channelRef.current.send({
        type: 'broadcast',
        event: 'rematch_accept',
        payload: { timeControl: timeControlRef.current },
      });
    }
  }, [resetGame, mode]);

  const requestRematch = useCallback(() => {
    if (mode === 'local') {
      resetGame(false);
      return;
    }

    if (rematchOfferedBy && rematchOfferedBy !== myColorRef.current) {
      acceptRematch();
      return;
    }

    setRematchOfferedBy(myColorRef.current);

    if (channelRef.current && mode === 'online') {
      channelRef.current.send({
        type: 'broadcast',
        event: 'rematch_offer',
        payload: { offeredBy: myColorRef.current },
      });
    }
  }, [mode, rematchOfferedBy, acceptRematch, resetGame]);

  const leaveGame = useCallback(() => {
    chessRef.current = new Chess();
    setFen(chessRef.current.fen());
    setTurn('white');
    setStatus('waiting');
    setWinner(null);
    setStatusReason('');
    setHistory([]);
    setLastMove(null);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setPendingPromotion(null);
    setPremove(null);
    setDrawOfferedBy(null);
    setRematchOfferedBy(null);
    setOpponent(null);
    setSpectatorCount(0);
    setIsSpectator(false);
    setWhiteTime(timeControlRef.current);
    setBlackTime(timeControlRef.current);
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
  }, []);

  const toggleBoardOrientation = useCallback(() => {
    setBoardOrientation((prev) => (prev === 'white' ? 'black' : 'white'));
  }, []);

  const updatePlayerName = useCallback((newName: string) => {
    if (!newName.trim()) return;
    setMyPlayerName(newName.trim());
    localStorage.setItem('chess_player_name', newName.trim());
  }, []);

  // Timer interval effect
  useEffect(() => {
    if (status !== 'active' || timeControl === 0) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = window.setInterval(() => {
      if (turn === 'white') {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            setStatus('timeout');
            setWinner('black');
            setStatusReason('Time out! Black wins.');
            soundManager.playGameOver(myColorRef.current === 'black');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            setStatus('timeout');
            setWinner('white');
            setStatusReason('Time out! White wins.');
            soundManager.playGameOver(myColorRef.current === 'white');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [status, turn, timeControl]);

  // STABLE Supabase Channel Subscription (ONLY depends on roomCode & mode)
  useEffect(() => {
    if (mode !== 'online' || !roomCode) {
      if (mode === 'local') {
        setStatus('active');
        setMyColor('white');
        setBoardOrientation('white');
      }
      return;
    }

    // Determine initial color assignment
    let initialColor: PlayerColor = 'white';
    if (initialIsHost) {
      if (initialColorPreference === 'black') {
        initialColor = 'black';
      } else if (initialColorPreference === 'random') {
        initialColor = Math.random() < 0.5 ? 'white' : 'black';
      }
    } else {
      // Guest defaults to black until host's sub-50ms start_match confirms orientation
      initialColor = 'black';
    }
    setMyColor(initialColor);
    setBoardOrientation(initialColor);
    myColorRef.current = initialColor;

    const joinReqTime = performance.now();
    logSync(`[Channel] Connecting to room "${roomCode.toUpperCase()}" as ${initialIsHost ? 'HOST' : 'GUEST'} (assigned: ${initialColor})`);

    const channelName = `chess-room:${roomCode.toUpperCase()}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { ack: true, self: false },
        presence: { key: myPlayerId },
      },
    });

    channelRef.current = channel;

    // 1. Move broadcast listener
    channel.on('broadcast', { event: 'move' }, (event) => {
      const { from, to, promotion, whiteTime: wT, blackTime: bT, sentAt, san, fen: syncFen } = event.payload;
      const transitMs = sentAt ? Date.now() - sentAt : undefined;
      logSync(`[Move] Received opponent move ${from}-${to} (${san || '?'}) ${transitMs !== undefined ? `[latency: ${transitMs}ms]` : ''}`);
      try {
        const chess = chessRef.current;
        let moveRes = null;
        try {
          moveRes = chess.move({ from, to, promotion: promotion || 'q' });
        } catch (mErr) {
          console.warn('chess.move threw, attempting recovery via FEN:', mErr);
        }

        if (!moveRes && syncFen) {
          chess.load(syncFen);
        }

        if (moveRes) {
          if (chess.isCheck()) {
            soundManager.playCheck();
          } else if (moveRes.captured) {
            soundManager.playCapture();
          } else {
            soundManager.playMove();
          }

          setHistory((prev) => [
            ...prev,
            {
              san: moveRes.san,
              from: moveRes.from,
              to: moveRes.to,
              piece: moveRes.piece,
              captured: moveRes.captured,
              color: moveRes.color,
              fen: chess.fen(),
            },
          ]);
        } else if (syncFen) {
          soundManager.playMove();
        }

        setLastMove({ from, to });
        setSelectedSquare(null);
        setPossibleMoves([]);
        refreshGameStateRef.current();

        if (typeof wT === 'number') {
          setWhiteTime(wT);
          whiteTimeRef.current = wT;
        }
        if (typeof bT === 'number') {
          setBlackTime(bT);
          blackTimeRef.current = bT;
        }

        // Trigger queued pre-move if available!
        setTimeout(() => {
          tryExecutePremoveRef.current();
        }, 50);
      } catch (err) {
        console.error('Failed to apply opponent move:', err);
      }
    });

    // 2. Chat listener
    channel.on('broadcast', { event: 'chat' }, (event) => {
      const msg: ChatMessage = event.payload;
      setMessages((prev) => [...prev, msg]);
    });

    // 3. Instant Handshake - Host receives 'guest_joined'
    channel.on('broadcast', { event: 'guest_joined' }, (event) => {
      const payload = event.payload;
      const transitMs = payload.sentAt ? Date.now() - payload.sentAt : undefined;
      logSync(`[Handshake] Host received 'guest_joined' from "${payload.guestName}" (${payload.guestId}) ${transitMs !== undefined ? `[transit: ${transitMs}ms]` : ''}`);

      if (!isHostRef.current) return;

      const hostCol = myColorRef.current;
      const guestCol: PlayerColor = hostCol === 'white' ? 'black' : 'white';

      setOpponent({
        id: payload.guestId,
        name: payload.guestName,
        color: guestCol,
        isHost: false,
        connected: true,
      });

      setStatus((cur) => {
        if (cur === 'waiting') {
          soundManager.playGameStart();
          return 'active';
        }
        return cur;
      });

      logSync(`[Handshake] Host broadcasting 'start_match' (hostColor: ${hostCol}, guestColor: ${guestCol})`);
      channel.send({
        type: 'broadcast',
        event: 'start_match',
        payload: {
          hostId: myPlayerId,
          hostName: myPlayerNameRef.current,
          hostColor: hostCol,
          guestColor: guestCol,
          fen: chessRef.current.fen(),
          timeControl: timeControlRef.current,
          whiteTime: whiteTimeRef.current,
          blackTime: blackTimeRef.current,
          enablePremoves: enablePremovesRef.current,
          history: historyRef.current,
          sentAt: Date.now(),
        },
      });
    });

    // 4. Instant Handshake - Guest receives 'start_match'
    channel.on('broadcast', { event: 'start_match' }, (event) => {
      const payload = event.payload;
      const transitMs = payload.sentAt ? Date.now() - payload.sentAt : undefined;
      const totalElapsed = Math.round(performance.now() - joinReqTime);
      logSync(`[Handshake] Guest received 'start_match' from host "${payload.hostName}" ${transitMs !== undefined ? `[transit: ${transitMs}ms]` : ''} [Total join-to-play latency: ${totalElapsed}ms]`);

      if (isHostRef.current) return;

      const myAssignedColor: PlayerColor = payload.guestColor;
      setMyColor(myAssignedColor);
      setBoardOrientation(myAssignedColor);
      myColorRef.current = myAssignedColor;

      setOpponent({
        id: payload.hostId,
        name: payload.hostName,
        color: payload.hostColor,
        isHost: true,
        connected: true,
      });

      if (payload.fen) {
        chessRef.current.load(payload.fen);
        setFen(payload.fen);
        setTurn(chessRef.current.turn() === 'w' ? 'white' : 'black');
      }
      if (typeof payload.timeControl === 'number') {
        setTimeControl(payload.timeControl);
        timeControlRef.current = payload.timeControl;
      }
      if (typeof payload.whiteTime === 'number') setWhiteTime(payload.whiteTime);
      if (typeof payload.blackTime === 'number') setBlackTime(payload.blackTime);
      if (typeof payload.enablePremoves === 'boolean') setEnablePremoves(payload.enablePremoves);
      if (payload.history) setHistory(payload.history);

      setStatus('active');
      soundManager.playGameStart();
      logSync(`[Match Active] Playable right away! Orientation: ${myAssignedColor}, Turn: ${chessRef.current.turn() === 'w' ? 'white' : 'black'}`);
    });

    // 5. Host Ready signal (if guest was already waiting in room)
    channel.on('broadcast', { event: 'host_ready' }, (event) => {
      logSync(`[Handshake] Guest received 'host_ready' from host "${event.payload?.hostName}". Responding with 'guest_joined'...`);
      if (!isHostRef.current) {
        channel.send({
          type: 'broadcast',
          event: 'guest_joined',
          payload: {
            guestId: myPlayerId,
            guestName: myPlayerNameRef.current,
            sentAt: Date.now(),
          },
        });
      }
    });

    // 6. Resign listener
    channel.on('broadcast', { event: 'resign' }, (event) => {
      const { resignedBy } = event.payload;
      const winningColor = resignedBy === 'white' ? 'black' : 'white';
      setStatus('resigned');
      setWinner(winningColor);
      setStatusReason(`${resignedBy === 'white' ? 'White' : 'Black'} resigned`);
      soundManager.playGameOver(winningColor === myColorRef.current);
    });

    // 7. Draw listeners
    channel.on('broadcast', { event: 'draw_offer' }, (event) => {
      setDrawOfferedBy(event.payload.offeredBy);
    });

    channel.on('broadcast', { event: 'draw_accept' }, () => {
      setStatus('draw');
      setWinner('draw');
      setStatusReason('Draw agreed');
      setDrawOfferedBy(null);
      soundManager.playGameOver(false);
    });

    channel.on('broadcast', { event: 'draw_decline' }, () => {
      setDrawOfferedBy(null);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          senderName: 'System',
          text: 'Draw declined',
          timestamp: Date.now(),
          isSystem: true,
        },
      ]);
    });

    // 8. Rematch listeners
    channel.on('broadcast', { event: 'rematch_offer' }, (event) => {
      setRematchOfferedBy(event.payload.offeredBy);
    });

    channel.on('broadcast', { event: 'rematch_accept' }, (event) => {
      const newTc = typeof event.payload?.timeControl === 'number' ? event.payload.timeControl : timeControlRef.current;
      resetGameRef.current(true, newTc);
    });

    // 9. State Sync (spectator or refresh fallback)
    channel.on('broadcast', { event: 'sync_request' }, () => {
      logSync(`[Sync] Received 'sync_request', broadcasting current match state`);
      channel.send({
        type: 'broadcast',
        event: 'sync_state',
        payload: {
          fen: chessRef.current.fen(),
          status: statusRef.current,
          timeControl: timeControlRef.current,
          whiteTime: whiteTimeRef.current,
          blackTime: blackTimeRef.current,
          history: historyRef.current,
          hostColor: myColorRef.current,
          enablePremoves: enablePremovesRef.current,
        },
      });
    });

    channel.on('broadcast', { event: 'sync_state' }, (event) => {
      const {
        fen: syncFen,
        status: syncStatus,
        timeControl: syncTc,
        whiteTime: sWt,
        blackTime: sBt,
        history: syncHist,
        hostColor,
        enablePremoves: syncPremoves,
      } = event.payload;

      try {
        chessRef.current.load(syncFen);
        setFen(syncFen);
        setTurn(chessRef.current.turn() === 'w' ? 'white' : 'black');
        if (syncStatus) setStatus(syncStatus);
        if (typeof syncTc === 'number') {
          setTimeControl(syncTc);
          timeControlRef.current = syncTc;
        }
        if (typeof sWt === 'number') {
          setWhiteTime(sWt);
          whiteTimeRef.current = sWt;
        }
        if (typeof sBt === 'number') {
          setBlackTime(sBt);
          blackTimeRef.current = sBt;
        }
        if (syncHist) setHistory(syncHist);
        if (typeof syncPremoves === 'boolean') {
          setEnablePremoves(syncPremoves);
          enablePremovesRef.current = syncPremoves;
        }

        if (hostColor && !isHostRef.current) {
          const oppColor: PlayerColor = hostColor === 'white' ? 'black' : 'white';
          setMyColor(oppColor);
          myColorRef.current = oppColor;
          setBoardOrientation(oppColor);
        }
      } catch (err) {
        console.error('Failed to sync state:', err);
      }
    });

    // 10. Presence Tracking (background & spectators)
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<RoomPresence>();
      const allPresences: RoomPresence[] = [];
      for (const key in state) {
        if (state[key] && state[key].length > 0) {
          allPresences.push(state[key][0]);
        }
      }
      logSync(`[Presence] Sync update. Connected clients: ${allPresences.length}`);

      const others = allPresences.filter((p) => p.playerId !== myPlayerId);
      const spectators = others.filter((p) => p.role === 'spectator');
      setSpectatorCount(spectators.length);

      if (others.length >= 2 && !isHostRef.current) {
        setIsSpectator(true);
      }

      // Update opponent connection status
      setOpponent((prev) => {
        if (!prev) return null;
        const isStillPresent = others.some((p) => p.playerId === prev.id);
        return { ...prev, connected: isStillPresent };
      });

      // Fallback only if handshake hasn't activated game yet
      if (statusRef.current === 'waiting' && others.length > 0) {
        const activeOpponent = others[0];
        logSync(`[Presence Fallback] Activating game via presence fallback for "${activeOpponent.name}"`);
        setOpponent({
          id: activeOpponent.playerId,
          name: activeOpponent.name,
          color: myColorRef.current === 'white' ? 'black' : 'white',
          isHost: !isHostRef.current,
          connected: true,
        });

        setStatus('active');
        soundManager.playGameStart();
      }
    });

    let fallbackPingTimer: number | null = null;

    channel.subscribe(async (subStatus) => {
      const subElapsed = Math.round(performance.now() - joinReqTime);
      logSync(`[Channel] Subscription status: ${subStatus} (took ${subElapsed}ms)`);

      if (subStatus === 'SUBSCRIBED') {
        const assignedRole = isSpectatorRef.current
          ? 'spectator'
          : (initialIsHost ? initialColor : (initialColor === 'white' ? 'black' : 'white'));

        await channel.track({
          playerId: myPlayerId,
          name: myPlayerNameRef.current,
          role: assignedRole,
          joinedAt: Date.now(),
        });

        if (initialIsHost) {
          logSync(`[Handshake] Host broadcasting 'host_ready'`);
          channel.send({
            type: 'broadcast',
            event: 'host_ready',
            payload: { hostId: myPlayerId, hostName: myPlayerNameRef.current, sentAt: Date.now() },
          });
        } else {
          logSync(`[Handshake] Guest broadcasting 'guest_joined' immediately upon SUBSCRIBED`);
          channel.send({
            type: 'broadcast',
            event: 'guest_joined',
            payload: {
              guestId: myPlayerId,
              guestName: myPlayerNameRef.current,
              sentAt: Date.now(),
            },
          });

          // Fallback retry after 1.2s if host was still connecting
          fallbackPingTimer = window.setTimeout(() => {
            if (statusRef.current === 'waiting') {
              logSync(`[Handshake] Retrying 'guest_joined' ping (1.2s fallback)`);
              channel.send({
                type: 'broadcast',
                event: 'guest_joined',
                payload: {
                  guestId: myPlayerId,
                  guestName: myPlayerNameRef.current,
                  sentAt: Date.now(),
                },
              });
            }
          }, 1200);
        }
      }
    });

    return () => {
      if (fallbackPingTimer) clearTimeout(fallbackPingTimer);
      channel.unsubscribe();
    };
  }, [roomCode, mode, myPlayerId, initialIsHost, initialColorPreference]);

  return {
    fen,
    turn,
    status,
    winner,
    statusReason,
    myPlayerId,
    myPlayerName,
    myColor,
    isHost,
    isSpectator,
    opponent,
    spectatorCount,
    timeControl,
    whiteTime,
    blackTime,
    enablePremoves,
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
    captured: getCapturedPieces(),
    isCheck: chessRef.current.isCheck(),
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
    resetGame,
    leaveGame,
  };
}
