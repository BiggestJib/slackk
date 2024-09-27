"use client";

import { useGetChannels } from "@/components/channels/api/use-get-channels";
import { useCreateChannelModal } from "@/components/channels/store/use-create-channel-modal";
import { useCurrentMembers } from "@/components/members/api/use-current-member";
import { Button } from "@/components/ui/button";
import { useGetWorkspace } from "@/components/workspaces/api/use-get-workspace";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { Loader, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo } from "react";

const WorkspaceIdPage = () => {
  const workspaceId = useWorkspaceId();
  const router = useRouter();
  const [open, setOpen] = useCreateChannelModal();

  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspace({
    id: workspaceId,
  });

  const { data: channels, isLoading: channelsLoading } = useGetChannels({
    workspaceId,
  });

  const { data: member, isLoading: memberIsLoading } = useCurrentMembers({
    workspaceId,
  });

  const isAdmin = useMemo(() => member?.role === "admin", [member?.role]);

  const channelId = useMemo(() => channels?.[0]?._id, [channels]);

  useEffect(() => {
    if (
      workspaceLoading ||
      channelsLoading ||
      memberIsLoading ||
      !member ||
      !workspace
    )
      return;

    if (channelId) {
      router.push(`/workspace/${workspaceId}/channel/${channelId}`);
    } else if (!open && isAdmin) {
      setOpen(true);
    }
  }, [
    channelId,
    workspaceLoading,
    channelsLoading,
    workspace,
    open,
    setOpen,
    router,
    workspaceId,
    member,
    memberIsLoading,
    isAdmin,
  ]);

  // Loading state
  if (workspaceLoading || channelsLoading || memberIsLoading) {
    return (
      <div
        className="flex flex-1 flex-col gap-2 h-full items-center justify-center"
        aria-live="polite"
      >
        <Loader className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Loading workspace and channels...
        </span>
      </div>
    );
  }

  // Workspace not found state
  if (!workspace) {
    return (
      <div
        className="flex flex-1 flex-col gap-2 h-full items-center justify-center"
        aria-live="assertive"
        role="alert"
      >
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <span className="text-sm text-muted-foreground">
          Workspace not found. Please check the URL or contact support.
        </span>
        <Button variant="secondary" onClick={() => router.push("/")}>
          Go Back to Home
        </Button>
      </div>
    );
  }

  // No member found
  if (!member) {
    return (
      <div
        className="flex flex-1 flex-col gap-2 h-full items-center justify-center"
        aria-live="assertive"
        role="alert"
      >
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <span className="text-sm text-muted-foreground">
          Member not found. You might not have access to this workspace.
        </span>
        <Button variant="secondary" onClick={() => router.push("/")}>
          Go Back to Home
        </Button>
      </div>
    );
  }

  // No channel found
  if (!channels || channels.length === 0) {
    return (
      <div
        className="flex flex-1 flex-col gap-2 h-full items-center justify-center"
        aria-live="assertive"
        role="alert"
      >
        <AlertTriangle className="w-8 h-8 text-red-500" />
        <span className="text-sm text-muted-foreground">
          No channels available. Please contact an admin or create a new
          channel.
        </span>
        {isAdmin ? (
          <Button onClick={() => setOpen(true)}>Create New Channel</Button>
        ) : (
          <Button variant="secondary" onClick={() => router.push("/")}>
            Go Back to Home
          </Button>
        )}
      </div>
    );
  }

  return null;
};

export default WorkspaceIdPage;
