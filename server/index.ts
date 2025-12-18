// server/index.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { generateBoard } from './game/generator';
import { Room, Player, generateRoomId, validateRoomId } from '../shared/socket-events';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// In-memory room storage (in production, use Redis or database)
const rooms = new Map<string, Room>();

// Track marked cells for each player
const playerMarkedCells = new Map<string, Map<string, Set<number>>>(); // roomId -> (playerId -> Set<cellIndex>)

// Track generated numbers for built-in number generator
const generatedNumbers = new Map<string, number[]>(); // roomId -> array of generated numbers

// Utility function to get or create room
const getRoom = (roomId: string): Room | undefined => {
  return rooms.get(roomId);
};

// Utility function to save room
const saveRoom = (room: Room): void => {
  rooms.set(room.id, room);
};

// Utility function to remove room
const removeRoom = (roomId: string): void => {
  rooms.delete(roomId);
};

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle room creation
  socket.on('create_room', (data: { playerName: string; gameMode?: 'CLASSIC' | 'BUSINESS'; numberGenerator?: 'EXTERNAL' | 'BUILTIN' }) => {
    console.log('🏠 Server received create_room request:', data);
    console.log('🔌 Socket ID:', socket.id);
    
    try {
      const { playerName, gameMode = 'CLASSIC', numberGenerator = 'EXTERNAL' } = data;
      console.log('📊 Parsed data:', { playerName, gameMode, numberGenerator });
      
      if (!playerName || typeof playerName !== 'string' || playerName.trim().length === 0) {
        socket.emit('error', { message: 'Player name is required' });
        return;
      }

      // Generate unique room ID
      let roomId: string;
      do {
        roomId = generateRoomId();
      } while (rooms.has(roomId));

      // Create host player
      const hostPlayer: Player = {
        id: socket.id,
        name: playerName.trim(),
        socketId: socket.id,
        joinedAt: new Date()
      };

      // Create room
      const room: Room = {
        id: roomId,
        hostId: socket.id,
        players: [hostPlayer],
        gameState: 'waiting',
        gameMode: gameMode,
        numberGenerator: numberGenerator,
        createdAt: new Date()
      };

      // Save room and join socket to room
      saveRoom(room);
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.playerId = socket.id;

      // Emit room created event
      socket.emit('room_created', { roomId, room });

      console.log(`Room created: ${roomId} by ${playerName}`);
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  // Handle room joining
  socket.on('join_room', (data: { roomId: string; playerName: string }) => {
    try {
      const { roomId, playerName } = data;

      // Validate inputs
      if (!roomId || !playerName) {
        socket.emit('room_joined', { 
          room: null as any, 
          success: false, 
          message: 'Room ID and player name are required' 
        });
        return;
      }

      if (!validateRoomId(roomId)) {
        socket.emit('room_joined', { 
          room: null as any, 
          success: false, 
          message: 'Invalid room ID format' 
        });
        return;
      }

      const room = getRoom(roomId);
      
      if (!room) {
        socket.emit('room_joined', { 
          room: null as any, 
          success: false, 
          message: 'Room not found' 
        });
        return;
      }

      if (room.gameState !== 'waiting') {
        socket.emit('room_joined', { 
          room: null as any, 
          success: false, 
          message: 'Game already started' 
        });
        return;
      }

      // Check if player already in room
      const existingPlayer = room.players.find(p => p.socketId === socket.id);
      if (existingPlayer) {
        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.playerId = socket.id;
        
        socket.emit('room_joined', { room, success: true });
        return;
      }

      // Add player to room
      const newPlayer: Player = {
        id: socket.id,
        name: playerName.trim(),
        socketId: socket.id,
        joinedAt: new Date()
      };

      room.players.push(newPlayer);
      saveRoom(room);

      // Join socket to room
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.playerId = socket.id;

      // Emit successful join
      socket.emit('room_joined', { room, success: true });

      // Notify all players in room about new player
      io.to(roomId).emit('player_joined', { room });

      console.log(`Player ${playerName} joined room ${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('room_joined', { 
        room: null as any, 
        success: false, 
        message: 'Failed to join room' 
      });
    }
  });

  // Handle game start
  socket.on('start_game', (data: { roomId: string }) => {
    try {
      const { roomId } = data;
      const room = getRoom(roomId);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Only host can start game
      if (socket.id !== room.hostId) {
        socket.emit('error', { message: 'Only the host can start the game' });
        return;
      }

      if (room.players.length < 1) {
        socket.emit('error', { message: 'Need at least 1 player to start' });
        return;
      }

      // Update game state
      room.gameState = 'started';
      saveRoom(room);

      // Generate boards based on game mode
      generateBoard(room.gameMode); // Generate board based on game mode

      // TODO: In a real implementation, each player would get their own unique board
      // For now, we'll store the board in the room for reference
      
      // Broadcast game started event
      io.to(roomId).emit('game_started', { room });

      console.log(`Game started in room ${roomId}`);
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  // Handle cell marking with tracking
  socket.on('mark_cell', (data: { roomId: string; cellIndex: number }) => {
    try {
      const { roomId, cellIndex } = data;
      const room = getRoom(roomId);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.gameState !== 'started') {
        socket.emit('error', { message: 'Game not in progress' });
        return;
      }

      // Validate cell index
      if (cellIndex < 0 || cellIndex >= 25) {
        socket.emit('error', { message: 'Invalid cell index' });
        return;
      }

      // Track marked cells for this player
      if (!playerMarkedCells.has(roomId)) {
        playerMarkedCells.set(roomId, new Map());
      }
      const roomMarkedCells = playerMarkedCells.get(roomId)!;
      
      if (!roomMarkedCells.has(socket.id)) {
        roomMarkedCells.set(socket.id, new Set());
      }
      
      const playerCells = roomMarkedCells.get(socket.id)!;
      if (playerCells.has(cellIndex)) {
        playerCells.delete(cellIndex); // Toggle off
      } else {
        playerCells.add(cellIndex); // Toggle on
      }

      // Broadcast cell marking to all players in room
      io.to(roomId).emit('game_state_update', { 
        room,
        markedCell: { 
          playerId: socket.id, 
          cellIndex 
        } 
      });

    } catch (error) {
      console.error('Error marking cell:', error);
      socket.emit('error', { message: 'Failed to mark cell' });
    }
  });

  // Handle bingo call with validation
  socket.on('call_bingo', (data: { roomId: string; markedCells?: number[] }) => {
    try {
      const { roomId, markedCells = [] } = data;
      const room = getRoom(roomId);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.gameState !== 'started') {
        socket.emit('error', { message: 'Game not in progress' });
        return;
      }

      // Get player info
      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) {
        socket.emit('error', { message: 'Player not found in room' });
        return;
      }

      // Validate bingo (simple validation - need 5 in a row)
      const validation = validateBingo(markedCells);
      
      // Broadcast validation result to all players
      io.to(roomId).emit('bingo_validation', {
        playerId: socket.id,
        playerName: player.name,
        markedCells,
        isValid: validation.isValid,
        winningLines: validation.winningLines
      });

      console.log(`Bingo called by ${player.name} (${socket.id}) in room ${roomId} - Valid: ${validation.isValid}`);
    } catch (error) {
      console.error('Error calling bingo:', error);
      socket.emit('error', { message: 'Failed to call bingo' });
    }
  });

  // Handle getting next number for built-in number generator
  socket.on('get_next_number', (data: { roomId: string }) => {
    try {
      const { roomId } = data;
      const room = getRoom(roomId);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Only host can generate numbers
      if (socket.id !== room.hostId) {
        socket.emit('error', { message: 'Only the host can generate numbers' });
        return;
      }

      if (room.gameState !== 'started') {
        socket.emit('error', { message: 'Game not in progress' });
        return;
      }

      if (room.numberGenerator !== 'BUILTIN') {
        socket.emit('error', { message: 'This room is not using built-in number generator' });
        return;
      }

      // Generate a new number (1-75 for classic, random business terms for business)
      let newNumber: string;
      if (room.gameMode === 'CLASSIC') {
        // Generate number 1-75
        const availableNumbers = [];
        for (let i = 1; i <= 75; i++) {
          if (!generatedNumbers.get(roomId)?.includes(i)) {
            availableNumbers.push(i);
          }
        }
        
        if (availableNumbers.length === 0) {
          socket.emit('error', { message: 'All numbers have been generated' });
          return;
        }
        
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        newNumber = availableNumbers[randomIndex].toString();
      } else {
        // Business mode - get random business term
        const businessTerms = [
          'Synergy', 'Disruption', 'Leverage', 'Scalability', 'Optimization',
          'Pivot', 'Innovation', 'Agility', 'Velocity', 'Framework',
          'Cloud-based', 'Analytics', 'Blockchain', 'AI-driven', 'Machine Learning',
          'SaaS', 'API', 'DevOps', 'Scrum', 'Kanban', 'ROI', 'KPIs', 'OKRs',
          'Stakeholder', 'Alignment', 'Roadmap', 'Milestone', 'Deliverable',
          'Scalable', 'Robust', 'Enterprise', 'Solution', 'Integration',
          'Workflow', 'Pipeline', 'Infrastructure', 'Architecture', 'Protocol'
        ];
        
        const availableTerms = businessTerms.filter(term => 
          !generatedNumbers.get(roomId)?.includes(businessTerms.indexOf(term))
        );
        
        if (availableTerms.length === 0) {
          socket.emit('error', { message: 'All business terms have been generated' });
          return;
        }
        
        newNumber = availableTerms[Math.floor(Math.random() * availableTerms.length)];
      }

      // Store generated number
      if (!generatedNumbers.has(roomId)) {
        generatedNumbers.set(roomId, []);
      }
      const roomNumbers = generatedNumbers.get(roomId)!;
      if (room.gameMode === 'CLASSIC') {
        roomNumbers.push(parseInt(newNumber));
      } else {
        roomNumbers.push(newNumber);
      }

      // Broadcast number to all players
      io.to(roomId).emit('number_generated', {
        number: newNumber,
        timestamp: new Date()
      });

      console.log(`Number generated in room ${roomId}: ${newNumber}`);
    } catch (error) {
      console.error('Error generating number:', error);
      socket.emit('error', { message: 'Failed to generate number' });
    }
  });

  // Handle challenge bingo call
  socket.on('challenge_bingo', (data: { roomId: string; playerId: string }) => {
    try {
      const { roomId, playerId } = data;
      const room = getRoom(roomId);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      // Only host can challenge
      if (socket.id !== room.hostId) {
        socket.emit('error', { message: 'Only the host can challenge bingo calls' });
        return;
      }

      // Find the challenged player
      const challengedPlayer = room.players.find(p => p.socketId === playerId);
      if (!challengedPlayer) {
        socket.emit('error', { message: 'Player not found in room' });
        return;
      }

      // Broadcast challenge result
      io.to(roomId).emit('bingo_challenged', {
        playerId,
        playerName: challengedPlayer.name,
        reason: 'Bingo call challenged by host',
        timestamp: new Date()
      });

      console.log(`Bingo challenged by host in room ${roomId}: ${challengedPlayer.name}`);
    } catch (error) {
      console.error('Error challenging bingo:', error);
      socket.emit('error', { message: 'Failed to challenge bingo' });
    }
  });

  // Bingo validation function
  function validateBingo(markedCells: number[]): { isValid: boolean; winningLines: number[][] } {
    const markedSet = new Set(markedCells);
    const winningLines: number[][] = [];
    
    // Check rows
    for (let row = 0; row < 5; row++) {
      const rowCells = [];
      for (let col = 0; col < 5; col++) {
        const cellIndex = row * 5 + col;
        if (cellIndex === 12) continue; // Skip center free space
        if (markedSet.has(cellIndex)) {
          rowCells.push(cellIndex);
        }
      }
      if (rowCells.length >= 4) { // Need 4 out of 5 (center is free)
        winningLines.push(rowCells);
      }
    }
    
    // Check columns
    for (let col = 0; col < 5; col++) {
      const colCells = [];
      for (let row = 0; row < 5; row++) {
        const cellIndex = row * 5 + col;
        if (cellIndex === 12) continue; // Skip center free space
        if (markedSet.has(cellIndex)) {
          colCells.push(cellIndex);
        }
      }
      if (colCells.length >= 4) { // Need 4 out of 5 (center is free)
        winningLines.push(colCells);
      }
    }
    
    // Check diagonals
    const diag1 = [0, 6, 12, 18, 24].filter(i => i !== 12 && markedSet.has(i));
    const diag2 = [4, 8, 12, 16, 20].filter(i => i !== 12 && markedSet.has(i));
    
    if (diag1.length >= 4) winningLines.push(diag1);
    if (diag2.length >= 4) winningLines.push(diag2);
    
    return {
      isValid: winningLines.length > 0,
      winningLines
    };
  }

  // Handle disconnection
  socket.on('disconnect', () => {
    try {
      const roomId = socket.data.roomId;
      
      if (roomId) {
        const room = getRoom(roomId);
        if (room) {
          // Remove player from room
          room.players = room.players.filter(p => p.socketId !== socket.id);
          
          if (room.players.length === 0) {
            // No players left, remove room
            removeRoom(roomId);
            console.log(`Room ${roomId} removed (no players)`);
          } else {
            // If host left, transfer host to first remaining player
            if (socket.id === room.hostId && room.players.length > 0) {
              const firstPlayer = room.players[0];
              if (firstPlayer) {
                room.hostId = firstPlayer.socketId;
              }
            }
            
            saveRoom(room);
            
            // Notify remaining players
            io.to(roomId).emit('player_joined', { room });
          }
        }
      }
      
      console.log(`User disconnected: ${socket.id}`);
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Rocket Bingo server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready for connections`);
});