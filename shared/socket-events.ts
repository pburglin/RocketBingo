// shared/socket-events.ts

export interface Room {
  id: string;
  hostId: string;
  players: Player[];
  gameState: 'waiting' | 'started' | 'finished';
  createdAt: Date;
}

export interface Player {
  id: string;
  name: string;
  socketId: string;
  joinedAt: Date;
}

// Socket event types for client-server communication
export interface SocketEvents {
  // Client to Server events
  'create_room': (data: { playerName: string }) => void;
  'join_room': (data: { roomId: string; playerName: string }) => void;
  'start_game': (data: { roomId: string }) => void;
  'mark_cell': (data: { roomId: string; cellIndex: number }) => void;
  'call_bingo': (data: { roomId: string }) => void;

  // Server to Client events
  'room_created': (data: { roomId: string; room: Room }) => void;
  'room_joined': (data: { room: Room; success: boolean; message?: string }) => void;
  'game_started': (data: { room: Room }) => void;
  'player_joined': (data: { room: Room }) => void;
  'game_state_update': (data: { room: Room }) => void;
  'bingo_called': (data: { roomId: string; playerId: string; winningCells: number[] }) => void;
  'error': (data: { message: string }) => void;
}

// Room ID generator utility
export const generateRoomId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Room validation utility
export const validateRoomId = (roomId: string): boolean => {
  return /^[A-Z0-9]{6}$/.test(roomId);
};