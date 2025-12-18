// tests/gameLogic.test.ts
import { describe, it, expect } from 'vitest'; // or jest
import { generateBoard } from '../server/game/generator';
import { checkWinCondition } from '../server/game/validator';


describe('Bingo Core Logic', () => {
  
  // Create a pool of dummy items
  const mockItems = Array.from({ length: 30 }, (_, i) => `Item ${i}`);

  it('Generates a valid 5x5 board with a Free space', () => {
    const board = generateBoard(mockItems);
    
    expect(board.length).toBe(25);
    expect(board[12]?.isFree).toBe(true);
    expect(board[12]?.marked).toBe(true);
    expect(board[12]?.content).toBe("FREE");
    expect(board[0]?.isFree).toBe(false);
  });

  it('Detects a Row Win', () => {
    const board = generateBoard(mockItems);
    
    // Mark the first row (indices 0,1,2,3,4)
    [0, 1, 2, 3, 4].forEach(i => { if (board[i]) board[i].marked = true; });

    const result = checkWinCondition(board);
    expect(result.hasBingo).toBe(true);
    expect(result.winningIndices).toEqual(expect.arrayContaining([0, 1, 2, 3, 4]));
  });

  it('Detects a Diagonal Win including the Free space', () => {
    const board = generateBoard(mockItems);
    
    // Mark indices for diagonal: 0, 6, 12 (free), 18, 24
    // Note: 12 is already marked by generator, but we set it explicitly to be safe
    [0, 6, 18, 24].forEach(i => { if (board[i]) board[i].marked = true; });

    const result = checkWinCondition(board);
    expect(result.hasBingo).toBe(true);
    expect(result.winningIndices).toEqual(expect.arrayContaining([0, 6, 12, 18, 24]));
  });

  it('Returns false when no bingo exists', () => {
    const board = generateBoard(mockItems);
    // Only mark 4 items in a row
    [0, 1, 2, 3].forEach(i => { if (board[i]) board[i].marked = true; });

    const result = checkWinCondition(board);
    expect(result.hasBingo).toBe(false);
  });
});