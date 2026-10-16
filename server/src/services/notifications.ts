import { Notification } from '../models/index';
import { insertRecord } from '../db/records';
import type { INotification } from '../types/index';
import type { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

export function setSocketServer(server: SocketServer): void {
  io = server;
}

export function createNotification(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
}): Promise<void> {
  return insertRecord<INotification>(Notification, {
    userId: data.userId,
    type: data.type,
    title: data.title,
    message: data.message,
    link: data.link,
    read: false,
  }).then((notification) => {
    io?.to(`user:${data.userId}`).emit('notification', notification);
  });
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  io?.to(`user:${userId}`).emit(event, data);
}

export function emitToTask(taskId: string, event: string, data: unknown): void {
  io?.to(`task:${taskId}`).emit(event, data);
}
