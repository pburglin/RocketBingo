import React from 'react';
import { BingoBoard } from '../../../shared/types';

interface BoardProps {
  board: BingoBoard;
  onCellClick: (index: number) => void;
}

const Board: React.FC<BoardProps> = ({ board, onCellClick }) => {
  if (board.length === 0) {
    return (
      <div className="text-center text-white">
        <p>No board generated yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
      <h3 className="text-2xl font-bold text-white mb-4 text-center">
        Your Bingo Card
      </h3>
      
      <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
        {board.map((cell: any, index: number) => (
          <button
            key={cell.id}
            onClick={() => !cell.isFree && onCellClick(index)}
            className={`
              aspect-square flex items-center justify-center text-sm font-bold rounded-lg
              transition-all duration-200 transform hover:scale-105
              ${cell.isFree 
                ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white cursor-default' 
                : cell.marked 
                  ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }
              ${cell.marked && !cell.isFree ? 'ring-2 ring-green-300' : ''}
            `}
            disabled={cell.isFree}
          >
            <span className="text-center leading-tight">
              {cell.content}
            </span>
          </button>
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg transition-colors">
          🎉 Call BINGO!
        </button>
      </div>
    </div>
  );
};

export default Board;