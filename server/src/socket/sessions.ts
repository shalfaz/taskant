import type { Socket } from 'socket.io';

const socketsByUser = new Map<string, Set<Socket>>();

export function registerUserSocket(userId: string, socket: Socket): void {
  let sockets = socketsByUser.get(userId);
  if (!sockets) {
    sockets = new Set();
    socketsByUser.set(userId, sockets);
  }
  sockets.add(socket);

  socket.once('disconnect', () => {
    sockets?.delete(socket);
    if (sockets?.size === 0) socketsByUser.delete(userId);
  });
}

export function disconnectUserSockets(userId: string): void {
  for (const socket of socketsByUser.get(userId) ?? []) {
    socket.disconnect(true);
  }
}
