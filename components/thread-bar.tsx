import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { ChevronRight } from "lucide-react";

interface ThreadBarProps {
  count?: number;
  image?: string;
  timestamp?: number;
  name?: string;
  onClick?: () => void;
}

export const ThreadBar = ({
  count,
  image,
  timestamp,
  name = "Member",
  onClick,
}: ThreadBarProps) => {
  // Fallback avatar letter: use the first letter of the user's name (uppercase).
  const avatarFallback = name ? name.charAt(0).toUpperCase() : "U";

  if (!count || !timestamp) {
    return null;
  }
  return (
    <button
      className="p-1 rounded-md hover:bg-white border border-transparent hover:border-border flex items-center justify-start group/thread-bar transition max-w-[600px]"
      onClick={onClick}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <Avatar className="size-6 shrink-0 rounded-md ">
          <AvatarImage src={image} />
          <AvatarFallback className=" ">{avatarFallback}</AvatarFallback>
        </Avatar>
        <span className="text-xs text-black hover:underine font-bold truncate ">
          {count} {count > 1 ? "replies" : "reply"}
        </span>
        <span className="text-xs text-white  truncate group-hover/thread-bar:hidden block">
          Last reply {formatDistanceToNow(timestamp, { addSuffix: true })}
        </span>
        <span className="text-xs text-muted-foreground truncate group-hover/thread-bar:block hidden">
          Click to View the thread
        </span>
      </div>
      <ChevronRight className="size-4 text-muted-foregrond ml-auto opacity-0 group-hover/thread-bar:opacity-100 transition shrink-0" />
    </button>
  );
};
