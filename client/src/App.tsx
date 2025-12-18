import React, { useState } from 'react';
import { GameMode } from '../../shared/types';

const App: React.FC = () => {
  const [gameMode, setGameMode] = useState<GameMode>('CLASSIC');
  const [isHost, setIsHost] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-orange-900">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            🚀 Rocket Bingo
          </h1>
          <p className="text-xl text-purple-200">
            Real-time multiplayer bingo with a rocket theme!
          </p>
        </header>

        {!isHost ? (
          <div className="max-w-md mx-auto bg-white/10 backdrop-blur-md rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Choose Your Role
            </h2>
            
            <div className="space-y-4">
              <button
                onClick={() => setIsHost(true)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                🚀 Host Game
              </button>
              
              <button
                onClick={() => setIsHost(false)}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                🎮 Join Game
              </button>
            </div>

            <div className="mt-6">
              <label className="block text-white text-sm font-bold mb-2">
                Game Mode
              </label>
              <select
                value={gameMode}
                onChange={(e) => setGameMode(e.target.value as GameMode)}
                className="w-full p-2 rounded bg-white/20 text-white"
              >
                <option value="CLASSIC">Classic (1-75)</option>
                <option value="BUSINESS">Business Buzzwords</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-white">
                  Game Lobby
                </h2>
                <button
                  onClick={() => setIsHost(false)}
                  className="text-purple-200 hover:text-white"
                >
                  ← Back
                </button>
              </div>
              
              <div className="bg-white/20 rounded p-4 mb-4">
                <p className="text-white">Room ID: <span className="font-mono">ROOM-123</span></p>
                <p className="text-purple-200 text-sm">Share this with players to join</p>
              </div>
              
              <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
                Start Game
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
              <p className="text-white text-center">Game board will appear here when game starts</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;