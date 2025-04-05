import { createServer } from "http";
import { Server } from "socket.io";

// Active users in each document
const documentUsers = new Map<string, Map<string, any>>();

// User information cache
const userInfo = new Map<string, any>();

// Socket ID to user ID mapping
const socketToUser = new Map<string, string>();

// Create a standalone HTTP server
const server = createServer((req, res) => {
  // This is just a basic handler for HTTP requests
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Socket.IO server is running");
});

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
  // Increase ping timeout to prevent frequent disconnects
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Socket.IO middleware for authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      console.log("No token provided, allowing connection anyway for testing");
      socket.data = { userId: `anonymous-${socket.id}` };
      return next();
    }

    // In a real implementation, you would verify the token with Clerk
    // For now, we'll just accept any token
    socket.data = { userId: token };
    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    next(new Error("Authentication error"));
  }
});

// Socket.IO connection handler
io.on("connection", (socket) => {
  const userId = socket.data?.userId || `anonymous-${socket.id}`;
  console.log(`User connected: ${userId}`);
  console.log(`Socket ID: ${socket.id}`);

  // Store the socket to user mapping
  socketToUser.set(socket.id, userId);

  // Store user info when they connect
  if (socket.handshake.auth.user) {
    userInfo.set(userId, socket.handshake.auth.user);
    console.log(`User info stored for ${userId}:`, socket.handshake.auth.user);
  } else {
    // For testing, create a fake user if none provided
    const fakeUser = {
      id: userId,
      name: `User ${socket.id.substring(0, 4)}`,
      email: `user-${socket.id.substring(0, 4)}@example.com`,
    };
    userInfo.set(userId, fakeUser);
    console.log("Created fake user for testing:", fakeUser);
  }

  // Handle joining a document
  socket.on("join-document", (documentId) => {
    console.log(`User ${userId} joined document ${documentId}`);

    // Leave any previous document
    if (socket.data.currentDocument) {
      leaveDocument(socket, socket.data.currentDocument);
    }

    // Join the new document room
    socket.join(documentId);
    socket.data.currentDocument = documentId;

    // Add user to document's active users
    if (!documentUsers.has(documentId)) {
      documentUsers.set(documentId, new Map());
    }

    // Store socket ID with user to handle multiple connections from same user
    documentUsers.get(documentId)!.set(userId, socket.id);

    // Notify other users that this user has joined
    socket.to(documentId).emit("user-joined", {
      id: userId,
      ...userInfo.get(userId),
    });

    // Send the list of active users to the newly joined user
    const activeUsers = Array.from(documentUsers.get(documentId)!.keys()).map(
      (uid) => ({
        id: uid,
        ...userInfo.get(uid),
      })
    );

    socket.emit("active-users", activeUsers);

    // Log all users in this document
    console.log(
      `Users in document ${documentId}:`,
      Array.from(documentUsers.get(documentId)!.keys()).map(
        (id) => userInfo.get(id)?.name || id
      )
    );
  });

  // Handle leaving a document
  socket.on("leave-document", () => {
    if (socket.data.currentDocument) {
      leaveDocument(socket, socket.data.currentDocument);
    }
  });

  // Helper function to handle leaving a document
  function leaveDocument(socket: any, documentId: string) {
    console.log(`User ${userId} left document ${documentId}`);

    socket.leave(documentId);

    // Remove user from document's active users
    const docUsers = documentUsers.get(documentId);
    if (docUsers) {
      // Only remove if this is the socket that joined for this user
      if (docUsers.get(userId) === socket.id) {
        docUsers.delete(userId);

        // Notify other users that this user has left
        socket.to(documentId).emit("user-left", {
          id: userId,
          ...userInfo.get(userId),
        });

        // If no users left in the document, clean up
        if (docUsers.size === 0) {
          documentUsers.delete(documentId);
        }
      }
    }

    socket.data.currentDocument = null;
  }

  // Handle document changes
  socket.on("document-change", ({ documentId, changes }) => {
    console.log(`User ${userId} sent changes to document ${documentId}`);
    console.log(
      `Room members count: ${
        io.sockets.adapter.rooms.get(documentId)?.size || 0
      }`
    );

    // Broadcast changes to all other users in the document
    socket.to(documentId).emit("document-changed", {
      userId: userId,
      changes,
    });

    // Log that we're broadcasting to the room
    console.log(`Broadcasting changes to room ${documentId}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${userId}`);

    // Remove user from any document they were in
    if (socket.data?.currentDocument) {
      leaveDocument(socket, socket.data.currentDocument);
    }

    // Clean up socket to user mapping
    socketToUser.delete(socket.id);

    // Don't clean up user info as they might have other connections
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on http://localhost:${PORT}`);
});
