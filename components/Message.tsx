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
  console.log(currentUser);

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
            "flex flex-col gap-2 p-1.5 px-8 rou hover:bg-gray-100/60  group relative",
            isEditing && "bg-[#f2c74433] hover:bg-[#f2c74433]",
            isRemovingMessage &&
              "bg-rose-500/50 transform transition-all scale-y-0 origin-bottom duration-200",
            currentUser?._id === memberId ? "items-end" : "items-start"
          )}
        >
          <div
            className={cn(
              "flex items-start max-w-[300px] min-w-[120px] rounded-xl  gap-2 ",
              currentUser?._id !== memberId && "self-start bg-gray-400]"
            )}
          >
            <Hint label={formatFullTime(new Date(createdAt))}>
              <button className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 leading-[22px] text-center hover:underine">
                {format(new Date(createdAt), "hh:mm")}
              </button>
            </Hint>
            {!isEditing ? (
              <div className="flex flex-col w-full">
                <Renderer value={body} />
                <Thumbnail url={image} />
                {updatedAt && (
                  <Hint
                    label={`Edited on ${format(new Date(updatedAt), "MMMM do, yyyy h:mm:ss a")}`}
                  >
                    <span className="text-xs text-muted-foreground">
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
          "flex flex-col gap-2 p-1.5 px-5  hover:bg-gray-100/60  group relative",
          isEditing && "bg-[#f2c74433] hover:bg-[#f2c74433]",
          isRemovingMessage &&
            "bg-rose-500/50 transform transition-all scale-y-0 origin-bottom duration-200",
          currentUser?._id === memberId ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "flex items-start max-w-[300px]  gap-2",
            currentUser?._id !== memberId && "self-start"
          )}
        >
          <button onClick={() => onOpenProfile(memberId)}>
            <Avatar className=" rounded-md ">
              <AvatarImage src={authorImage} />
              <AvatarFallback className=" ">{authorFallback}</AvatarFallback>
            </Avatar>
          </button>

          {!isEditing ? (
            <div className="flex flex-col w-full overflow-hidden">
              <div className="text-sm">
                <button
                  onClick={() => onOpenProfile(memberId)}
                  className="font-bold text-primary hover:underline"
                >
                  {currentUser?._id !== memberId ? authorName : "You"}
                </button>
                <span>&nbsp;&nbsp;</span>
                <Hint label={formatFullTime(new Date(createdAt))}>
                  <button className="text-sm text-muted-foreground hover:underline">
                    {format(new Date(createdAt), "hh:mm a")}
                  </button>
                </Hint>
              </div>
              <Renderer value={body} />
              <Thumbnail url={image} />
              {updatedAt && (
                <Hint
                  label={`Edited on ${format(new Date(updatedAt), "MMMM do, yyyy h:mm:ss a")}`}
                >
                  <span className="text-xs text-muted-foreground">
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
};

export default Message;
