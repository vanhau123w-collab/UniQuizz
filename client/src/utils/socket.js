// utils/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

let socket = null;

export const initSocket = (token = null) => {
  // Nếu đã có socket connected, reuse nó
  if (socket?.connected) {
    console.log('♻️ Reusing existing socket:', socket.id);
    return socket;
  }

  // Nếu có socket nhưng disconnected, disconnect hoàn toàn
  if (socket && !socket.connected) {
    console.log('🔌 Cleaning up disconnected socket');
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  console.log('🔌 Creating new socket connection to:', SOCKET_URL);

  socket = io(SOCKET_URL, {
    auth: {
      token: token || 'guest'
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    autoConnect: true
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
    if (reason === 'io server disconnect') {
      // Server disconnected, try to reconnect
      socket.connect();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket chưa được khởi tạo. Gọi initSocket() trước.');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  initSocket,
  getSocket,
  disconnectSocket
};
