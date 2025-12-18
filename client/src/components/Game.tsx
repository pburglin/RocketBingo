// client/src/components/Game.tsx
import React, { useState, useEffect } from 'react';
import { BingoBoard } from '../../../shared/types';
import Board from './Board';
import socketService from '../services/socket';

interface GameProps {
  room: any;
  playerName: string;
  onBackToLobby: () => void;
}

const Game: React.FC<GameProps> = ({ room, onBackToLobby }) => {
  const [gameBoard, setGameBoard] = useState<BingoBoard>([]);
  const [markedCells, setMarkedCells] = useState<Set<number>>(new Set());
  const [hasWon, setHasWon] = useState(false);


  // Initialize game board when game starts
  useEffect(() => {
    if (room.gameState === 'started') {
      // Generate a board with numbers 1-75 for classic mode
      const numbers = Array.from({ length: 75 }, (_, i) => (i + 1).toString());
      const board = generateSimpleBoard(numbers);
      setGameBoard(board);
    }
  }, [room.gameState]);

  // Handle socket events
  useEffect(() => {
    const handleGameStateUpdate = (data: any) => {
      if (data.markedCell && data.markedCell.playerId === socketService.getSocket()?.id) {
        // Update local marked cells
        setMarkedCells(prev => new Set([...prev, data.markedCell.cellIndex]));
      }
    };

    const handleBingoCalled = (data: any) => {
      if (data.playerId === socketService.getSocket()?.id) {
        setHasWon(true);
      }
    };

    socketService.onGameStateUpdate(handleGameStateUpdate);
    socketService.onBingoCalled(handleBingoCalled);

    return () => {
      socketService.offGameStateUpdate(handleGameStateUpdate);
      socketService.offBingoCalled(handleBingoCalled);
    };
  }, []);

  // Generate a simple bingo board (for now, same as server logic)
  const generateSimpleBoard = (items: string[]): BingoBoard => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 24);
    
    const board: BingoBoard = [];
    
    for (let i = 0; i < 25; i++) {
      if (i === 12) {
        // FREE space in center
        board.push({
          id: `cell-${i}`,
          content: 'FREE',
          marked: true,
          isFree: true
        });
      } else {
        const itemIndex = i < 12 ? i : i - 1;
        board.push({
          id: `cell-${i}`,
          content: selected[itemIndex] || '',
          marked: false,
          isFree: false
        });
      }
    }
    
    return board;
  };

  // Handle cell click
  const handleCellClick = (cellIndex: number) => {
    if (room.gameState !== 'started' || hasWon) return;
    
    // Visual only marking (no server verification yet)
    const newMarkedCells = new Set(markedCells);
    if (newMarkedCells.has(cellIndex)) {
      newMarkedCells.delete(cellIndex);
    } else {
      newMarkedCells.add(cellIndex);
    }
    setMarkedCells(newMarkedCells);

    // Emit to server for real-time sync
    socketService.markCell({
      roomId: room.id,
      cellIndex
    });
  };

  // Handle BINGO call
  const handleBingoCall = () => {
    socketService.callBingo({ roomId: room.id });
  };

  // Update board with marked cells
  const updatedBoard = gameBoard.map((cell: any, index: number) => ({
    ...cell,
    marked: cell.isFree || markedCells.has(index)
  }));

  if (room.gameState !== 'started') {
    return (
      <div className="max-w-2xl mx-auto bg-white/10 backdrop-blur-md rounded-lg p-6 text-center">
        <div className="text-white mb-4">
          <h2 className="text-2xl font-bold mb-2">🎮 Game Starting...</h2>
          <p className="text-purple-200">Get ready to play!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Game Header */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <h2 className="text-xl font-bold">🚀 Rocket Bingo</h2>
            <p className="text-purple-200 text-sm">Room: {room.id}</p>
          </div>
          <button
            onClick={onBackToLobby}
            className="text-purple-200 hover:text-white transition-colors"
          >
            ← Back to Lobby
          </button>
        </div>
      </div>

      {/* Game Board */}
      <Board 
        board={updatedBoard} 
        onCellClick={handleCellClick}
      />

      {/* Win Declaration */}
      <div className="text-center mt-6">
        {!hasWon ? (
          <button
            onClick={handleBingoCall}
            disabled={room.gameState !== 'started'}
            className={`font-bold py-4 px-12 rounded-lg text-xl transition-all transform hover:scale-105 ${
              room.gameState === 'started'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }`}
          >
            🎉 Call BINGO!
          </button>
        ) : (
          <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-lg p-6">
            <h3 className="text-2xl font-bold text-white mb-2">🎉 BINGO!</h3>
            <p className="text-green-100">Congratulations! You won!</p>
          </div>
        )}
      </div>

      {/* Game Stats */}
      <div className="mt-6 text-center">
        <div className="inline-flex space-x-6 text-white text-sm">
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <span className="text-purple-200">Marked: </span>
            <span className="font-bold">{markedCells.size}</span>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <span className="text-purple-200">Players: </span>
            <span className="font-bold">{room.players.length}</span>
          </div>
          <div className="bg-white/10 rounded-lg px-4 py-2">
            <span className="text-purple-200">Status: </span>
            <span className="font-bold capitalize">{room.gameState}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;