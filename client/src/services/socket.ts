// client/src/services/socket.ts
import { io, Socket } from 'socket.io-client';
import { 
  Room, 
  CreateRoomData, 
  JoinRoomData, 
  StartGameData, 
  MarkCellData, 
  CallBingoData 
} from '../../../shared/types';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  // Connect to the Socket.io server
  connect(serverUrl: string = 'http://localhost:3001'): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket?.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.isConnected = false;
    });
  }

  // Disconnect from the server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Get current socket instance
  getSocket(): Socket | null {
    return this.socket;
  }

  // Check if connected
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Room management methods
  createRoom(data: CreateRoomData): void {
    if (this.socket) {
      this.socket.emit('create_room', data);
    }
  }

  joinRoom(data: JoinRoomData): void {
    if (this.socket) {
      this.socket.emit('join_room', data);
    }
  }

  startGame(data: StartGameData): void {
    if (this.socket) {
      this.socket.emit('start_game', data);
    }
  }

  markCell(data: MarkCellData): void {
    if (this.socket) {
      this.socket.emit('mark_cell', data);
    }
  }

  callBingo(data: CallBingoData): void {
    if (this.socket) {
      this.socket.emit('call_bingo', data);
    }
  }

  // Event listeners
  onRoomCreated(callback: (data: { roomId: string; room: Room }) => void): void {
    this.socket?.on('room_created', callback);
  }

  onRoomJoined(callback: (data: { room: Room; success: boolean; message?: string }) => void): void {
    this.socket?.on('room_joined', callback);
  }

  onGameStarted(callback: (data: { room: Room }) => void): void {
    this.socket?.on('game_started', callback);
  }

  onPlayerJoined(callback: (data: { room: Room }) => void): void {
    this.socket?.on('player_joined', callback);
  }

  onGameStateUpdate(callback: (data: { room: Room; markedCell?: { playerId: string; cellIndex: number } }) => void): void {
    this.socket?.on('game_state_update', callback);
  }

  onBingoCalled(callback: (data: { roomId: string; playerId: string; winningCells: number[] }) => void): void {
    this.socket?.on('bingo_called', callback);
  }

  onError(callback: (data: { message: string }) => void): void {
    this.socket?.on('error', callback);
  }

  // Remove event listeners
  offRoomCreated(callback?: (data: { roomId: string; room: Room }) => void): void {
    this.socket?.off('room_created', callback);
  }

  offRoomJoined(callback?: (data: { room: Room; success: boolean; message?: string }) => void): void {
    this.socket?.off('room_joined', callback);
  }

  offGameStarted(callback?: (data: { room: Room }) => void): void {
    this.socket?.off('game_started', callback);
  }

  offPlayerJoined(callback?: (data: { room: Room }) => void): void {
    this.socket?.off('player_joined', callback);
  }

  offGameStateUpdate(callback?: (data: { room: Room; markedCell?: { playerId: string; cellIndex: number } }) => void): void {
    this.socket?.off('game_state_update', callback);
  }

  offBingoCalled(callback?: (data: { roomId: string; playerId: string; winningCells: number[] }) => void): void {
    this.socket?.off('bingo_called', callback);
  }

  offError(callback?: (data: { message: string }) => void): void {
    this.socket?.off('error', callback);
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;