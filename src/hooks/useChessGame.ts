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

interface UseChessGameProps {
  roomCode: string | null;
  mode: GameMode;
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
  const [myColor, setMyColor] = useState<PlayerColor>('white');
  const [isHost, setIsHost] = useState<boolean>(true);
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

  const premoveRef = useRef<Premove | null>(null);
  premoveRef.current = premove;

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

      // Online mode pre-move check: if it is NOT my turn, record as pre-move if enabled!
      if (mode === 'online') {
        if (isSpectator) return false;
        const piece = chessRef.current.get(sourceSquare);
        if (!piece || (piece.color === 'w' ? 'white' : 'black') !== myColorRef.current) {
          return false;
        }

        if (turn !== myColorRef.current) {
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
      const legalMoves = chessRef.current.moves({ square: sourceSquare, verbose: true });
      const isValid = legalMoves.some((m) => m.to === targetSquare);
      if (!isValid) return false;

      // Check for promotion
      if (isPromotionMove(sourceSquare, targetSquare)) {
        setPendingPromotion({ from: sourceSquare, to: targetSquare });
        return false;
      }

      return executeMove(sourceSquare, targetSquare, 'q', true);
    },
    [mode, isSpectator, turn, isPromotionMove, executeMove]
  );

  // Handle square click
  const onSquareClick = useCallback(
    (square: Square) => {
      if (statusRef.current !== 'active') return;

      // Pre-move handling when opponent's turn
      if (mode === 'online' && turn !== myColorRef.current) {
        if (!enablePremovesRef.current || isSpectator) return;

        // Cancel existing pre-move on empty square click
        if (premoveRef.current && square === premoveRef.current.to) {
          setPremove(null);
          return;
        }

        if (selectedSquare) {
          const piece = chessRef.current.get(square);
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
          const piece = chessRef.current.get(square);
          if (piece && (piece.color === 'w' ? 'white' : 'black') === myColorRef.current) {
            setSelectedSquare(square);
          }
          return;
        }
      }

      // Normal turn square click
      if (selectedSquare) {
        const clickedPiece = chessRef.current.get(square);
        const currentTurnColor = chessRef.current.turn();
        if (clickedPiece && clickedPiece.color === currentTurnColor) {
          if (square === selectedSquare) {
            setSelectedSquare(null);
            setPossibleMoves([]);
            return;
          }
          setSelectedSquare(square);
          const moves = chessRef.current.moves({ square, verbose: true });
          setPossibleMoves(moves.map((m) => m.to as Square));
          return;
        }

        const moves = chessRef.current.moves({ square: selectedSquare, verbose: true });
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

      const piece = chessRef.current.get(square);
      if (piece) {
        const pieceColor = piece.color === 'w' ? 'white' : 'black';
        if (mode === 'online' && pieceColor !== myColorRef.current) return;
        if (mode === 'local' && pieceColor !== turn) return;

        setSelectedSquare(square);
        const moves = chessRef.current.moves({ square, verbose: true });
        setPossibleMoves(moves.map((m) => m.to as Square));
      }
    },
    [mode, turn, isSpectator, selectedSquare, isPromotionMove, executeMove]
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
    if (statusRef.current !== 'active') return;
    const resigningColor = mode === 'online' ? myColorRef.current : turn;
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
  }, [mode, turn]);

