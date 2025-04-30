import { createServer } from "http";
import { Server } from "socket.io";

const documentUsers = new Map<string, Map<string, any>>();

const userInfo = new Map<string, any>();

const socketToUser = new Map<string, string>();

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Socket.IO server is running");
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      socket.data = { userId: `anonymous-${socket.id}` };
      return next();
    }

    socket.data = { userId: token };
    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data?.userId || `anonymous-${socket.id}`;

  socketToUser.set(socket.id, userId);

  if (socket.handshake.auth.user) {
    userInfo.set(userId, socket.handshake.auth.user);
  } else {
    const fakeUser = {
      id: userId,
      name: `User ${socket.id.substring(0, 4)}`,
      email: `user-${socket.id.substring(0, 4)}@example.com`,
    };
    userInfo.set(userId, fakeUser);
  }

  socket.on("join-document", (documentId) => {
    if (socket.data.currentDocument) {
      leaveDocument(socket, socket.data.currentDocument);
    }

    socket.join(documentId);
    socket.data.currentDocument = documentId;

    if (!documentUsers.has(documentId)) {
      documentUsers.set(documentId, new Map());
    }

    documentUsers.get(documentId)!.set(userId, socket.id);

    socket.to(documentId).emit("user-joined", {
      id: userId,
      ...userInfo.get(userId),
    });

    const activeUsers = Array.from(documentUsers.get(documentId)!.keys()).map(
      (uid) => ({
        id: uid,
        ...userInfo.get(uid),
      })
    );

    socket.emit("active-users", activeUsers);
  });

  socket.on("leave-document", () => {
    if (socket.data.currentDocument) {
      leaveDocument(socket, socket.data.currentDocument);
    }
  });

  function leaveDocument(socket: any, documentId: string) {
    console.log(`User ${userId} left document ${documentId}`);

    socket.leave(documentId);

    const docUsers = documentUsers.get(documentId);
    if (docUsers) {
      if (docUsers.get(userId) === socket.id) {
        docUsers.delete(userId);

        socket.to(documentId).emit("user-left", {
          id: userId,
          ...userInfo.get(userId),
        });

        if (docUsers.size === 0) {
          documentUsers.delete(documentId);
        }
      }
    }

    socket.data.currentDocument = null;
  }

  socket.on("document-change", ({ documentId, changes }) => {
    socket.to(documentId).emit("document-changed", {
      userId: userId,
      changes,
    });
  });

  socket.on("disconnect", () => {
    if (socket.data?.currentDocument) {
      leaveDocument(socket, socket.data.currentDocument);
    }

    socketToUser.delete(socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on http://localhost:${PORT}`);
});
