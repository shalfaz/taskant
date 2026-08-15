import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/auth.js';
import { config } from '../config/index.js';
import { memoryDb } from '../db/memoryStore.js';
import { createNotification } from '../services/notifications.js';

const onlineUsers = new Map<string, string>();

export function setupSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: config.clientUrl, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    const decoded = verifyToken(token);
    if (!decoded) return next(new Error('Invalid token'));
    socket.data.userId = decoded.id;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    onlineUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);
    io.emit('user_online', { userId });

    socket.on('join_task', (taskId: string) => {
      const task = memoryDb.tasks.findById(taskId);
      if (task && (task.posterId === userId || task.workerId === userId)) {
        socket.join(`task:${taskId}`);
      }
    });

    socket.on('send_message', (data: { taskId: string; content: string }) => {
      const task = memoryDb.tasks.findById(data.taskId);
      if (!task) return;
      if (task.posterId !== userId && task.workerId !== userId) return;
      const receiverId = task.posterId === userId ? task.workerId! : task.posterId;
      const message = memoryDb.messages.create({
        taskId: data.taskId,
        senderId: userId,
        receiverId,
        content: data.content,
        read: false,
      });
      const sender = memoryDb.users.findById(userId);
      io.to(`task:${data.taskId}`).emit('new_message', {
        ...message,
        sender: sender ? { _id: sender._id, fullName: sender.fullName, profilePhoto: sender.profilePhoto } : null,
      });
      createNotification({
        userId: receiverId,
        type: 'new_message',
        title: 'New Message',
        message: `${sender?.fullName} sent you a message`,
        link: `/chat/${data.taskId}`,
      });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user_offline', { userId });
    });
  });

  return io;
}

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId);
}
