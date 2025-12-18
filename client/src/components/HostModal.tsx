// client/src/components/HostModal.tsx
import React, { useState } from 'react';

interface HostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (playerName: string) => void;
}

const HostModal: React.FC<HostModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [playerName, setPlayerName] = useState('');
  const [gameMode, setGameMode] = useState<'CLASSIC' | 'BUSINESS'>('CLASSIC');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onSubmit(playerName.trim());
      setPlayerName('');
      onClose();
    }
  };

  const handleClose = () => {
    setPlayerName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative max-w-md w-full mx-4 glass-card rounded-xl p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white float-animation">
            🚀 Host Game
          </h2>
          <button
            onClick={handleClose}
            className="text-purple-200 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm font-bold mb-2">
              Enter your name to host:
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name"
              className="w-full p-3 rounded-lg bg-white/20 text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              maxLength={20}
              autoFocus
              required
            />
            <p className="text-purple-200 text-xs mt-1">
              Choose a name that other players will see
            </p>
          </div>

          <div>
            <label className="block text-white text-sm font-bold mb-2">
              Game Mode
            </label>
            <select
              value={gameMode}
              onChange={(e) => setGameMode(e.target.value as 'CLASSIC' | 'BUSINESS')}
              className="w-full p-3 rounded-lg bg-white/20 text-white border-2 border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            >
              <option value="CLASSIC" className="bg-purple-800 text-white">
                🎲 Classic Bingo (Numbers 1-75)
              </option>
              <option value="BUSINESS" className="bg-purple-800 text-white">
                💼 Business Buzzwords (Corporate Jargon)
              </option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-3 px-4 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!playerName.trim()}
              className={`flex-1 py-3 px-4 rounded-lg font-bold transition-all transform hover:scale-105 ${
                playerName.trim()
                  ? 'rocket-button bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg'
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              🚀 Host Game
            </button>
          </div>
        </form>

        {/* Description */}
        <div className="mt-4 text-center">
          <p className="text-purple-200 text-sm">
            As the host, you'll be able to start the game and control the lobby
          </p>
        </div>
      </div>
    </div>
  );
};

export default HostModal;