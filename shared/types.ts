// shared/types.ts

export interface BingoCell {
  id: string;      // Unique ID for the cell
  content: string; // The text or number (e.g., "15" or "Synergy")
  marked: boolean; // Has the user selected this?
  isFree: boolean; // Is this the center "FREE" space?
}

// A board is a flat array of 25 cells (5x5)
export type BingoBoard = BingoCell[];

export type GameMode = 'CLASSIC' | 'BUSINESS';

export interface WinResult {
  hasBingo: boolean;
  winningIndices: number[]; // Which cells triggered the win (for highlighting)
}

// Socket Events Types (re-exported from socket-events.ts for convenience)
export interface Room {
  id: string;
  hostId: string;
  players: Player[];
  gameState: 'waiting' | 'started' | 'finished';
  gameMode: 'CLASSIC' | 'BUSINESS';
  createdAt: Date;
}

export interface Player {
  id: string;
  name: string;
  socketId: string;
  joinedAt: Date;
}

// Socket event interfaces for client-server communication
export interface CreateRoomData {
  playerName: string;
  gameMode?: 'CLASSIC' | 'BUSINESS';
}

export interface JoinRoomData {
  roomId: string;
  playerName: string;
}

export interface StartGameData {
  roomId: string;
}

export interface MarkCellData {
  roomId: string;
  cellIndex: number;
}

export interface CallBingoData {
  roomId: string;
  markedCells?: number[];
}

export interface RoomCreatedData {
  roomId: string;
  room: Room;
}

export interface RoomJoinedData {
  room: Room;
  success: boolean;
  message?: string;
}

export interface GameStartedData {
  room: Room;
}

export interface PlayerJoinedData {
  room: Room;
}

export interface GameStateUpdateData {
  room: Room;
}

export interface BingoCalledData {
  roomId: string;
  playerId: string;
  winningCells: number[];
}

export interface ErrorData {
  message: string;
}