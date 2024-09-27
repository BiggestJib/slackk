import { Id } from "@/convex/_generated/dataModel";
import React from "react";
import { useGetMember } from "../api/use-get-member";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  ChevronDownIcon,
  Loader,
  MailIcon,
  XIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useUpdateMember } from "../api/use-update-member";
import { useRemoveMember } from "../api/use-remove-member";
import { useCurrentMembers } from "../api/use-current-member";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useRemoveChannels } from "@/components/channels/api/use-remove-channel";
import { useRemoveWorkspae } from "@/components/workspaces/api/use-remove-workspace";
import { useConfirm } from "@/hooks/use-confirm";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useChannelId } from "@/hooks/use-channel-id";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProfileProps {
  memberId: Id<"members">;
  onClose: () => void;
}

export const Profile = ({ memberId, onClose }: ProfileProps) => {
  const workspaceId = useWorkspaceId();
  const channelId = useChannelId();
  const [ConfirmDialog, confirm] = useConfirm(
    "Delete Workspace",
    "Are you sure you want to delete this workspace? This action is irreversible."
  );
  const [LeaveDialog, confirmLeave] = useConfirm(
    "Leave Workspace",
    "Are you sure you want to leave this workspace? This action cannot be undone."
  );
  const [UpdateDialog, confirmUpdateDialog] = useConfirm(
    "Change Role",
    "Are you sure you want to change this member's role? This action is irreversible."
  );
  const [RemoveDialog, confirmRemove] = useConfirm(
    "Remove Member",
    "Are you sure? Removing this member will delete all their conversations, messages, and reactions from the platform."
  );
  const [RemoveChannelDialog, confirmRemoveChannel] = useConfirm(
    "Remove Channel",
    "Are you sure you want to delete this channel? This action is irreversible."
  );
  const { data: currentMember, isLoading: isLoadingCurrentMember } =
    useCurrentMembers({ workspaceId });
  const { data: member, isLoading: isLoadingMember } = useGetMember({
    id: memberId,
  });
  const { mutate: updateMember, isPending: isUpdatingMember } =
    useUpdateMember();
  const { mutate: removeMember, isPending: isRemovingMember } =
    useRemoveMember();
  const { mutate: removeWorkspace, isPending: isRemovingWorkspace } =
    useRemoveWorkspae();
  const { mutate: removeChannel, isPending: isRemovingChannel } =
    useRemoveChannels();
  const router = useRouter();

  const onRemove = async () => {
    const ok = await confirmRemove();
    if (!ok) return;
    removeMember(
      { id: memberId },
      {
        onSuccess: () => {
          toast.success("Member removed successfully.");
          onClose();
        },
        onError: () => {
          toast.error(
            "Unable to remove this member. They may have admin rights. Please check their role and try again."
          );
        },
      }
    );
  };

  const handleRemoveWorkspace = async () => {
    const ok = await confirm();
    if (!ok) return;
    removeWorkspace(
      { id: workspaceId },
      {
        onSuccess: () => {
          toast.success("Workspace deleted successfully.");
          onClose();
          router.replace("/");
        },
        onError: () => {
          toast.error("Failed to delete workspace. Please try again.");
        },
      }
    );
  };

  const onLeave = async () => {
    const confirmed = await confirmLeave();
    if (!confirmed) return;
    removeMember(
      { id: memberId },
      {
        onSuccess: () => {
          router.replace("/");
          toast.success("You have successfully left the workspace.");
          onClose();
        },
        onError: () => {
          toast.error("Failed to leave workspace. Please try again.");
        },
      }
    );
  };

  const onUpdate = async (role: "admin" | "members") => {
    const confirmed = await confirmUpdateDialog();
    if (!confirmed) return;
    updateMember(
      { id: memberId, role },
      {
        onSuccess: () => {
          toast.success("Member role updated successfully.");
          onClose();
          router.replace("/");
        },
        onError: () => {
          toast.error("Failed to update member role. Please try again.");
        },
      }
    );
  };

  const handleDelete = async () => {
    const confirmed = await confirmRemoveChannel();
    if (!confirmed) return;
    removeChannel(
      { id: channelId },
      {
        onSuccess: () => {
          toast.success("Channel deleted successfully.");
          router.push(`/workspace/${workspaceId}`);
        },
        onError: () => {
          toast.error("Failed to delete channel. Please try again.");
        },
      }
    );
  };

  if (isLoadingMember || isLoadingCurrentMember) {
    return (
      <>
        <div className="h-full flex flex-col ">
          <div className="flex justify-between h-[49px] items-center px-4 border-b ">
            <p className="text-lg font-bold">Profile</p>
            <Button onClick={onClose} size="iconSm" variant={"ghost"}>
              <XIcon className="size-5 stroke-[1.5]" />
            </Button>
          </div>
          <div className="flex flex-col gap-y-2 h-full items-center justify-center">
            <Loader className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        </div>
      </>
    );
  }

  if (!member) {
    return (
      <div className="h-full flex flex-col ">
        <div className="flex justify-between h-[49px] items-center px-4 border-b ">
          <p className="text-lg font-bold">Profile</p>
          <Button onClick={onClose} size="iconSm" variant={"ghost"}>
            <XIcon className="size-5 stroke-[1.5]" />
          </Button>
        </div>
        <div className="flex flex-col gap-y-2 h-full items-center justify-center">
          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Profile not found.</p>
        </div>
      </div>
    );
  }

  const avatarFallback = member.user.name
    ? member.user.name.charAt(0).toUpperCase()
    : "?";

  return (
    <>
      <ConfirmDialog />
      <RemoveChannelDialog />
      <RemoveDialog />
      <LeaveDialog />
      <ConfirmDialog />
      <UpdateDialog />

      <div className="h-full flex flex-col">
        <div className="flex justify-between h-[49px] items-center px-4 border-b ">
          <p className="text-lg font-bold">Profile</p>
          <Button onClick={onClose} size="iconSm" variant={"ghost"}>
            <XIcon className="size-5 stroke-[1.5]" />
          </Button>
        </div>
        <div className="flex flex-col p-4 items-center justify-center">
          <Avatar className="max-w-[256px] max-h-[256px] size-full rounded-md mr-1">
            <AvatarImage
              className="rounded-md"
              src={member.user.image}
              alt={`${member.user.name}'s profile image`}
            />
            <AvatarFallback className="aspect-square text-6xl bg-sky-500 text-white">
              {avatarFallback}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="flex flex-col p-4">
          <p className="text-xl font-bold">{member.user.name}</p>
          {currentMember?.role === "admin" &&
          currentMember?._id !== memberId ? (
            <div className="flex items-center gap-2 mt-4 ">
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button
                    onClick={() => {}}
                    variant={"outline"}
                    className="w-full capitalize"
                  >
                    {member.role} <ChevronDownIcon className="size-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full">
                  <DropdownMenuRadioGroup
                    value={member.role}
                    onValueChange={(role) =>
                      onUpdate(role as "admin" | "members")
                    }
                  >
                    <DropdownMenuRadioItem value="admin">
                      Admin
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="members">
                      Members
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                onClick={onRemove}
                variant={"outline"}
                className="w-full hover:border-rose-500"
              >
                Remove Member
              </Button>
            </div>
          ) : currentMember?._id === memberId &&
            currentMember?.role !== "admin" ? (
            <div className="flex items-center gap-2 mt-4 ">
              <Button
                onClick={onLeave}
                variant={"outline"}
                className="w-full rounded-xl border border-rose-500"
              >
                Leave Workspace
              </Button>
            </div>
          ) : (
            currentMember?._id === memberId &&
            currentMember?.role === "admin" && (
              <div className="flex items-center gap-2 mt-4 ">
                <Button
                  onClick={handleRemoveWorkspace}
                  variant={"outline"}
                  className="w-full rounded-xl border hover:border-rose-500"
                >
                  Delete Workspace
                </Button>
                <Button
                  onClick={handleDelete}
                  variant={"outline"}
                  className="w-full rounded-xl border hover:border-rose-500"
                >
                  Delete Channel
                </Button>
              </div>
            )
          )}
        </div>
        <Separator />
        <div className="flex flex-col p-4">
          <p className="text-sm font-bold mb-4">Contact Information</p>
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-md bg-muted flex items-center justify-center">
              <MailIcon className="size-4" />
            </div>
            <div className="flex flex-col">
              <p className="font-semibold text-muted-foreground text-[13px]">
                Email Address
              </p>
              <Link
                className="text-sm hover:underline text-[#1264a3]"
                href={`mailto:${member.user.email}`}
              >
                {member.user.email || "Email not available"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
