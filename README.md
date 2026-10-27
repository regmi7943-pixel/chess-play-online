# Chess Play Online

A lightweight, real-time multiplayer chess web application built with WebSockets hosted on Supabase.

## Features

- **Real-Time Multiplayer over WebSockets**: Instant move synchronization, player presence, clock timers, and live room chat powered by Supabase Realtime Channels.
- **Zero Login Required**: Instant guest access with shareable 1-click room links or short room codes.
- **Strict Legal Moves**: 100% standard chess rules enforced by [jhlywa/chess.js](https://github.com/jhlywa/chess.js) (checks, checkmate, stalemate, castling, en passant, and pawn promotions).
- **Responsive Board UI**: Powered by [Clariity/react-chessboard](https://github.com/Clariity/react-chessboard) with drag-and-drop and tap-to-move support on desktop and mobile.
- **Pass & Play / Solo Mode**: Play locally on the same screen without connecting online.
- **Game Controls**: Resign, draw offers, board orientation flip, rematch requests, and PGN/FEN exports.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Chess Rules Engine**: [`chess.js`](https://github.com/jhlywa/chess.js)
- **Chessboard Component**: [`react-chessboard`](https://github.com/Clariity/react-chessboard)
- **Real-Time Backend**: Supabase Realtime WebSockets (`@supabase/supabase-js`)

## Getting Started

```bash
cd C:\Users\ADMIN\.gemini\antigravity\scratch\chess-play-online
npm install
npm run dev
```

Visit `http://localhost:5173` to play!
