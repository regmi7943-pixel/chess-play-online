export type PlayerColor = 'white' | 'black';

export type GameMode = 'online' | 'local';

export type GameStatus =
  | 'waiting'      // Waiting for opponent to join
  | 'active'       // Game in progress
  | 'checkmate'    // Won by checkmate
  | 'draw'         // Drawn by agreement, stalemate, 3-fold, 50-move, or insufficient material
  | 'resigned'     // Won by resignation
  | 'timeout';     // Won by time expiration

export interface PlayerInfo {
  id: string;
  name: string;
  color: PlayerColor;
  isHost: boolean;
  connected: boolean;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderColor?: PlayerColor;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface CapturedPieces {
  p: number; // pawns
  n: number; // knights
  b: number; // bishops
  r: number; // rooks
  q: number; // queens
}

export interface MoveRecord {
  san: string;
  from: string;
  to: string;
  piece: string;
  captured?: string;
  color: 'w' | 'b';
  fen: string;
  whiteTime?: number;
  blackTime?: number;
}

export interface RoomPresence {
  playerId: string;
  name: string;
  role: 'white' | 'black' | 'spectator';
  joinedAt: number;
}
