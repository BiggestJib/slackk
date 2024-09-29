import { Doc, Id } from "@/convex/_generated/dataModel";
import React from "react";
import dynamic from "next/dynamic";
import { format, isToday, isYesterday } from "date-fns";
import { Hint } from "./hint";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Thumbnail } from "./Thumbnail";
import { Toolbar } from "./Toolbar";
import { useUpdateMessage } from "./messages/api/use-update-message";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRemoveMessage } from "./messages/api/use-remove-message";
import { useConfirm } from "@/hooks/use-confirm";
import { useToggleReaction } from "./reactions/api/use-toggle-reaction";
import { Reactions } from "./Reactions";
import { usePanel } from "@/hooks/use-panel";
import { ThreadBar } from "./thread-bar";
import { useCurrentMembers } from "./members/api/use-current-member";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useMemberId } from "@/hooks/use-member-id";

const formatFullTime = (date: Date) => {
  return `${isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "MMM d, yyyy")} at ${format(date, "h:mm:ss a")}`;
};

const Renderer = dynamic(() => import("@/components/Renderer"), { ssr: false });
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

interface MessageProps {
  id: Id<"messages">;
  memberId: Id<"members">;
  authorImage?: string;
  authorName?: string;
  isAuthor: boolean;
  reactions: Array<
    Omit<Doc<"reactions">, "memberId"> & {
      count: number;
      memberIds: Id<"members">[];
    }
  >;
  body: Doc<"messages">["body"];
  image?: string | null | undefined;
  updatedAt: Doc<"messages">["updatedAt"];
  createdAt: Doc<"messages">["_creationTime"];
  isEditing: boolean;
  setEditing: (id: Id<"messages"> | null) => void;
  isCompact?: boolean;
  hideThreadButton: boolean;
  threadCount?: number;
  threadImage?: string;
  threadName?: string;
  threadTimeStamp?: number;
}

