/**
 * client/src/services/socket.js
 *
 * Singleton Socket.IO client for Anvesha.
 *
 * Usage:
 *   import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
 *
 *   // After auth token is available:
 *   connectSocket(token);
 *
 *   // In components:
 *   const socket = getSocket();
 *   socket?.on('message:new', handler);
 *
 *   // On logout:
 *   disconnectSocket();
 */

import { io } from 'socket.io-client';

// In dev the Vite proxy (/socket.io → http://localhost:3001 with ws:true)
// transparently upgrades the WebSocket connection to the Express server,
// so we can always point at the current origin.
const SERVER_URL = import.meta.env.VITE_SOCKET_URL ?? window.location.origin;

let socket = null;

/**
 * Open (or re-open) an authenticated Socket.IO connection.
 * Safe to call multiple times — re-uses the same socket if already connected.
 * @param {string} jwtToken – JWT returned by /api/auth/login or /api/auth/register
 */
export function connectSocket(jwtToken) {
  if (socket?.connected) return socket;

  socket = io(SERVER_URL, {
    path: '/socket.io',
    auth: { token: jwtToken },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1500,
  });

  socket.on('connect', () => {
    console.debug('[Socket] Connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.debug('[Socket] Disconnected:', reason);
  });

  return socket;
}

/** Close the socket and clear the singleton reference. */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/** Return the current socket instance (may be null if not connected). */
export function getSocket() {
  return socket;
}
