import { io } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ||
  window.location.origin;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket'],
});