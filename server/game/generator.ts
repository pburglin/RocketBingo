// server/game/generator.ts
import { BingoBoard } from '../../shared/types';

/**
 * Shuffles an array in place using Fisher-Yates algorithm
 */
function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length;

  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    const temp = array[currentIndex]!;
    array[currentIndex] = array[randomIndex]!;
    array[randomIndex] = temp;
  }

  return array;
}

export const generateBoard = (items: string[]): BingoBoard => {
  if (items.length < 24) {
    throw new Error("Not enough items to generate a bingo board (need 24 + Free space)");
  }

  // 1. Shuffle and pick top 24
  const shuffled = shuffle([...items]);
  const selected = shuffled.slice(0, 24);

  // 2. Construct the board (Flat array of 25)
  // Indices 0-11 are normal, 12 is FREE, 13-24 are normal
  const board: BingoBoard = [];

  let itemIdx = 0;
  for (let i = 0; i < 25; i++) {
    if (i === 12) {
      // The Center Free Space
      board.push({
        id: `cell-${i}`,
        content: "FREE",
        marked: true, // Always marked by default
        isFree: true
      });
    } else {
      board.push({
        id: `cell-${i}`,
        content: selected[itemIdx] || '',
        marked: false,
        isFree: false
      });
      itemIdx++;
    }
  }

  return board;
};