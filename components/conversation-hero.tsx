import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useCurrentMembers } from "./members/api/use-current-member";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useMemberId } from "@/hooks/use-member-id";

interface ConversationHeroProps {
  name?: string;
  image?: string;
}

export const ConversationHero = ({
  name = "Member",
  image,
}: ConversationHeroProps) => {
  const avatarFallback = name.charAt(0).toUpperCase();
  const workspaceId = useWorkspaceId();
  const { data: currentUser } = useCurrentMembers({ workspaceId });
  const memberId = useMemberId();

  return (
    <div className="mt-[88px] mx-5 mb-4">
      <div className="flex items-center gap-x-1 mb-2">
        <Avatar className="size-14 mr-2">
          <AvatarImage src={image} />
          <AvatarFallback>{avatarFallback}</AvatarFallback>
        </Avatar>
        {currentUser?._id !== memberId ? (
          <p className="text-2xl font-bold">{name}</p>
        ) : (
          <p className="text-2xl font-bold">{name} (You)</p>
        )}
      </div>

      <p className="font-normal text-slate-800 mb-4">
        This conversation is just between you and{" "}
        <strong>{currentUser?._id !== memberId ? name : "yourself"}</strong>.
      </p>
    </div>
  );
};
