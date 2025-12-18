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
  socket.on('create_room', (data: { playerName: string; gameMode?: 'CLASSIC' | 'BUSINESS' }) => {
    try {
      const { playerName, gameMode = 'CLASSIC' } = data;
      
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

  // Handle cell marking (visual only for now)
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

  // Handle bingo call
  socket.on('call_bingo', (data: { roomId: string }) => {
    try {
      const { roomId } = data;
      const room = getRoom(roomId);

      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }

      if (room.gameState !== 'started') {
        socket.emit('error', { message: 'Game not in progress' });
        return;
      }

      // TODO: In a real implementation, we would validate the actual board state
      // For now, we'll just broadcast the bingo call
      io.to(roomId).emit('bingo_called', { 
        roomId, 
        playerId: socket.id, 
        winningCells: [] // TODO: calculate actual winning cells
      });

      console.log(`Bingo called by ${socket.id} in room ${roomId}`);
    } catch (error) {
      console.error('Error calling bingo:', error);
      socket.emit('error', { message: 'Failed to call bingo' });
    }
  });

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