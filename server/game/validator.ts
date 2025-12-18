// server/game/validator.ts
import { BingoBoard, WinResult } from '../../shared/types';

// Pre-calculated winning patterns (indices for a 5x5 grid)
const WIN_PATTERNS = [
  // Rows
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  // Columns
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  // Diagonals
  [0, 6, 12, 18, 24], // Top-left to bottom-right
  [4, 8, 12, 16, 20]  // Top-right to bottom-left
];

export const checkWinCondition = (board: BingoBoard): WinResult => {
  // We collect ALL winning lines (a user might have multiple bingos at once)
  let winningIndices: number[] = [];

  for (const pattern of WIN_PATTERNS) {
    // Check if every index in this pattern is marked on the board
    const isWin = pattern.every(index => board[index]?.marked);
    
    if (isWin) {
      winningIndices = [...winningIndices, ...pattern];
    }
  }

  // Remove duplicates from winningIndices for clean highlighting
  winningIndices = [...new Set(winningIndices)];

  return {
    hasBingo: winningIndices.length > 0,
    winningIndices
  };
};