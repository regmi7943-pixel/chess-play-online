import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 20,
    },
  },
});

// Helper to generate or get a persistent anonymous player identity (No login required)
export function getOrCreatePlayerSession(): { id: string; defaultName: string } {
  let playerId = localStorage.getItem('chess_player_id');
  if (!playerId) {
    playerId = 'player_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36).slice(-4);
    localStorage.setItem('chess_player_id', playerId);
  }

  let playerName = localStorage.getItem('chess_player_name');
  if (!playerName) {
    const titles = ['Grandmaster', 'Master', 'Tactician', 'Knight', 'Bishop', 'Rook', 'Pawn'];
    const creatures = ['Fox', 'Eagle', 'Falcon', 'Wolf', 'Panther', 'Lion', 'Bear'];
    const randomName = `${titles[Math.floor(Math.random() * titles.length)]} ${creatures[Math.floor(Math.random() * creatures.length)]}`;
    playerName = randomName;
    localStorage.setItem('chess_player_name', playerName);
  }

  return { id: playerId, defaultName: playerName };
}
