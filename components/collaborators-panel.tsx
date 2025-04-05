"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCollaborationContext } from "@/context/collaboration-context";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

interface CollaboratorsPanelProps {
  documentId: string;
}

export default function CollaboratorsPanel({
  documentId,
}: CollaboratorsPanelProps) {
  const { user } = useUser();
  const { activeUsers, joinDocument, leaveDocument, isConnected } =
    useCollaborationContext();

  useEffect(() => {
    // Join the document room when component mounts
    console.log("CollaboratorsPanel: Joining document:", documentId);

    // Only join if connected
    if (isConnected) {
      joinDocument(documentId);
    }

    return () => {
      // Leave the document room when component unmounts
      console.log("CollaboratorsPanel: Leaving document:", documentId);
      leaveDocument();
    };
  }, [documentId, joinDocument, leaveDocument, isConnected]);

  // Join document when connection is established
  useEffect(() => {
    if (isConnected) {
      joinDocument(documentId);
    }
  }, [isConnected, documentId, joinDocument]);

  return (
    <div className="w-64 border-l p-4 hidden md:block">
      <h3 className="font-medium mb-4">Who's editing</h3>
      <div className="space-y-3">
        {activeUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Only you are editing</p>
        ) : (
          activeUsers.map((activeUser) => (
            <div key={activeUser.id} className="flex items-center space-x-2">
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={activeUser.image} alt={activeUser.name} />
                  <AvatarFallback>{activeUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
              </div>
              <div className="text-sm">
                <p className="font-medium">
                  {activeUser.id === user?.id ? "You" : activeUser.name}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 text-xs text-muted-foreground">
        Connection status: {isConnected ? "Connected" : "Disconnected"}
      </div>
    </div>
  );
}
