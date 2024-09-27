import { useCurrentMembers } from "@/components/members/api/use-current-member";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";

interface UserItemProps {
  id: Id<"members">;
  label?: string;
  image?: string;
  variant?: VariantProps<typeof userItemsVariant>["variant"];
  closeSidebar?: () => void;
}

const userItemsVariant = cva(
  `flex items-center gap-1.5 justify-start font-normal h-7 px-4 text-sm overflow-hidden`,
  {
    variants: {
      variant: {
        default: "text-[#f9edffcc] hover:text-[#f9edffcc]/90",
        active: "text-[#481349] bg-white/90 hover:bg-white/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export const UserItem = ({
  id,
  label = "Member",
  image,
  variant,
  closeSidebar,
}: UserItemProps) => {
  const workspaceId = useWorkspaceId();
  const { data: currentUser } = useCurrentMembers({ workspaceId });
  const avatarFallback = label ? label.charAt(0).toUpperCase() : "?";

  return (
    <Link
      onClick={closeSidebar}
      href={`/workspace/${workspaceId}/members/${id}`}
      passHref
    >
      <Button
        size="sm"
        className={cn(userItemsVariant({ variant }))}
        variant="transparent"
        asChild
      >
        <div className="flex items-center">
          <Avatar className="size-5 rounded-md mr-1">
            <AvatarImage
              className="rounded-md"
              src={image}
              alt={`${label}'s avatar`}
            />
            <AvatarFallback className="rounded-md bg-sky-500 text-xs text-white">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>

          <span className="text-sm truncate  ">
            {currentUser?._id === id ? "You" : label}
          </span>
        </div>
      </Button>
    </Link>
  );
};
