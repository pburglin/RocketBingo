import { describe, it, expect, vi } from 'vitest';
import { generateBoard } from '../server/game/generator';
import { checkWinCondition } from '../server/game/validator';
import { BingoBoard } from '../shared/types';

// Mock the shuffle function to make tests deterministic
vi.mock('../server/game/generator', async () => {
  const actual = await vi.importActual('../server/game/generator');
  return {
    ...actual,
    generateBoard: vi.fn(),
  };
});

describe('Bingo Board Generator', () => {
  it('should generate a board with 25 cells', () => {
    const items = Array.from({ length: 24 }, (_, i) => `Item ${i + 1}`);
    const board = generateBoard(items);
    
    expect(board).toHaveLength(25);
  });

  it('should have exactly one FREE space in the center', () => {
    const items = Array.from({ length: 24 }, (_, i) => `Item ${i + 1}`);
    const board = generateBoard(items);
    
    const freeSpaces = board.filter(cell => cell.isFree);
    expect(freeSpaces).toHaveLength(1);
    const freeSpace = freeSpaces[0];
    expect(freeSpace?.content).toBe('FREE');
    expect(freeSpace?.marked).toBe(true);
    expect(freeSpace?.id).toBe('cell-12'); // Center position
  });

  it('should throw error when not enough items provided', () => {
    const items = Array.from({ length: 23 }, (_, i) => `Item ${i + 1}`);
    
    expect(() => generateBoard(items)).toThrow('Not enough items to generate a bingo board');
  });

  it('should have all non-free cells marked as false initially', () => {
    const items = Array.from({ length: 24 }, (_, i) => `Item ${i + 1}`);
    const board = generateBoard(items);
    
    const nonFreeCells = board.filter(cell => !cell.isFree);
    expect(nonFreeCells.every(cell => !cell.marked)).toBe(true);
  });
});

describe('Win Condition Validator', () => {
  it('should detect a horizontal win', () => {
    // Create a board where first row is marked
    const board: BingoBoard = Array.from({ length: 25 }, (_, i) => ({
      id: `cell-${i}`,
      content: `Item ${i}`,
      marked: i < 5, // First 5 cells marked
      isFree: false,
    }));

    const result = checkWinCondition(board);
    
    expect(result.hasBingo).toBe(true);
    expect(result.winningIndices).toEqual([0, 1, 2, 3, 4]);
  });

  it('should detect a vertical win', () => {
    // Create a board where first column is marked
    const board: BingoBoard = Array.from({ length: 25 }, (_, i) => ({
      id: `cell-${i}`,
      content: `Item ${i}`,
      marked: i % 5 === 0, // Every 5th cell marked (first column)
      isFree: false,
    }));

    const result = checkWinCondition(board);
    
    expect(result.hasBingo).toBe(true);
    expect(result.winningIndices).toEqual([0, 5, 10, 15, 20]);
  });

  it('should detect a diagonal win (top-left to bottom-right)', () => {
    // Create a board where diagonal is marked
    const board: BingoBoard = Array.from({ length: 25 }, (_, i) => ({
      id: `cell-${i}`,
      content: `Item ${i}`,
      marked: i % 6 === 0, // Diagonal from top-left
      isFree: false,
    }));

    const result = checkWinCondition(board);
    
    expect(result.hasBingo).toBe(true);
    expect(result.winningIndices).toEqual([0, 6, 12, 18, 24]);
  });

  it('should detect no win when no complete lines', () => {
    // Create a board with scattered marks
    const board: BingoBoard = Array.from({ length: 25 }, (_, i) => ({
      id: `cell-${i}`,
      content: `Item ${i}`,
      marked: i === 0 || i === 5 || i === 10, // Just scattered marks
      isFree: false,
    }));

    const result = checkWinCondition(board);
    
    expect(result.hasBingo).toBe(false);
    expect(result.winningIndices).toEqual([]);
  });

  it('should handle FREE space in win detection', () => {
    // Create a board where diagonal includes the FREE space
    const board: BingoBoard = Array.from({ length: 25 }, (_, i) => ({
      id: `cell-${i}`,
      content: i === 12 ? 'FREE' : `Item ${i}`,
      marked: i === 0 || i === 6 || i === 12 || i === 18 || i === 24, // Diagonal including center
      isFree: i === 12,
    }));

    const result = checkWinCondition(board);
    
    expect(result.hasBingo).toBe(true);
    expect(result.winningIndices).toEqual([0, 6, 12, 18, 24]);
  });
});