const Message = ({
  id,
  memberId,
  authorImage,
  authorName = "Member",
  isAuthor,
  reactions,
  body,
  image,
  updatedAt,
  createdAt,
  isEditing,
  setEditing,
  isCompact,
  hideThreadButton,
  threadCount,
  threadImage,
  threadName,
  threadTimeStamp,
}: MessageProps) => {
  const { parentMessageId, onOpenMessage, onOpenProfile, onClose } = usePanel();
  const [ConfirmDialog, confirm] = useConfirm(
    "Delete Message",
    "Are you sure you want to delete this message? This cannot be undone"
  );
  const { mutate: updateMessage, isPending: isUpdatingMessage } =
    useUpdateMessage();
  const { mutate: removeMessage, isPending: isRemovingMessage } =
    useRemoveMessage();
  const { mutate: toggleReaction, isPending: isTogglingReaction } =
    useToggleReaction();
  const workspaceId = useWorkspaceId();
  const { data: currentUser } = useCurrentMembers({ workspaceId });

  const handleUpdate = ({ body }: { body: string }) => {
    updateMessage(
      { id, body },
      {
        onSuccess() {
          toast.success("Message updated successfully");
          setEditing(null);
        },
        onError() {
          toast.error("Error updating message");
        },
      }
    );
  };

  const handleReaction = (value: string) => {
    toggleReaction(
      { messageId: id, value },
      {
        onError() {
          toast.error("Error toggling reaction");
        },
      }
    );
  };

  const handleRemove = async () => {
    const ok = await confirm();
    if (!ok) return;
    removeMessage(
      { id },
      {
        onSuccess() {
          toast.success("Message deleted successfully");
          if (parentMessageId === id) {
            onClose();
          }
          setEditing(null);
        },
        onError() {
          toast.error("Error deleting message");
        },
      }
    );
  };

  const isPending =
    isUpdatingMessage || isRemovingMessage || isTogglingReaction;
  const authorFallback = authorName ? authorName.charAt(0).toUpperCase() : "?";

  if (isCompact) {
    return (
      <>
        <ConfirmDialog />
        <div
          className={cn(
            "flex flex-col gap-2 p-2 ml-12 px-6 transition-all duration-300 ease-in-out hover:bg-gray-50/80 group relative",
            isEditing && "bg-[#f2c74433] hover:bg-[#f2c74433]",
            isRemovingMessage &&
              "bg-rose-400/40 transform transition-all scale-y-0 origin-bottom duration-200",
            currentUser?._id === memberId
              ? "items-end px-0 mr-6"
              : "  items-start"
          )}
        >
          <div
            className={cn(
              "flex flex-row-reverse gap-8 p-4 xl:max-w-[900px] sm:max-w-[400px] shadow-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg transition-transform hover:scale-105 transform-gpu",
              currentUser?._id !== memberId &&
                "bg-muted-foreground text-gray-800 p-4 gap-2 self-start"
            )}
          >
            <Hint label={formatFullTime(new Date(createdAt))}>
              <button className="text-xs rounded-full opacity-0 group-hover:opacity-100 leading-[22px] text-center hover:underline transition-all duration-200">
                {format(new Date(createdAt), "hh:mm")}
              </button>
            </Hint>

            {!isEditing ? (
              <div className="flex flex-col w-full">
                <Renderer value={body} />
                {image && <Thumbnail url={image} />}
                {updatedAt && (
                  <Hint
                    label={`Edited on ${format(new Date(updatedAt), "MMMM do, yyyy h:mm:ss a")}`}
                  >
                    <span className="text-xs text-end text-gray-100">
                      (edited)
                    </span>
                  </Hint>
                )}
                <Reactions data={reactions} onChange={handleReaction} />
                <ThreadBar
                  count={threadCount}
                  image={threadImage}
                  timestamp={threadTimeStamp}
                  name={threadName}
                  onClick={() => onOpenMessage(id)}
                />
              </div>
            ) : (
              <div className="w-full h-full">
                <Editor
                  onSubmit={handleUpdate}
                  disabled={isPending}
                  defaultValue={JSON.parse(body)}
                  onCancel={() => setEditing(null)}
                  variant="update"
                />
              </div>
            )}
          </div>

          {!isEditing && (
            <Toolbar
              isAuthor={isAuthor}
              isPending={isPending}
              handleEdit={() => setEditing(id)}
              handleThread={() => onOpenMessage(id)}
              handleDelete={handleRemove}
              handleReaction={handleReaction}
              hideThreadButton={hideThreadButton}
              createdAt={createdAt}
              memberId={memberId}
            />
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <ConfirmDialog />
      <div
        className={cn(
          "flex  gap-2 p-2 px-6 mt-4 transition-all duration-300 ease-in-out hover:bg-gray-50/80 group relative",
          isEditing && "bg-[#f2c74433] hover:bg-[#f2c74433]",
          isRemovingMessage &&
            "bg-rose-400/40 transform transition-all scale-y-0 origin-bottom duration-200",
          currentUser?._id === memberId ? "items-end flex-col" : "items-start"
        )}
      >
        {currentUser?._id !== memberId && (
          <button onClick={() => onOpenProfile(memberId)}>
            <Avatar className="rounded-md">
              <AvatarImage src={authorImage} />
              <AvatarFallback>{authorFallback}</AvatarFallback>
            </Avatar>
          </button>
        )}
        <div
          className={cn(
            "flex text-white  xl:max-w-[900px] sm:max-w-[400px] bg-gradient-to-r from-purple-600 to-indigo-600  p-4 rounded-lg shadow-lg items-start transition-transform hover:scale-105 transform-gpu gap-2",
            currentUser?._id !== memberId &&
              "bg-muted-foreground text-gray-800 gap-2 self-start"
          )}
        >
          {!isEditing ? (
            <div className="flex flex-col w-full">
              <div
                className={cn(
                  "text-sm flex justify-between",
                  currentUser?._id === memberId && "gap-2"
                )}
              >
                <button
                  onClick={() => onOpenProfile(memberId)}
                  className="font-bold truncate max-w-[100px] text-primary hover:underline"
                >
                  {currentUser?._id !== memberId ? authorName : "You"}
                </button>
                <span>&nbsp;&nbsp;</span>
                <Hint label={formatFullTime(new Date(createdAt))}>
                  <button className="text-sm hover:underline">
                    {format(new Date(createdAt), "hh:mm a")}
                  </button>
                </Hint>
              </div>
              <Renderer value={body} />
              {image && <Thumbnail url={image} />}
              {updatedAt && (
                <Hint
                  label={`Edited on ${format(new Date(updatedAt), "MMMM do, yyyy h:mm:ss a")}`}
                >
                  <span className="text-xs text-end text-gray-100">
                    (edited)
                  </span>
                </Hint>
              )}

              <ThreadBar
                count={threadCount}
                image={threadImage}
                timestamp={threadTimeStamp}
                name={threadName}
                onClick={() => onOpenMessage(id)}
              />
            </div>
          ) : (
            <div className="w-full h-full">
              <Editor
                onSubmit={handleUpdate}
                disabled={isPending}
                defaultValue={JSON.parse(body)}
                onCancel={() => setEditing(null)}
                variant="update"
              />
            </div>
          )}
        </div>

        {!isEditing && (
          <Toolbar
            isAuthor={isAuthor}
            isPending={isPending}
            handleEdit={() => setEditing(id)}
            handleThread={() => onOpenMessage(id)}
            handleDelete={handleRemove}
            handleReaction={handleReaction}
            hideThreadButton={hideThreadButton}
            createdAt={createdAt}
            memberId={memberId}
          />
        )}
      </div>
      <div className="ml-16">
        <Reactions data={reactions} onChange={handleReaction} />{" "}
      </div>
    </>
  );
};

export default Message;
