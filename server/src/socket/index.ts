import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/auth';
import { config } from '../config/index';
import { findRecord, insertRecord } from '../db/records';
import { Message } from '../models/index';
import type { IMessage, ITask, IUser } from '../types/index';
import { Task, User } from '../models/index';
import { createNotification } from '../services/notifications';
import { registerUserSocket } from './sessions';

const onlineUsers = new Map<string, string>();

export function setupSocket(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: { origin: config.clientUrl, credentials: true },
  });

  io.use((socket, next) => {
    const token: unknown = socket.handshake.auth.token;
    if (typeof token !== 'string' || !token) {
      next(new Error('Authentication required'));
      return;
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      next(new Error('Invalid token'));
      return;
    }
    void findRecord<IUser>(User, decoded.id)
      .then((user) => {
        if (
          !user ||
          user.isSuspended ||
          decoded.tokenVersion !== (user.tokenVersion ?? 0)
        ) {
          next(new Error('Invalid session'));
          return;
        }
        socket.data.userId = decoded.id;
        socket.data.tokenVersion = decoded.tokenVersion;
        next();
      })
      .catch(() => next(new Error('Authentication unavailable')));
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    const tokenVersion = socket.data.tokenVersion as number;
    registerUserSocket(userId, socket);
    onlineUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);
    io.emit('user_online', { userId });

    socket.use((_packet, next) => {
      const decoded = verifyToken(socket.handshake.auth.token);
      if (
        !decoded ||
        decoded.id !== userId ||
        decoded.tokenVersion !== tokenVersion
      ) {
        socket.disconnect(true);
        next(new Error('Invalid session'));
        return;
      }
      void findRecord<IUser>(User, userId)
        .then((user) => {
          if (
            !user ||
            user.isSuspended ||
            (user.tokenVersion ?? 0) !== tokenVersion
          ) {
            socket.disconnect(true);
            next(new Error('Invalid session'));
            return;
          }
          next();
        })
        .catch(() => {
          socket.disconnect(true);
          next(new Error('Authentication unavailable'));
        });
    });

    socket.on('join_task', (taskId: string) => {
      void findRecord<ITask>(Task, taskId).then((task) => {
        if (task && (task.posterId === userId || task.workerId === userId)) {
          socket.join(`task:${taskId}`);
        }
      }).catch(() => undefined);
    });

    socket.on('send_message', (data: { taskId: string; content: string }) => {
      void (async () => {
        const task = await findRecord<ITask>(Task, data.taskId);
        if (!task || (task.posterId !== userId && task.workerId !== userId)) return;
        const receiverId = task.posterId === userId ? task.workerId : task.posterId;
        if (!receiverId) return;
        const [message, sender] = await Promise.all([
          insertRecord<IMessage>(Message, {
            taskId: data.taskId,
            senderId: userId,
            receiverId,
            content: data.content,
            read: false,
          }),
          findRecord<IUser>(User, userId),
        ]);
        io.to(`task:${data.taskId}`).emit('new_message', {
          ...message,
          sender: sender ? { _id: sender._id, fullName: sender.fullName, profilePhoto: sender.profilePhoto } : null,
        });
        await createNotification({
          userId: receiverId,
          type: 'new_message',
          title: 'New Message',
          message: `${sender?.fullName || 'Someone'} sent you a message`,
          link: `/chat/${data.taskId}`,
        });
      })().catch(() => undefined);
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
