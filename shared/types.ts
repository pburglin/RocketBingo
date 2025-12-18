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