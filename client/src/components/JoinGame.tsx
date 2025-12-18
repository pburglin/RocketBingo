// client/src/components/JoinGame.tsx
import React, { useState } from 'react';

interface JoinGameProps {
  onJoinRoom: (roomId: string, playerName: string) => void;
  onBack: () => void;
  error?: string;
}

const JoinGame: React.FC<JoinGameProps> = ({ onJoinRoom, onBack, error }) => {
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim() && playerName.trim()) {
      onJoinRoom(roomId.trim().toUpperCase(), playerName.trim());
    }
  };

  const handleRoomIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-uppercase and limit to 6 characters
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setRoomId(value);
  };

  return (
    <div className="max-w-md mx-auto bg-white/10 backdrop-blur-md rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          🎯 Join Game
        </h2>
        <button
          onClick={onBack}
          className="text-purple-200 hover:text-white transition-colors"
        >
          ← Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-white text-sm font-bold mb-2">
            Room ID
          </label>
          <input
            type="text"
            value={roomId}
            onChange={handleRoomIdChange}
            placeholder="Enter 6-character room ID"
            className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-center text-lg tracking-widest"
            maxLength={6}
            required
          />
          <p className="text-purple-200 text-xs mt-1">
            Ask the host for the room ID or scan the QR code
          </p>
        </div>

        <div>
          <label className="block text-white text-sm font-bold mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name"
            className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            maxLength={20}
            required
          />
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={!roomId.trim() || !playerName.trim()}
          className={`w-full font-bold py-3 px-6 rounded-lg transition-colors ${
            roomId.trim() && playerName.trim()
              ? 'bg-purple-500 hover:bg-purple-600 text-white'
              : 'bg-gray-500 text-gray-300 cursor-not-allowed'
          }`}
        >
          🎮 Join Game
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-purple-200 text-sm">
          Don't have a room ID? Ask a friend to host a game and share the room code with you!
        </p>
      </div>
    </div>
  );
};

export default JoinGame;