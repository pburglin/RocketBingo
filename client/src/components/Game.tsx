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

const Game: React.FC<GameProps> = ({ room, playerName, onBackToLobby }) => {
  const [gameBoard, setGameBoard] = useState<BingoBoard>([]);
  const [markedCells, setMarkedCells] = useState<Set<number>>(new Set());
  const [hasWon, setHasWon] = useState(false);
  const [bingoValidation, setBingoValidation] = useState<any>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [generatedNumber, setGeneratedNumber] = useState<any>(null);
  const [showNumberDialog, setShowNumberDialog] = useState(false);
  const [bingoCardToShow, setBingoCardToShow] = useState<any>(null);
  const [showBingoCard, setShowBingoCard] = useState(false);

  // Track marked cells for all players (not currently used but kept for future functionality)
  // const [allPlayersMarkedCells, setAllPlayersMarkedCells] = useState<Record<string, Set<number>>>({});


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
    socketService.onBingoValidation(handleBingoValidation);
    socketService.onNumberGenerated(handleNumberGenerated);
    socketService.onBingoChallenged(handleBingoChallenged);

    return () => {
      socketService.offGameStateUpdate(handleGameStateUpdate);
      socketService.offBingoCalled(handleBingoCalled);
      socketService.offBingoValidation(handleBingoValidation);
      socketService.offNumberGenerated(handleNumberGenerated);
      socketService.offBingoChallenged(handleBingoChallenged);
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

  // Handle BINGO call with validation
  const handleBingoCall = () => {
    socketService.callBingo({ roomId: room.id, markedCells: Array.from(markedCells) });
  };

  // Handle getting next number (host only)
  const handleGetNextNumber = () => {
    socketService.getNextNumber({ roomId: room.id });
  };

  // Handle number generated event
  const handleNumberGenerated = (data: any) => {
    setGeneratedNumber(data);
    setShowNumberDialog(true);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setShowNumberDialog(false);
      setGeneratedNumber(null);
    }, 5000);
  };

  // Close number dialog
  const closeNumberDialog = () => {
    setShowNumberDialog(false);
    setGeneratedNumber(null);
  };

  // Handle challenge bingo call
  const handleChallengeBingo = () => {
    if (bingoValidation && room.hostId === socketService.getSocket()?.id) {
      // Send challenge to server
      socketService.challengeBingo({
        roomId: room.id,
        playerId: bingoValidation.playerId
      });
      
      // Close validation dialog
      closeValidation();
      
      // Show challenge confirmation
      alert(`${bingoValidation.playerName}'s bingo has been challenged and rejected. Game continues!`);
    }
  };

  // Close bingo card display
  const closeBingoCard = () => {
    setShowBingoCard(false);
    setBingoCardToShow(null);
  };

  // Handle bingo challenged event
  const handleBingoChallenged = (data: any) => {
    // Reset any win state
    setHasWon(false);
    
    // Show challenge notification
    alert(`⚠️ ${data.playerName}'s bingo has been CHALLENGED and rejected! Game continues.`);
    
    // Close any open dialogs
    setShowValidation(false);
    setShowBingoCard(false);
    setBingoValidation(null);
    setBingoCardToShow(null);
  };

  // Handle bingo validation response
  const handleBingoValidation = (data: any) => {
    setBingoValidation(data);
    setShowValidation(true);
    
    // Auto-hide validation after 5 seconds only if valid
    if (data.isValid) {
      setTimeout(() => {
        setShowValidation(false);
        setBingoValidation(null);
      }, 5000);
    }
    
    // If this player won, set hasWon
    if (data.isValid && data.playerId === socketService.getSocket()?.id) {
      setHasWon(true);
    }
    
    // Show the bingo card for validation (especially for hosts)
    if (data.playerId !== socketService.getSocket()?.id) {
      // TODO: Get the called player's board from server
      // For now, show a placeholder
      setBingoCardToShow({
        playerName: data.playerName,
        markedCells: data.markedCells,
        gameMode: room.gameMode
      });
      setShowBingoCard(true);
    }
  };

  // Close validation dialog
  const closeValidation = () => {
    setShowValidation(false);
    setBingoValidation(null);
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
            <p className="text-purple-200 text-xs">
              {room.numberGenerator === 'BUILTIN' ? '🎲 Built-in Generator' : '🌐 External Generator'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {room.numberGenerator === 'BUILTIN' && room.hostId === socketService.getSocket()?.id && (
              <button
                onClick={handleGetNextNumber}
                disabled={room.gameState !== 'started'}
                className="rocket-button bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-all transform hover:scale-105"
              >
                🎯 Get Next Number
              </button>
            )}
            <button
              onClick={onBackToLobby}
              className="text-purple-200 hover:text-white transition-colors"
            >
              ← Back to Lobby
            </button>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <Board 
        board={updatedBoard} 
        onCellClick={handleCellClick}
      />

      {/* Player List */}
      <div className="glass-card rounded-lg p-6 mt-6">
        <h3 className="text-xl font-bold text-white mb-4 text-center">
          👥 Players ({room.players.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {room.players
            .sort((a: any, b: any) => {
              // Host first
              if (a.socketId === room.hostId) return -1;
              if (b.socketId === room.hostId) return 1;
              // Then alphabetical
              return a.name.localeCompare(b.name);
            })
            .map((player: any) => {
              const markedCount = 0; // allPlayersMarkedCells[player.socketId]?.size || 0;
              const isHost = player.socketId === room.hostId;
              const isCurrentPlayer = player.name === playerName;
              
              return (
                <div 
                  key={player.id}
                  className={`bg-white/10 rounded-lg p-3 transition-all ${
                    isCurrentPlayer ? 'ring-2 ring-orange-400 bg-orange-500/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-white font-medium">
                          {player.name}
                          {isHost && <span className="text-orange-400 ml-1">(host)</span>}
                          {isCurrentPlayer && <span className="text-green-400 ml-1">(you)</span>}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-bold">{markedCount}</div>
                      <div className="text-purple-200 text-xs">marked</div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

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
      
      {/* Bingo Validation Dialog */}
      {showValidation && bingoValidation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeValidation}
          />
          
          {/* Validation Dialog */}
          <div className={`relative max-w-md w-full mx-4 glass-card rounded-xl p-6 shadow-2xl ${
            bingoValidation.isValid ? 'border-2 border-green-400' : 'border-2 border-red-400'
          }`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-2xl font-bold ${
                bingoValidation.isValid ? 'text-green-400' : 'text-red-400'
              }`}>
                {bingoValidation.isValid ? '🎉 VALID BINGO!' : '❌ INVALID BINGO'}
              </h3>
              <button
                onClick={closeValidation}
                className="text-purple-200 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Content */}
            <div className="text-white text-center">
              <p className="text-lg mb-2">
                <span className="font-bold">{bingoValidation.playerName}</span> called BINGO!
              </p>
              
              {bingoValidation.isValid ? (
                <div className="bingo-win rounded-lg p-4 mb-4">
                  <p className="text-green-100 font-medium">
                    🎆 Congratulations! Valid winning line detected!
                  </p>
                  <p className="text-green-200 text-sm mt-1">
                    {bingoValidation.winningLines.length} winning line{bingoValidation.winningLines.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              ) : (
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4">
                  <p className="text-red-200 font-medium">
                    ❌ This is not a valid bingo card.
                  </p>
                  <p className="text-red-300 text-sm mt-1">
                    You need to mark at least 4 cells in a row, column, or diagonal.
                  </p>
                </div>
              )}
              
              <div className="flex space-x-3">
                <button
                  onClick={closeValidation}
                  className="rocket-button bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-6 rounded-lg transition-colors flex-1"
                >
                  Continue Playing
                </button>
                {room.hostId === socketService.getSocket()?.id && bingoValidation.isValid && (
                  <button
                    onClick={handleChallengeBingo}
                    className="rocket-button bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors flex-1"
                  >
                    ⚠️ Challenge
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Number Generated Dialog */}
      {showNumberDialog && generatedNumber && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeNumberDialog}
          />
          
          {/* Number Dialog */}
          <div className="relative max-w-sm w-full mx-4 glass-card rounded-xl p-6 shadow-2xl border-2 border-blue-400 animate-pulse">
            {/* Header */}
            <div className="text-center mb-4">
              <h3 className="text-2xl font-bold text-blue-400 mb-2">
                🎯 New Number Generated!
              </h3>
            </div>
            
            {/* Number Display */}
            <div className="text-center mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-4xl font-bold py-6 px-8 rounded-lg shadow-lg transform hover:scale-105 transition-all">
                {generatedNumber.number}
              </div>
              <p className="text-purple-200 text-sm mt-2">
                Mark this on your board if you have it!
              </p>
            </div>
            
            <button
              onClick={closeNumberDialog}
              className="rocket-button bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors w-full"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
      
      {/* Bingo Card Display Dialog */}
      {showBingoCard && bingoCardToShow && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeBingoCard}
          />
          
          {/* Bingo Card Dialog */}
          <div className="relative max-w-lg w-full mx-4 glass-card rounded-xl p-6 shadow-2xl border-2 border-yellow-400">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-yellow-400">
                🎯 {bingoCardToShow.playerName}'s Board
              </h3>
              <button
                onClick={closeBingoCard}
                className="text-purple-200 hover:text-white transition-colors text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Board Display */}
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-5 gap-1">
                {Array.from({ length: 25 }, (_, index) => {
                  const isMarked = bingoCardToShow.markedCells?.includes(index) || index === 12;
                  const cellContent = index === 12 ? 'FREE' : `Cell ${index + 1}`;
                  
                  return (
                    <div
                      key={index}
                      className={`aspect-square flex items-center justify-center text-xs font-bold rounded transition-all ${
                        isMarked
                          ? 'bg-green-500 text-white'
                          : 'bg-white/20 text-white'
                      }`}
                    >
                      {cellContent}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Info */}
            <div className="text-center mb-4">
              <p className="text-purple-200 text-sm">
                Marked cells shown in green. This is the board that called BINGO.
              </p>
            </div>
            
            <button
              onClick={closeBingoCard}
              className="rocket-button bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg transition-colors w-full"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;