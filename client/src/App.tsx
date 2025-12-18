// client/src/App.tsx
import React, { useState, useEffect } from 'react';
import { Room } from '../../shared/types';
import Lobby from './components/Lobby';
import Game from './components/Game';
import JoinGame from './components/JoinGame';
import HostModal from './components/HostModal';
import WebGLBackground from './components/WebGLBackground';
import socketService from './services/socket';

type AppState = 'landing' | 'host' | 'lobby' | 'game' | 'join';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('landing');
  // const [gameMode, setGameMode] = useState<GameMode>('CLASSIC'); // Not currently used
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState('');
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  // Connect to socket on component mount
  useEffect(() => {
    socketService.connect();
    
    // Monitor socket connection status
    const checkConnection = () => {
      setSocketConnected(socketService.isSocketConnected());
    };
    
    const interval = setInterval(checkConnection, 1000);
    
    // Set up global error handler
    socketService.onError((data) => {
      setError(data.message);
      setTimeout(() => setError(''), 5000);
    });

    return () => {
      clearInterval(interval);
      socketService.disconnect();
    };
  }, []);

  // Handle room creation
  const handleCreateRoom = (name: string, gameMode: 'CLASSIC' | 'BUSINESS', numberGenerator: 'EXTERNAL' | 'BUILTIN') => {
    console.log('🚀 handleCreateRoom called with:', { name, gameMode, numberGenerator });
    
    setPlayerName(name);
    setIsHost(true);
    setError('');
    
    console.log('📡 Setting up room created listener...');
    socketService.onRoomCreated((data) => {
      console.log('✅ Room created event received:', data);
      setCurrentRoom(data.room);
      setAppState('lobby');
    });
    
    console.log('📤 Calling socketService.createRoom...');
    socketService.createRoom({ playerName: name, gameMode, numberGenerator });
    
    console.log('🚪 Closing host modal...');
    setIsHostModalOpen(false);
  };

  // Handle room joining
  const handleJoinRoom = (roomId: string, name: string) => {
    setPlayerName(name);
    setIsHost(false);
    setError('');
    
    socketService.onRoomJoined((data) => {
      if (data.success) {
        setCurrentRoom(data.room);
        setAppState('lobby');
      } else {
        setError(data.message || 'Failed to join room');
      }
    });
    
    socketService.joinRoom({ roomId, playerName: name });
  };

  // Handle game start
  const handleStartGame = () => {
    if (currentRoom && isHost) {
      socketService.onGameStarted((data) => {
        setCurrentRoom(data.room);
        setAppState('game');
      });
      
      socketService.startGame({ roomId: currentRoom.id });
    }
  };

  // Handle going back to lobby
  const handleBackToLobby = () => {
    setAppState('lobby');
  };

  // Handle going back to landing
  const handleBackToLanding = () => {
    setAppState('landing');
    setCurrentRoom(null);
    setPlayerName('');
    setIsHost(false);
    setError('');
    socketService.disconnect();
    socketService.connect();
  };

  // Listen for real-time updates
  useEffect(() => {
    if (currentRoom) {
      socketService.onPlayerJoined((data) => {
        setCurrentRoom(data.room);
      });

      socketService.onGameStateUpdate((data) => {
        setCurrentRoom(data.room);
      });
    }
  }, [currentRoom]);

  // Check for room ID in URL on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    
    if (roomFromUrl && appState === 'landing') {
      setAppState('join');
    }
  }, [appState]);

  // Render landing page
  if (appState === 'landing') {
    return (
      <>
        <WebGLBackground intensity="high" />
        <div className="relative min-h-screen bg-gradient-to-br from-purple-900/80 via-purple-800/80 to-orange-900/80 gradient-animation">
          <div className="relative z-10 container mx-auto px-4 py-8">
            <header className="text-center mb-8">
              <h1 className="text-5xl font-bold text-white mb-4 float-animation">
                🚀 Rocket Bingo
              </h1>
              <p className="text-xl text-purple-200">
                Real-time multiplayer bingo with a rocket theme!
              </p>
            </header>

            <div className="max-w-md mx-auto glass-card rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">
                Choose Your Role
              </h2>
              
              {/* Server Connection Warning */}
              {!socketConnected && (
                <div className="bg-orange-500/20 border border-orange-500 rounded-lg p-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="text-orange-400">⚠️</div>
                    <p className="text-orange-200 text-sm">
                      Backend server not connected. Multiplayer features unavailable.
                    </p>
                  </div>
                  <p className="text-orange-300 text-xs mt-1">
                    Run locally with: <code className="bg-orange-500/20 px-1 rounded">npm run dev</code>
                  </p>
                </div>
              )}
              
              <div className="space-y-4">
                <button
                  onClick={() => setIsHostModalOpen(true)}
                  disabled={!socketConnected}
                  className={`w-full rocket-button font-bold py-3 px-6 rounded-lg transition-colors ${
                    socketConnected 
                      ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                      : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  🚀 Host Game {!socketConnected && '(Server Required)'}
                </button>
                
                <button
                  onClick={() => setAppState('join')}
                  disabled={!socketConnected}
                  className={`w-full rocket-button font-bold py-3 px-6 rounded-lg transition-colors ${
                    socketConnected 
                      ? 'bg-purple-500 hover:bg-purple-600 text-white' 
                      : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  🎮 Join Game {!socketConnected && '(Server Required)'}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <HostModal
          isOpen={isHostModalOpen}
          onClose={() => setIsHostModalOpen(false)}
          onSubmit={handleCreateRoom}
        />
      </>
    );
  }

  // Render join game page
  if (appState === 'join') {
    return (
      <>
        <WebGLBackground intensity="medium" />
        <div className="relative min-h-screen bg-gradient-to-br from-purple-900/80 via-purple-800/80 to-orange-900/80">
          <div className="relative z-10 container mx-auto px-4 py-8">
            <header className="text-center mb-8">
              <h1 className="text-5xl font-bold text-white mb-4">
                🚀 Rocket Bingo
              </h1>
              <p className="text-xl text-purple-200">
                Join an existing game!
              </p>
            </header>

            {/* Server Connection Warning */}
            {!socketConnected && (
              <div className="max-w-md mx-auto mb-6">
                <div className="bg-orange-500/20 border border-orange-500 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <div className="text-orange-400">⚠️</div>
                    <p className="text-orange-200 text-sm">
                      Backend server not connected. Multiplayer features unavailable.
                    </p>
                  </div>
                  <p className="text-orange-300 text-xs mt-1">
                    Run locally with: <code className="bg-orange-500/20 px-1 rounded">npm run dev</code>
                  </p>
                </div>
              </div>
            )}

            <JoinGame
              onJoinRoom={handleJoinRoom}
              onBack={handleBackToLanding}
              error={error}
            />
          </div>
        </div>
      </>
    );
  }

  // Render lobby
  if (appState === 'lobby' && currentRoom) {
    return (
      <>
        <WebGLBackground intensity="medium" />
        <div className="relative min-h-screen bg-gradient-to-br from-purple-900/80 via-purple-800/80 to-orange-900/80">
          <div className="relative z-10 container mx-auto px-4 py-8">
            <header className="text-center mb-8">
              <h1 className="text-5xl font-bold text-white mb-4">
                🚀 Rocket Bingo
              </h1>
              <p className="text-xl text-purple-200">
                Waiting for players to join...
              </p>
            </header>

            <Lobby
              room={currentRoom}
              isHost={isHost}
              onStartGame={handleStartGame}
              onBack={handleBackToLanding}
            />

            {error && (
              <div className="max-w-md mx-auto mt-4">
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-3">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Render game
  if (appState === 'game' && currentRoom) {
    return (
      <>
        <WebGLBackground intensity="low" />
        <div className="relative min-h-screen bg-gradient-to-br from-purple-900/80 via-purple-800/80 to-orange-900/80">
          <div className="relative z-10 container mx-auto px-4 py-8">
            <Game
              room={currentRoom}
              playerName={playerName}
              onBackToLobby={handleBackToLobby}
            />
          </div>
        </div>
      </>
    );
  }

  // Loading state
  return (
    <>
      <WebGLBackground intensity="high" />
      <div className="relative min-h-screen bg-gradient-to-br from-purple-900/80 via-purple-800/80 to-orange-900/80 gradient-animation flex items-center justify-center">
        <div className="relative z-10 text-center text-white">
          <div className="rocket-spinner mx-auto mb-4"></div>
          <p className="text-xl rocket-pulse">Loading...</p>
        </div>
      </div>
    </>
  );
};

export default App;