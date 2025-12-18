// client/src/components/Lobby.tsx
import React from 'react';
import { Room } from '../../../shared/types';

interface LobbyProps {
  room: Room;
  isHost: boolean;
  onStartGame: () => void;
  onBack: () => void;
}

const Lobby: React.FC<LobbyProps> = ({ room, isHost, onStartGame, onBack }) => {
  const roomUrl = `${window.location.origin}?room=${room.id}`;
  
  const copyRoomUrl = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      // You could add a toast notification here
      console.log('Room URL copied to clipboard');
    } catch (err) {
      console.error('Failed to copy room URL:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto glass-card rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white float-animation">
          {isHost ? '🎮 Game Lobby' : '🎯 Waiting Room'}
        </h2>
        <button
          onClick={onBack}
          className="text-purple-200 hover:text-white transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* Room Info */}
      <div className="bg-white/20 rounded-lg p-4 mb-6">
        <div className="text-center">
          <p className="text-white text-sm mb-2">Room ID</p>
          <p className="text-3xl font-mono font-bold text-orange-400 mb-2">
            {room.id}
          </p>
          <p className="text-purple-200 text-sm mb-4">
            Mode: <span className="font-bold">{room.gameMode === 'CLASSIC' ? '🎲 Classic (1-75)' : '💼 Business Jargon'}</span>
          </p>
          
          {/* QR Code Placeholder */}
          <div className="bg-white p-4 rounded-lg inline-block mb-4">
            <div className="w-32 h-32 bg-gray-200 flex items-center justify-center text-gray-600 font-mono text-xs">
              QR CODE<br/>
              {roomUrl}
            </div>
          </div>
          
          <p className="text-purple-200 text-sm mb-4">
            Scan QR code or share the link below
          </p>
          
          {/* Room URL */}
          <div className="bg-white/20 rounded p-3">
            <p className="text-white text-xs mb-2">Share this link:</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={roomUrl}
                readOnly
                className="flex-1 bg-transparent text-white text-sm font-mono outline-none"
              />
              <button
                onClick={copyRoomUrl}
                className="bg-purple-500 hover:bg-purple-600 text-white text-xs px-3 py-1 rounded transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Players List */}
      <div className="bg-white/10 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">
          Players ({room.players.length})
        </h3>
        <div className="space-y-2">
          {room.players.map((player: any, index: number) => (
            <div 
              key={player.id}
              className="flex items-center justify-between bg-white/10 rounded p-3"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-white">
                  {player.name}
                  {index === 0 && <span className="text-orange-400 ml-2">(Host)</span>}
                </span>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Game Status */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-2 bg-orange-500/20 rounded-full px-4 py-2">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          <span className="text-orange-200 text-sm font-medium">
            Waiting for players...
          </span>
        </div>
      </div>

      {/* Start Game Button (Host only) */}
      {isHost && (
        <div className="text-center">
          <button
            onClick={onStartGame}
            disabled={room.players.length === 0}
            className={`rocket-button font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105 ${
              room.players.length === 0
                ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg'
            }`}
          >
            🚀 Start Game
          </button>
          {room.players.length === 0 && (
            <p className="text-gray-300 text-sm mt-2">
              Need at least 1 player to start
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Lobby;