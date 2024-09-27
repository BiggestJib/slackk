import { Doc, Id } from "@/convex/_generated/dataModel";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import React, { useEffect, useState } from "react";
import { useCurrentMembers } from "./members/api/use-current-member";
import { cn } from "@/lib/utils";
import { Hint } from "./hint";
import { EmojiPopOver } from "./emoji-popover";
import { MdOutlineAddReaction } from "react-icons/md";

interface ReactionsProps {
  data: Array<
    Omit<Doc<"reactions">, "memberId"> & {
      count: number;
      memberIds: Id<"members">[];
    }
  >;
  onChange: (value: string) => void; // Function to handle reaction changes
}

export const Reactions = ({ data, onChange }: ReactionsProps) => {
  const workspaceId = useWorkspaceId();
  const { data: currentMember } = useCurrentMembers({ workspaceId });
  const currentMemberId = currentMember?._id;

  const [visibleReactions, setVisibleReactions] = useState(8); // Default to 8 reactions for large screens

  // Handle resizing and updating number of visible reactions
  useEffect(() => {
    const handleResize = () => {
      setVisibleReactions(window.innerWidth <= 1024 ? 5 : 10); // Adapt based on screen size
    };

    // Set initial value based on screen size
    handleResize();

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Cleanup listener on component unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // If no reactions or no current member, return nothing
  if (data.length === 0 || !currentMemberId) {
    return null;
  }

  // Sort reactions by count (highest first) and slice the visible reactions
  const sortedReactions = data
    .sort((a, b) => b.count - a.count)
    .slice(0, visibleReactions);

  return (
    <div className="flex items-center gap-1 mt-1 mb-1">
      {sortedReactions.map((reaction) => {
        const hasReacted = reaction.memberIds.includes(currentMemberId);
        return (
          <Hint
            key={reaction._id}
            label={`${reaction.count} ${reaction.count === 1 ? "person" : "people"} reacted with ${reaction.value}`}
          >
            <button
              onClick={() => onChange(reaction.value)} // Call onChange with the reaction value
              className={cn(
                "h-6 px-2 rounded-full bg-slate-200/70 border border-transparent text-slate-800 flex items-center gap-x-1 transition-all duration-150 ease-in-out",
                hasReacted &&
                  "bg-blue-100/70 border-blue-500 text-white hover:bg-blue-200",
                "hover:bg-slate-300 hover:border-slate-500"
              )}
              aria-label={`React with ${reaction.value}`} // Accessibility improvement
            >
              {reaction.value}
              <span
                className={cn(
                  "text-xs font-semibold text-muted-foreground",
                  hasReacted ? "text-blue-500" : "text-slate-800"
                )}
              >
                {reaction.count}
              </span>
            </button>
          </Hint>
        );
      })}
      <EmojiPopOver
        hint="Add Reaction"
        onEmojiSelect={(emoji) => onChange(emoji)}
      >
        <button
          className="h-7 px-3 rounded-full bg-slate-200/70 border border-transparent hover:border-slate-500 text-slate-800 flex items-center gap-x-1 transition-all duration-150 ease-in-out"
          aria-label="Add a reaction"
        >
          <MdOutlineAddReaction className="size-4" />
        </button>
      </EmojiPopOver>
    </div>
  );
};
