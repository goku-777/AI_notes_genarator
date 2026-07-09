import { Server } from 'socket.io';

let io: Server;

export const setSocketIO = (socketServer: Server): void => {
  io = socketServer;
};

export const getSocketIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized.');
  }

  return io;
};