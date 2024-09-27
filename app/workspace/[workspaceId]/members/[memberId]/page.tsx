"use client";
import { useCreateOrGetConversation } from "@/components/conversations/api/use-create-or-get-conversation";
import { useCreateWorkspace } from "@/components/workspaces/api/use-create-workspace";
import { Id } from "@/convex/_generated/dataModel";
import { useMemberId } from "@/hooks/use-member-id";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { AlertTriangle, Loader } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Conversation } from "./Conversation";

const MemberIdPage = () => {
  const workspaceId = useWorkspaceId();
  const memberId = useMemberId();
  const [conversationId, setConversationId] =
    useState<Id<"conversations"> | null>(null);
  const { mutate, isPending } = useCreateOrGetConversation();
  useEffect(() => {
    mutate(
      {
        workspaceId,
        memberId,
      },
      {
        onSuccess(data) {
          setConversationId(data);
        },
        onError() {
          toast.error("Failed to  create or get conversation ");
        },
      }
    );
  }, [memberId, workspaceId, mutate]);
  if (isPending) {
    return (
      <div className="h-full flex-1 flex items-center justify-center">
        <Loader className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!conversationId) {
    return (
      <div className="h-full flex-col  gap-y-2 flex items-center justify-center">
        <AlertTriangle className="size-5  text-muted-foreground" />
        <span className="tet-sm text-muted-foreground">
          Conversation not found
        </span>
      </div>
    );
  }
  return <Conversation id={conversationId} />;
};

export default MemberIdPage;
