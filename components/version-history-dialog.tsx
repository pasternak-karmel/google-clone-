"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface Version {
  id: string;
  createdAt: string;
  userId: string;
  userName: string;
}

interface VersionHistoryDialogProps {
  documentId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VersionHistoryDialog({
  documentId,
  isOpen,
  onOpenChange,
}: VersionHistoryDialogProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReverting, setIsReverting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, documentId]);

  const fetchVersions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/versions`);
      if (!response.ok) throw new Error("Failed to fetch versions");

      const data = await response.json();
      setVersions(data);
    } catch (error) {
      toast.error("Failed to load version history");
    } finally {
      setIsLoading(false);
    }
  };

  const revertToVersion = async (versionId: string) => {
    setIsReverting(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ versionId }),
      });

      if (!response.ok) throw new Error("Failed to revert to version");

      toast.success("Document reverted to selected version");

      onOpenChange(false);
      window.location.reload();
    } catch (error) {
      toast.error("Failed to revert to version");
    } finally {
      setIsReverting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-6 text-center">Loading version history...</div>
        ) : versions.length === 0 ? (
          <div className="py-6 text-center">No version history available</div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            <div className="space-y-4">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{version.userName}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(version.createdAt), "PPpp")}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => revertToVersion(version.id)}
                    disabled={isReverting}
                  >
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
