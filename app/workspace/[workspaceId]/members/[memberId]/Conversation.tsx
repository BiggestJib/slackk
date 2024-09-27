import { useGetMember } from "@/components/members/api/use-get-member";
import { useGetMessages } from "@/components/messages/api/use-get-messages";
import { Id } from "@/convex/_generated/dataModel";
import { useMemberId } from "@/hooks/use-member-id";
import { Loader } from "lucide-react";
import React from "react";
import Header from "./Header";
import ChatInput from "./chat-input";
import { MessageList } from "@/components/message-list";
import { usePanel } from "@/hooks/use-panel";

interface ConversationProps {
  id: Id<"conversations">;
}

export const Conversation = ({ id }: ConversationProps) => {
  const { onOpenProfile } = usePanel();
  const memberId = useMemberId();
  const { data: member, isLoading: memberLoading } = useGetMember({
    id: memberId,
  });
  const { results, status, loadMore } = useGetMessages({
    conversationId: id,
  });
  if (memberLoading || status === "LoadingFirstPage") {
    return (
      <div className="h-full flex-1 flex items-center justify-center">
        <Loader className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full">
      <Header
        memberName={member?.user.name}
        memberImage={member?.user.image}
        onClick={() => onOpenProfile(memberId)}
      />
      <MessageList
        data={results}
        variant="conversation"
        memberImage={member?.user.image}
        memberName={member?.user.name}
        loadMore={loadMore}
        isLoadingMore={status === "LoadingMore"}
        canLoadMore={status === "CanLoadMore"}
      />
      <ChatInput
        conversationId={id}
        placeholder={`Message ${member?.user.name}`}
      />
    </div>
  );
};
