"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCollaborationContext } from "@/context/collaboration-context";
import { useTheme } from "next-themes";
import { useState } from "react";
import { toast } from "sonner";

const SettingsPage = () => {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { collaborativeEditing, toggleCollaborativeEditing } =
    useCollaborationContext();

  const toggleCollaboration = () => {
    toggleCollaborativeEditing();
    toast.success(
      `Collaborative editing ${!collaborativeEditing ? "enabled" : "disabled"}`
    );
  };

  useState(() => {
    setMounted(true);
  });

  if (!mounted) {
    return null;
  }

  return (
    <div className="container max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-5">Settings</h1>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="dark-mode">Dark Mode</Label>
          <Switch
            id="dark-mode"
            checked={theme === "dark"}
            onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="collaborative-editing">Collaborative Editing</Label>
          <Switch
            id="collaborative-editing"
            checked={collaborativeEditing}
            onCheckedChange={toggleCollaboration}
          />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
