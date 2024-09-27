import React from "react";
import { Button } from "./ui/button";
import { MessageSquareTextIcon, Pencil, SmileIcon, Trash } from "lucide-react";
import { Hint } from "./hint";
import { EmojiPopOver } from "./emoji-popover";
import { differenceInHours } from "date-fns";

interface ToolbarProps {
  isAuthor: boolean;
  isPending: boolean;
  handleEdit: () => void;
  handleThread: () => void;
  handleDelete: () => void;
  handleReaction: (value: string) => void;
  hideThreadButton: boolean;
  createdAt: number; // Assume this is a timestamp (milliseconds since epoch)
}

export const Toolbar = ({
  isAuthor,
  isPending,
  handleEdit,
  handleThread,
  handleDelete,
  handleReaction,
  hideThreadButton,
  createdAt,
}: ToolbarProps) => {
  // Calculate how many hours have passed since message creation
  const hoursSinceCreation = differenceInHours(new Date(), new Date(createdAt));

  // Disable edit/delete if more than 6 hours have passed
  const canEditOrDelete = isAuthor && hoursSinceCreation <= 12;

  return (
    <div className="absolute top-0 right-5">
      <div className="group-hover:opacity-100 opacity-0 transition-opacity border bg-white rounded-md shadow-sm">
        <EmojiPopOver
          hint="Add Reaction"
          onEmojiSelect={(emoji) => handleReaction(emoji)}
        >
          <Button variant={"ghost"} size={"iconSm"} disabled={isPending}>
            <SmileIcon className="size-4" />
          </Button>
        </EmojiPopOver>

        {!hideThreadButton && (
          <Hint label="Reply in Thread">
            <Button
              variant={"ghost"}
              size={"iconSm"}
              disabled={isPending}
              onClick={handleThread}
            >
              <MessageSquareTextIcon className="size-4" />
            </Button>
          </Hint>
        )}

        {isAuthor && canEditOrDelete && (
          <>
            <Hint label="Edit Message">
              <Button
                variant={"ghost"}
                size={"iconSm"}
                disabled={isPending}
                onClick={handleEdit}
              >
                <Pencil className="size-4" />
              </Button>
            </Hint>
            <Hint label="Delete Message">
              <Button
                onClick={handleDelete}
                variant={"ghost"}
                size={"iconSm"}
                disabled={isPending}
              >
                <Trash className="size-4" />
              </Button>
            </Hint>
          </>
        )}
      </div>
    </div>
  );
};
