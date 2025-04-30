"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useAuth, useUser } from "@clerk/nextjs";
import {
  createContext,
  useCallback,
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
  toggleCollaborativeEditing: () => void;
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

  const socketInitializedRef = useRef(false);
  const currentSocketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (socketInitializedRef.current || currentSocketRef.current) {
      return;
    }

    socketInitializedRef.current = true;

    const initializeSocket = async () => {
      try {
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

        const token = userId ? await getToken() : "anonymous-token";

        const socketUrl =
          process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
        const socketInstance = io(socketUrl, {
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000,
          transports: ["websocket", "polling"],
          auth: {
            token,
            user: userInfo,
          },
        });

        socketInstance.on("connect", () => {
          setIsConnected(true);

          if (currentDocumentId) {
            socketInstance.emit("join-document", currentDocumentId);
          }
        });

        socketInstance.on("connect_error", () => {});

        socketInstance.on("disconnect", () => {
          setIsConnected(false);
        });

        socketInstance.on("error", () => {});

        socketInstance.on("active-users", (users) => {
          setActiveUsers(users);
        });

        socketInstance.on("user-joined", (user) => {
          setActiveUsers((prev) => {
            if (!prev.some((u) => u.id === user.id)) {
              return [...prev, user];
            }
            return prev;
          });
        });

        socketInstance.on("user-left", (user) => {
          setActiveUsers((prev) => prev.filter((u) => u.id !== user.id));
        });

        socketInstance.on("document-changed", () => {});

        setSocket(socketInstance);
        currentSocketRef.current = socketInstance;

        return () => {
          socketInstance.disconnect();
          currentSocketRef.current = null;
          socketInitializedRef.current = false;
        };
      } catch {
        socketInitializedRef.current = false;
      }
    };

    initializeSocket();

    return () => {
      if (currentSocketRef.current) {
        currentSocketRef.current.disconnect();
        currentSocketRef.current = null;
        socketInitializedRef.current = false;
      }
    };
  }, [userId, sessionId, getToken, user]);

  const joinDocument = (documentId: string) => {
    if (socket && isConnected) {
      if (currentDocumentId !== documentId) {
        socket.emit("join-document", documentId);
        setCurrentDocumentId(documentId);
      } else {
      }
    } else {
    }
  };

  const leaveDocument = () => {
    if (socket && isConnected && currentDocumentId) {
      socket.emit("leave-document");
      setCurrentDocumentId(null);
    }
  };

  const sendDocumentChange = (documentId: string, changes: any) => {
    if (socket && isConnected && collaborativeEditing) {
      socket.emit("document-change", { documentId, changes });
    } else {
    }
  };

  const toggleCollaborativeEditing = useCallback(() => {
    setCollaborativeEditing((prev) => !prev);
  }, []);

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
        toggleCollaborativeEditing,
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
