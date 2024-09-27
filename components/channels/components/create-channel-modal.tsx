"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useCreateChannelModal } from "../store/use-create-channel-modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateChannels } from "../api/use-create-channels";
import { useWorkspaceId } from "@/hooks/use-workspace-id";

export const CreateChannelModal = () => {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const [open, setOpen] = useCreateChannelModal();
  const [name, setName] = useState("");
  const { mutate, isPending } = useCreateChannels();

  // Handle input change and sanitize the name
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s+/g, "-").toLowerCase();
    setName(value);
  };

  // Handle close dialog
  const handleClose = () => {
    setOpen(false);
    setName("");
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    mutate(
      { name, workspaceId },
      {
        onSuccess: (id) => {
          router.push(`/workspace/${workspaceId}/channel/${id}`);
          toast.success("Channel created successfully");
          handleClose();
        },
        onError: () => {
          toast.error("Failed to create channel");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Channel</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={name}
            onChange={handleChange}
            disabled={isPending}
            required
            autoFocus
            minLength={3}
            maxLength={80}
            placeholder="Channel name e.g. 'plan-budget', 'game-theory'"
            aria-label="Channel Name"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending}
              aria-label="Create Channel"
            >
              {isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
