import { useState } from "react";
import { ChannelHero } from "./channel-hero";
import Message from "./Message";
import { getMessagesReturnType } from "./messages/api/use-get-messages";
import { differenceInMinutes, format, isToday, isYesterday } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useCurrentMembers } from "./members/api/use-current-member";
import { Loader } from "lucide-react";
import { ConversationHero } from "./conversation-hero";

const TIME_THRESHOLD = 5;

interface MessageListProps {
  memberName?: string;
  memberImage?: string;
  channelName?: string;
  channelCreationTime?: number;
  variant?: "channel" | "thread" | "conversation";
  data: getMessagesReturnType | undefined;
  loadMore: () => void;
  isLoadingMore: boolean;
  canLoadMore: boolean;
}

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);

  if (isToday(date)) {
    return "Today";
  }
  if (isYesterday(date)) {
    return "Yesterday";
  }
  return format(date, "EEEE, MMMM d");
};

export const MessageList = ({
  memberName,
  memberImage,
  channelName,
  channelCreationTime,
  variant = "channel",
  data,
  loadMore,
  isLoadingMore,
  canLoadMore,
}: MessageListProps) => {
  const [editingId, setEditingId] = useState<Id<"messages"> | null>(null);
  const workspaceId = useWorkspaceId();
  const { data: currentMember } = useCurrentMembers({ workspaceId });

  const groupedMessages = data?.reduce(
    (groups, message) => {
      const dateKey = format(new Date(message._creationTime), "yyyy-MM-dd");

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      groups[dateKey].unshift(message);
      return groups;
    },
    {} as Record<string, typeof data>
  );

  return (
    <div className="flex-1 px-2 flex flex-col-reverse pb-4 overflow-y-auto messages-scrollbar">
      {/* Iterate through grouped messages by date */}
      {Object.entries(groupedMessages || {}).map(([dateKey, messages]) => (
        <div key={dateKey}>
          {/* Date Divider */}
          <div className="text-center my-4 relative">
            <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
            <span className="relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm font-semibold">
              {formatDateLabel(dateKey)}
            </span>
          </div>

          {/* Render each message */}
          {messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const isCompact =
              prevMessage &&
              prevMessage.user?._id === message.user?._id &&
              differenceInMinutes(
                new Date(message._creationTime),
                new Date(prevMessage._creationTime)
              ) < TIME_THRESHOLD;

            return (
              <Message
                key={message._id}
                id={message._id}
                memberId={message.memberId}
                authorImage={message.user.image}
                authorName={message.user.name}
                isAuthor={message.memberId === currentMember?._id}
                reactions={message.reactions}
                body={message.body}
                image={message.image}
                updatedAt={message.updatedAt}
                createdAt={message._creationTime}
                isEditing={editingId === message._id}
                setEditing={setEditingId}
                isCompact={isCompact}
                hideThreadButton={variant === "thread"}
                threadCount={message.threadCount}
                threadImage={message.threadImage}
                threadName={message.threadName}
                threadTimeStamp={message.threadTimeStamp}
              />
            );
          })}
        </div>
      ))}

      {/* Infinite Scroll Loader */}
      <div
        className="h-1"
        ref={(el) => {
          if (el) {
            const observer = new IntersectionObserver(
              ([entry]) => {
                if (entry.isIntersecting && canLoadMore) {
                  loadMore();
                }
              },
              { threshold: 1.0 }
            );
            observer.observe(el);
            return () => observer.disconnect();
          }
        }}
      />

      {/* Loading More Spinner */}
      {isLoadingMore && (
        <div className="flex justify-center items-center py-2">
          <Loader className="w-6 h-6 text-gray-500 animate-spin" />
        </div>
      )}

      {/* Channel Info (Optional) */}
      {variant === "channel" && channelName && channelCreationTime && (
        <ChannelHero name={channelName} creationTime={channelCreationTime} />
      )}
      {variant === "conversation" && (
        <ConversationHero name={memberName} image={memberImage} />
      )}
    </div>
  );
};
