"use client";
import { useGetChannel } from "@/components/channels/api/use-get-channel";
import { useChannelId } from "@/hooks/use-channel-id";
import { Loader, TriangleAlert } from "lucide-react";
import React from "react";
import Header from "./Header";
import ChatInput from "./chat-input";
import { useGetMessages } from "@/components/messages/api/use-get-messages";
import { MessageList } from "@/components/message-list";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const ChannelIdPage = () => {
  const router = useRouter();
  const channelId = useChannelId();

  const { data: channel, isLoading: channelLoading } = useGetChannel({
    id: channelId,
  });
  const { results, status, loadMore } = useGetMessages({ channelId });
  if (channelLoading || status === "LoadingFirstPage") {
    return (
      <div className="h-full flex-1 flex items-center justify-center">
        <Loader className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!channel) {
    return (
      <div className="h-full flex-1 flex-col gap-y-2 flex items-center justify-center">
        <TriangleAlert className="size-5 text-muted-foreground" />
        <span className="text-sm text-muted-foreround text-center">
          Channel not found. It may have been deleted. Please contact the
          administrator for assistance.
        </span>
        <Button variant="secondary" onClick={() => router.push("/")}>
          Go Back to Home
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full">
      <Header title={channel.name} />
      <MessageList
        channelName={channel.name}
        channelCreationTime={channel._creationTime}
        data={results}
        loadMore={loadMore}
        isLoadingMore={status === "LoadingMore"}
        canLoadMore={status === "CanLoadMore"}
      />
      <ChatInput placeholder={`Message # ${channel.name}`} />
    </div>
  );
};

export default ChannelIdPage;
