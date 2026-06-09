import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "./config/env.js";
import { Notification } from "./models/Notification.js";

// Map userId (string) -> Set of socketIds
const userSocketMap = new Map();

let io;

export function initSocket(httpServer) {
  const allowedOrigins = String(env.CORS_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        // Allow localhost in development
        if (
          env.NODE_ENV !== "production" &&
          /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)
        ) {
          return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    },
  });

  // JWT authentication middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error: no token"));
    try {
      const payload = jwt.verify(token, env.JWT_SECRET);
      socket.userId = String(payload.id || payload.sub);
      next();
    } catch {
      next(new Error("Authentication error: invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;

    // Register socket
    if (!userSocketMap.has(userId)) {
      userSocketMap.set(userId, new Set());
    }
    userSocketMap.get(userId).add(socket.id);

    // Allow client to join a room (e.g., a file-specific chat room)
    socket.on("join_room", (room) => {
      socket.join(room);
    });

    socket.on("leave_room", (room) => {
      socket.leave(room);
    });

    socket.on("disconnect", () => {
      const sockets = userSocketMap.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSocketMap.delete(userId);
      }
    });
  });

  return io;
}

/**
 * Emit a real-time event to a specific user (all their open tabs/devices).
 */
export function emitToUser(userId, event, payload) {
  if (!io) return;
  const sockets = userSocketMap.get(String(userId));
  if (sockets) {
    for (const socketId of sockets) {
      io.to(socketId).emit(event, payload);
    }
  }
}

/**
 * Emit a real-time event to all sockets in a named room.
 */
export function emitToRoom(room, event, payload) {
  if (!io) return;
  io.to(room).emit(event, payload);
}

/**
 * Create a notification in the DB and push it to the user in real-time.
 * @param {string} userId - The recipient user's ID
 * @param {string} title - Short notification title
 * @param {string} message - Notification body text
 * @param {object} [opts] - Optional extra fields: type, relatedFileId, link
 */
export async function createNotification(userId, title, message, opts = {}) {
  try {
    const notification = await Notification.create({
      user: userId,
      title,
      message,
      type: opts.type || "system",
      isRead: false,
      relatedFileId: opts.relatedFileId || undefined,
      link: opts.link || undefined,
    });
    emitToUser(String(userId), "new_notification", {
      _id: notification._id,
      title,
      message,
      type: notification.type,
      relatedFileId: opts.relatedFileId,
      link: opts.link,
      createdAt: notification.createdAt,
      isRead: false,
    });
    return notification;
  } catch (err) {
    console.error("[Socket] createNotification failed:", err.message);
  }
}
