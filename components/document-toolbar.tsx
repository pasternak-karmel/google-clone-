"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useUser } from "@clerk/nextjs";
import { Clock, MoreVertical, Share } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import ShareDocumentDialog from "./share-document-dialog";
import VersionHistoryDialog from "./version-history-dialog";

interface Document {
  id: string;
  title: string;
  userId: string;
  collaborators: string[];
}

interface DocumentToolbarProps {
  document: Document;
}

export default function DocumentToolbar({ document }: DocumentToolbarProps) {
  const { user } = useUser();
  const [title, setTitle] = useState(document.title);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const router = useRouter();

  const isOwner = user?.id === document.userId;

  const updateTitle = async () => {
    if (title === document.title) {
      setIsRenaming(false);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) throw new Error("Failed to update title");

      toast.success("Document title updated");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update title");
      setTitle(document.title);
    } finally {
      setIsSaving(false);
      setIsRenaming(false);
    }
  };

  return (
    <div className="border-b">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center space-x-4">
          {isRenaming ? (
            <div className="flex items-center space-x-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 w-[200px]"
                onBlur={updateTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateTitle();
                  } else if (e.key === "Escape") {
                    setTitle(document.title);
                    setIsRenaming(false);
                  }
                }}
                autoFocus
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTitle(document.title);
                  setIsRenaming(false);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={updateTitle} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          ) : (
            <h2
              className="text-lg font-medium truncate cursor-pointer hover:underline"
              onClick={() => isOwner && setIsRenaming(true)}
              title={isOwner ? "Click to rename" : document.title}
            >
              {document.title}
            </h2>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVersionHistoryOpen(true)}
          >
            <Clock className="mr-2 h-4 w-4" />
            Version history
          </Button>

          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsShareDialogOpen(true)}
            >
              <Share className="mr-2 h-4 w-4" />
              Share
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.print()}>
                Print
              </DropdownMenuItem>
              <DropdownMenuItem>Download</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => router.push("/")}
              >
                Close
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <VersionHistoryDialog
        documentId={document.id}
        isOpen={isVersionHistoryOpen}
        onOpenChange={setIsVersionHistoryOpen}
      />

      <ShareDocumentDialog
        documentId={document.id}
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
      />
    </div>
  );
}
