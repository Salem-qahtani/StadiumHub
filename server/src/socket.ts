import { Server } from "socket.io";
import type { Server as HttpServer } from "http";

let io: Server;

function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.FRONTEND_URL! },
  });
  return io;
}
function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

export { initSocket, getIO };
