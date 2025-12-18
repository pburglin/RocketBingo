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
      const board = generateSimpleBoard(room.gameMode);
      setGameBoard(board);
    }
  }, [room.gameState, room.gameMode]);

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

  // Generate a simple bingo board based on game mode
  const generateSimpleBoard = (gameMode: string): BingoBoard => {
    let items: string[];
    
    if (gameMode === 'BUSINESS') {
      // Load business jargon (simplified - in real app would be from shared)
      const businessPhrases = [
        "Circle back", "Low hanging fruit", "Move the needle", "Touch base", 
        "Bandwidth", "Pivot", "Leverage", "Synergy", "Best practice", 
        "Paradigm shift", "Out of the box", "Think outside the box", 
        "Deep dive", "Game changer", "Stakeholder", "Value proposition", 
        "Pain point", "Solutioning", "Alignment", "Buy-in", "Siloed", 
        "KPI", "OKR", "Deliverable", "Action item", "Follow up"
      ];
      items = [...businessPhrases].sort(() => Math.random() - 0.5);
    } else {
      // Classic mode: numbers 1-75
      items = Array.from({ length: 75 }, (_, i) => (i + 1).toString());
      items = [...items].sort(() => Math.random() - 0.5);
    }
    
    const selected = items.slice(0, 24);
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
      <div className="max-w-2xl mx-auto glass-card rounded-lg p-6 text-center">
        <div className="text-white mb-4">
          <div className="rocket-spinner mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold mb-2 rocket-pulse">🎮 Game Starting...</h2>
          <p className="text-purple-200">Get ready to play!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Game Header */}
      <div className="glass-card rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <h2 className="text-xl font-bold float-animation">🚀 Rocket Bingo</h2>
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
            className={`rocket-button font-bold py-4 px-12 rounded-lg text-xl transition-all transform hover:scale-105 ${
              room.gameState === 'started'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
            }`}
          >
            🎉 Call BINGO!
          </button>
        ) : (
          <div className="bingo-win rounded-lg p-6 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-2 sparkle-animation">🎉 BINGO!</h3>
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