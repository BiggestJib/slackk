import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { AlertTriangle, Loader, XIcon } from "lucide-react";
import React, { useRef, useState } from "react";
import { useGetMessage } from "../api/use-get-message";
import Message from "@/components/Message";
import { useCurrentMembers } from "@/components/members/api/use-current-member";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import dynamic from "next/dynamic";
import Quill from "quill";
import { useCreateMessage } from "../api/use-create-message";
import { useGenerateUploadUrl } from "@/components/upload/use-generate-upload-url";
import { useChannelId } from "@/hooks/use-channel-id";
import { toast } from "sonner";
import { useGetMessages } from "../api/use-get-messages";
import { differenceInMinutes, format, isToday, isYesterday } from "date-fns";
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

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
const TIME_THRESHOLD = 5;

interface ThreadProps {
  messageId: Id<"messages">;
  onClose: () => void;
}
type CreateMessageValues = {
  channelId: Id<"channels">;
  workspaceId: Id<"workspaces">;
  parentMessageId: Id<"messages">;
  body: string;
  image?: Id<"_storage"> | undefined;
};

export const Thread = ({ messageId, onClose }: ThreadProps) => {
  const channelId = useChannelId();
  const workspaceId = useWorkspaceId();
  const { data: message, isLoading: loadingMessage } = useGetMessage({
    id: messageId,
  });
  const { data: currentMember } = useCurrentMembers({ workspaceId });
  const [editingId, setEditingId] = useState<Id<"messages"> | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [isPending, setIsPending] = useState(false);
  const editorRef = useRef<Quill | null>(null);
  const { mutate: generateUploadUrl } = useGenerateUploadUrl();
  const { mutate: createMessage } = useCreateMessage();
  const { results, status, loadMore } = useGetMessages({
    channelId,
    parentMessageId: messageId,
  });

  const canLoadMore = status === "CanLoadMore";
  const isLoadingMore = status === "LoadingMore";
  const groupedMessages = results?.reduce(
    (groups, message) => {
      const date = new Date();
      const dateKey = format(new Date(message._creationTime), "yyyy-MM-dd");

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }

      groups[dateKey].unshift(message);
      return groups;
    },
    {} as Record<string, typeof results>
  );

  const handleSubmit = async ({
    body,
    image,
  }: {
    body: string; // The body of the message (text content)
    image: File | null; // Optional image file to upload (can be null)
  }) => {
    try {
      setIsPending(true); // Set a loading state to indicate the process is ongoing
      editorRef?.current?.enable(false); // Disable the editor to prevent further input while submitting

      // Create an object with initial message data
      const values: CreateMessageValues = {
        channelId, // ID of the channel where the message is being sent
        workspaceId, // ID of the workspace to which the channel belongs
        body, // Text content of the message
        image: undefined, // Initialize image as undefined; will be updated if an image is provided
        parentMessageId: messageId, // Store the parent message ID (for replies)
      };

      // If an image is provided, handle the image upload
      if (image) {
        // Request an upload URL from the server (used to upload the image to a storage system)
        const url = await generateUploadUrl({}, { throwError: true });

        // If no upload URL is returned, throw an error
        if (!url) {
          throw new Error(`Upload Failed`);
        }

        // Perform the actual image upload using the provided URL
        const result = await fetch(url, {
          method: "POST", // Use POST to upload the image file
          headers: { "Content-Type": image.type }, // Set the content type to match the image file
          body: image, // Send the image as the request body
        });

        // If the upload fails, throw an error
        if (!result.ok) {
          throw new Error("Failed to upload image");
        }

        // Parse the response to get the image's storage ID
        const { storageId } = await result.json();

        // Update the message values object to include the uploaded image's storage ID
        values.image = storageId;
      }

      // Send the message data to the server
      await createMessage(values, { throwError: true });

      // Reset the editor's key to force a re-render, effectively clearing the editor
      setEditorKey((prevKey) => prevKey + 1);
    } catch (error) {
      // Show an error notification in case of failure
      toast.error("Failed to send Message");
    } finally {
      // Reset the loading state and re-enable the editor for further input
      setIsPending(false);
      editorRef?.current?.enable(true);
    }
  };
  if (loadingMessage || status === "LoadingFirstPage") {
    return (
      <div className="h-full flex flex-col ">
        <div className="flex justify-between h-[49px] items-cener px-4 border-b ">
          <p className="text-lg font-bold ">Thread</p>
          <Button onClick={onClose} size="iconSm" variant={"ghost"}>
            <XIcon className="size-5 stroke-[1.g]" />
          </Button>
        </div>
        <div className="flex flex-col gap-y-2  h-full items-center justify-center">
          <Loader className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <div className="h-full flex flex-col ">
        <div className="flex justify-between h-[49px] items-cener px-4 border-b ">
          <p className="text-lg font-bold ">Thread</p>
          <Button onClick={onClose} size="iconSm" variant={"ghost"}>
            <XIcon className="size-5 stroke-[1.g]" />
          </Button>
        </div>
        <div className="flex flex-col gap-y-2  h-full items-center justify-center">
          <AlertTriangle className="w-4 h-4 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Message not Found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full  max-w-[400px] md:max-w-full flex flex-col ">
      <div className="flex justify-between h-[49px] items-cener px-4 border-b ">
        <p className="text-lg font-bold ">Thread</p>
        <Button onClick={onClose} size="iconSm" variant={"ghost"}>
          <XIcon className="size-5 stroke-[1.g]" />
        </Button>
      </div>
      <div className="flex-1 px-2 flex flex-col-reverse pb-4 overflow-y-auto messages-scrollbar">
        {Object.entries(groupedMessages || {}).map(([dateKey, messages]) => (
          <div key={dateKey}>
            <div className="text-center my-2 relative">
              <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
              <span className="relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm ">
                {formatDateLabel(dateKey)}
              </span>
            </div>
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
                  hideThreadButton
                  threadCount={message.threadCount}
                  threadImage={message.threadImage}
                  threadName={message.threadName}
                  threadTimeStamp={message.threadTimeStamp}
                />
              );
            })}
          </div>
        ))}
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
        {isLoadingMore && (
          <div className="text-center my-2 relative">
            <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
            <span className="relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm ">
              <Loader className="size-4 animate-spin " />
            </span>
          </div>
        )}
        <Message
          hideThreadButton
          memberId={message.memberId}
          authorImage={message.user.image}
          authorName={message.user.name}
          isAuthor={message.memberId === currentMember?._id}
          body={message.body}
          image={message.image}
          createdAt={message._creationTime}
          updatedAt={message.updatedAt}
          id={message._id}
          reactions={message.reactions}
          isEditing={editingId === message._id}
          setEditing={setEditingId}
        />
      </div>
      <div className="px-4">
        <Editor
          key={editorKey}
          onSubmit={handleSubmit}
          disabled={isPending}
          placeholder="Reply.. "
          innerRef={editorRef}
        />
      </div>
    </div>
  );
};
