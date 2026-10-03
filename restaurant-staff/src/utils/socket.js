import { io } from 'socket.io-client';
import { BASE_URL } from '../api/staffApi';

let socket = null;

export const getStaffSocket = () => {
  if (!socket) {
    socket = io(BASE_URL, {
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('⚡ [Staff WebSocket]: Connected to Chronicle Server', socket.id);
      socket.emit('join_room', 'staff');
      socket.emit('join_room', 'kitchen');
      socket.emit('join_room', 'cashier');
    });

    socket.on('disconnect', () => {
      console.log('🔌 [Staff WebSocket]: Disconnected');
    });
  }
  return socket;
};

export default getStaffSocket;
