"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface CollaborationContextType {
  socket: Socket | null;
  activeUsers: User[];
  isConnected: boolean;
  joinDocument: (documentId: string) => void;
  leaveDocument: () => void;
  sendDocumentChange: (documentId: string, changes: any) => void;
  collaborativeEditing: boolean;
}

const CollaborationContext = createContext<
  CollaborationContextType | undefined
>(undefined);

export function CollaborationProvider({ children }: { children: ReactNode }) {
  const { userId, sessionId, getToken } = useAuth();

  const { user } = useUser();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [collaborativeEditing, setCollaborativeEditing] = useState(true);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(
    null
  );

  // Use refs to prevent multiple socket initializations
  const socketInitializedRef = useRef(false);
  const currentSocketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Only initialize socket once
    if (socketInitializedRef.current || currentSocketRef.current) {
      return;
    }

    socketInitializedRef.current = true;

    const initializeSocket = async () => {
      try {
        console.log("Initializing socket connection...");

        // Create user info object to send with connection
        const userInfo =
          userId && user
            ? {
                id: userId,
                name: user.firstName || "Anonymous",
                email: user.emailAddresses[0]?.emailAddress || "",
                image: user.imageUrl || "",
              }
            : {
                id: "anonymous-" + Math.random().toString(36).substring(2, 9),
                name: "Anonymous User",
                email: "anonymous@example.com",
                image: "",
              };

        // Get auth token from Clerk if available
        const token = userId ? await getToken() : "anonymous-token";

        // Initialize Socket.IO connection with auth
        // Connect to the standalone Socket.IO server
        const socketInstance = io("http://localhost:3001", {
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          // Increase timeout to prevent frequent reconnects
          timeout: 20000,
          transports: ["websocket", "polling"],
          auth: {
            token,
            user: userInfo,
          },
        });

        socketInstance.on("connect", () => {
          console.log(
            "Connected to WebSocket server with ID:",
            socketInstance.id
          );
          setIsConnected(true);

          // Rejoin document if we were in one before reconnecting
          if (currentDocumentId) {
            console.log(
              "Rejoining document after reconnect:",
              currentDocumentId
            );
            socketInstance.emit("join-document", currentDocumentId);
          }
        });

        socketInstance.on("connect_error", (error) => {
          console.error("Connection error:", error.message);
        });

        socketInstance.on("disconnect", (reason) => {
          console.log("Disconnected from WebSocket server:", reason);
          setIsConnected(false);
          // Don't clear active users on disconnect to prevent UI flashing
        });

        socketInstance.on("error", (error) => {
          console.error("WebSocket error:", error);
        });

        socketInstance.on("active-users", (users) => {
          console.log("Active users received:", users);
          setActiveUsers(users);
        });

        socketInstance.on("user-joined", (user) => {
          console.log("User joined:", user);
          setActiveUsers((prev) => {
            if (!prev.some((u) => u.id === user.id)) {
              return [...prev, user];
            }
            return prev;
          });
        });

        socketInstance.on("user-left", (user) => {
          console.log("User left:", user);
          setActiveUsers((prev) => prev.filter((u) => u.id !== user.id));
        });

        socketInstance.on("document-changed", (data) => {
          console.log("Document changed event received:", data);
          // This event will be handled by the document editor component
        });

        setSocket(socketInstance);
        currentSocketRef.current = socketInstance;

        return () => {
          console.log("Cleaning up socket connection");
          socketInstance.disconnect();
          currentSocketRef.current = null;
          socketInitializedRef.current = false;
        };
      } catch (error) {
        console.error("Failed to initialize socket:", error);
        socketInitializedRef.current = false;
      }
    };

    initializeSocket();

    return () => {
      if (currentSocketRef.current) {
        console.log("Disconnecting socket on cleanup");
        currentSocketRef.current.disconnect();
        currentSocketRef.current = null;
        socketInitializedRef.current = false;
      }
    };
  }, [userId, sessionId, getToken, user]);

  const joinDocument = (documentId: string) => {
    if (socket && isConnected) {
      // Only join if we're not already in this document
      if (currentDocumentId !== documentId) {
        console.log("Joining document:", documentId);
        socket.emit("join-document", documentId);
        setCurrentDocumentId(documentId);
      } else {
        console.log("Already in document:", documentId);
      }
    } else {
      console.warn("Cannot join document: socket not connected");
    }
  };

  const leaveDocument = () => {
    if (socket && isConnected && currentDocumentId) {
      console.log("Leaving document:", currentDocumentId);
      socket.emit("leave-document");
      setCurrentDocumentId(null);
    }
  };

  const sendDocumentChange = (documentId: string, changes: any) => {
    if (socket && isConnected && collaborativeEditing) {
      console.log("Sending document change to document:", documentId);
      socket.emit("document-change", { documentId, changes });
    } else {
      console.warn(
        "Cannot send document change: socket connected:",
        isConnected,
        "collaborative editing:",
        collaborativeEditing
      );
    }
  };

  return (
    <CollaborationContext.Provider
      value={{
        socket,
        activeUsers,
        isConnected,
        joinDocument,
        leaveDocument,
        sendDocumentChange,
        collaborativeEditing,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaborationContext() {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error(
      "useCollaborationContext must be used within a CollaborationProvider"
    );
  }
  return context;
}
