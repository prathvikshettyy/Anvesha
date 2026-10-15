// server/src/realtime/socket.js
//
// Real-time layer for Anvesha, built on Socket.IO. REST endpoints remain the
// source of truth for persistence (see routes/messages.js) — this module
// only pushes live updates (new messages, typing indicators, presence) to
// connected clients so the Messages view doesn't have to poll.

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { getConnectedFriendIds } from '../lib/matching.js';

const JWT_SECRET = process.env.JWT_SECRET || 'sharespot-dev-secret-change-in-production';

let ioInstance = null;
/** userId -> Set<socketId> — tracks how many tabs/devices a user has open. */
const onlineUsers = new Map();

export function initRealtime(httpServer, corsOrigin) {
  ioInstance = new Server(httpServer, {
    cors: { origin: corsOrigin, credentials: true },
  });

  // JWT-authenticated handshake — reuses the same tokens issued by /api/auth.
  ioInstance.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
      socket.data.userId = payload.id;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  ioInstance.on('connection', (socket) => {
    const userId = socket.data.userId;
    socket.join(`user:${userId}`);

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    const wasOffline = onlineUsers.get(userId).size === 0;
    onlineUsers.get(userId).add(socket.id);
    if (wasOffline) broadcastPresence(userId, true);

    // Typing indicator relay — ephemeral, never persisted. Only relay to connected friends.
    socket.on('typing', ({ to }) => {
      if (typeof to === 'string' && to) {
        try {
          const friendIds = getConnectedFriendIds(db, userId);
          if (friendIds.includes(to)) {
            ioInstance.to(`user:${to}`).emit('typing', { from: userId });
          }
        } catch (err) {
          console.error('[Socket] Typing error:', err);
        }
      }
    });

    socket.on('disconnect', () => {
      const sockets = onlineUsers.get(userId);
      if (!sockets) return;
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        broadcastPresence(userId, false);
      }
    });
  });

  return ioInstance;
}

function broadcastPresence(userId, online) {
  if (!ioInstance) return;
  const friendIds = getConnectedFriendIds(db, userId);
  for (const friendId of friendIds) {
    ioInstance.to(`user:${friendId}`).emit('presence:update', { userId, online });
  }
}

/** Push an event to every open tab/device for a given user. No-op if sockets aren't running or the user is offline. */
export function emitToUser(userId, event, payload) {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
}

/** Push an event to a user and all their accepted connections. */
export function emitToConnections(userId, event, payload) {
  if (!ioInstance) return;
  ioInstance.to(`user:${userId}`).emit(event, payload);
  try {
    const friendIds = getConnectedFriendIds(db, userId);
    for (const friendId of friendIds) {
      ioInstance.to(`user:${friendId}`).emit(event, payload);
    }
  } catch (err) {
    console.error('[Socket] emitToConnections error:', err);
  }
}

/** Broadcast an event to all connected clients across the entire app. */
export function broadcastRealtime(event, payload) {
  if (!ioInstance) return;
  ioInstance.emit(event, payload);
}

export function isOnline(userId) {
  return onlineUsers.has(userId);
}
