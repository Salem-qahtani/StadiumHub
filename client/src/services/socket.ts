import { io, type Socket } from "socket.io-client";

// Module-level singleton. The module is evaluated once, so React 19 StrictMode's
// double mount/unmount reuses the same connection instead of opening a second one.
let socket: Socket | null = null;

// Socket connects to the server origin — the same VITE_API_URL used by the REST
// layer, minus the trailing /api path (falls back to local dev).
const SOCKET_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3000/api")
  .trim()
  .replace(/\/api\/?$/, "");

// Lazily connect (once) using the same JWT the REST layer uses. The server
// authenticates the handshake via socket.handshake.auth.token.
export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      // Callback form so the token is re-read from localStorage on every
      // connection attempt, including automatic reconnects (not frozen once).
      auth: (cb) => cb({ token: localStorage.getItem("token") ?? "" }),
    });
  }
  return socket;
}

// Tear the socket down on logout so a stale connection with an old JWT can't
// survive into a different session.
export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