  const offerDraw = useCallback(() => {
    if (statusRef.current !== 'active') return;
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
    (swapColors: boolean = true) => {
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
      setWhiteTime(timeControlRef.current);
      setBlackTime(timeControlRef.current);

      if (swapColors && mode === 'online') {
        const newColor = myColorRef.current === 'white' ? 'black' : 'white';
        setMyColor(newColor);
        setBoardOrientation(newColor);
      }

      soundManager.playGameStart();
    },
    [mode]
  );

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
    if (initialColorPreference === 'black') {
      initialColor = 'black';
    } else if (initialColorPreference === 'random') {
      initialColor = Math.random() < 0.5 ? 'white' : 'black';
    }
    setMyColor(initialColor);
    setBoardOrientation(initialColor);

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
      const { from, to, promotion, whiteTime: wT, blackTime: bT } = event.payload;
      try {
        const chess = chessRef.current;
        const moveRes = chess.move({ from, to, promotion: promotion || 'q' });
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

          setLastMove({ from, to });
          setSelectedSquare(null);
          setPossibleMoves([]);
          refreshGameState();

          if (typeof wT === 'number') setWhiteTime(wT);
          if (typeof bT === 'number') setBlackTime(bT);

          // Trigger queued pre-move if available!
          setTimeout(() => {
            tryExecutePremove();
          }, 60);
        }
      } catch (err) {
        console.error('Failed to apply opponent move:', err);
      }
    });

    // 2. Chat listener
    channel.on('broadcast', { event: 'chat' }, (event) => {
      const msg: ChatMessage = event.payload;
      setMessages((prev) => [...prev, msg]);
    });

    // 3. Resign listener
    channel.on('broadcast', { event: 'resign' }, (event) => {
      const { resignedBy } = event.payload;
      const winningColor = resignedBy === 'white' ? 'black' : 'white';
      setStatus('resigned');
      setWinner(winningColor);
      setStatusReason(`${resignedBy === 'white' ? 'White' : 'Black'} resigned`);
      soundManager.playGameOver(winningColor === myColorRef.current);
    });

    // 4. Draw listeners
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

    // 5. Rematch listeners
    channel.on('broadcast', { event: 'rematch_offer' }, (event) => {
      setRematchOfferedBy(event.payload.offeredBy);
    });

    channel.on('broadcast', { event: 'rematch_accept' }, (event) => {
      const newTc = event.payload.timeControl || timeControlRef.current;
      setTimeControl(newTc);
      resetGame(true);
    });

    // 6. State Sync
    channel.on('broadcast', { event: 'sync_request' }, () => {
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
        if (syncTc) setTimeControl(syncTc);
        if (typeof sWt === 'number') setWhiteTime(sWt);
        if (typeof sBt === 'number') setBlackTime(sBt);
        if (syncHist) setHistory(syncHist);
        if (typeof syncPremoves === 'boolean') setEnablePremoves(syncPremoves);

        if (hostColor) {
          const oppColor: PlayerColor = hostColor === 'white' ? 'black' : 'white';
          setMyColor(oppColor);
          setBoardOrientation(oppColor);
        }
      } catch (err) {
        console.error('Failed to sync state:', err);
      }
    });

    // 7. Presence Tracking
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<RoomPresence>();
      const allPresences: RoomPresence[] = [];
      for (const key in state) {
        if (state[key] && state[key].length > 0) {
          allPresences.push(state[key][0]);
        }
      }

      const others = allPresences.filter((p) => p.playerId !== myPlayerId);
      const spectators = others.filter((p) => p.role === 'spectator');
      setSpectatorCount(spectators.length);

      const whitePlayer = allPresences.find((p) => p.role === 'white');
      const blackPlayer = allPresences.find((p) => p.role === 'black');
      if (
        whitePlayer &&
        blackPlayer &&
        whitePlayer.playerId !== myPlayerId &&
        blackPlayer.playerId !== myPlayerId
      ) {
        setIsSpectator(true);
      } else {
        setIsSpectator(false);
      }

      if (others.length === 0) {
        setIsHost(true);
      } else {
        setIsHost(false);
      }

      const activeOpponent = others.find((p) => p.role === 'white' || p.role === 'black');
      if (activeOpponent) {
        setOpponent({
          id: activeOpponent.playerId,
          name: activeOpponent.name,
          color: activeOpponent.role as PlayerColor,
          isHost: false,
          connected: true,
        });

        setStatus((curStatus) => {
          if (curStatus === 'waiting') {
            soundManager.playGameStart();
            return 'active';
          }
          return curStatus;
        });
      } else {
        setOpponent(null);
      }
    });

    channel.subscribe(async (subStatus) => {
      if (subStatus === 'SUBSCRIBED') {
        await channel.track({
          playerId: myPlayerId,
          name: myPlayerNameRef.current,
          role: initialColor,
          joinedAt: Date.now(),
        });

        channel.send({
          type: 'broadcast',
          event: 'sync_request',
          payload: { requesterId: myPlayerId },
        });
      }
    });

    return () => {
      channel.unsubscribe();
    };
    // ONLY depend on roomCode and mode! NO recreation on state changes!
  }, [roomCode, mode, myPlayerId, initialColorPreference, refreshGameState, tryExecutePremove, resetGame]);

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
