import { useRemoveChannels } from "@/components/channels/api/use-remove-channel";
import { useUpdateChannel } from "@/components/channels/api/use-update-channel";
import { useCurrentMembers } from "@/components/members/api/use-current-member";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useChannelId } from "@/hooks/use-channel-id";
import { useConfirm } from "@/hooks/use-confirm";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { FaChevronDown } from "react-icons/fa";
import { toast } from "sonner";

interface HeaderProps {
  title: string;
}

const Header = ({ title }: HeaderProps) => {
  const router = useRouter();
  const [ConfirmDialog, confirm] = useConfirm(
    "Delete this channel",
    "You are about to delete this channel. This action is irreversible."
  );
  const [editOpen, setEditOpen] = useState(false);
  const channelId = useChannelId();
  const workspaceId = useWorkspaceId();
  const [value, setValue] = useState(title);
  const { mutate: updateChannel, isPending: updatingChannel } =
    useUpdateChannel();
  const { mutate: removeChannel, isPending: isRemovingChannel } =
    useRemoveChannels();
  const { data: member } = useCurrentMembers({ workspaceId });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = e.target.value.replace(/\s+/g, "-").toLowerCase();
    setValue(formattedValue);
  };

  const handleEditOpen = (value: boolean) => {
    if (member?.role !== "admin") return;
    setEditOpen(value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateChannel(
      { id: channelId, name: value },
      {
        onSuccess: () => {
          toast.success("Channel updated successfully.");
          setEditOpen(false);
        },
        onError: () => {
          toast.error("Failed to update channel.");
        },
      }
    );
  };

  const handleDelete = async () => {
    const confirmed = await confirm();
    if (!confirmed) return;

    removeChannel(
      { id: channelId },
      {
        onSuccess: () => {
          toast.success("Channel deleted successfully.");
          router.push(`/workspace/${workspaceId}`);
        },
        onError: () => {
          toast.error("Failed to delete channel.");
        },
      }
    );
  };

  return (
    <div className="bg-white ml-10 lg:ml-0 border-b h-[49px] flex items-center overflow-hidden">
      <ConfirmDialog />
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            className="text-lg font-semibold overflow-hidden w-auto"
            size="sm"
          >
            <span className="truncate"># {title}</span>
            <FaChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DialogTrigger>
        <DialogContent className="p-0 bg-gray-50 overflow-hidden">
          <DialogHeader className="p-4 border-b bg-white">
            <DialogTitle># {title}</DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-4 flex flex-col gap-y-2">
            <div
              className="px-5 py-4 bg-white rounded-lg border cursor-pointer hover:bg-gray-50"
              onClick={() => setEditOpen(true)}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Channel Name</p>
                {member?.role === "admin" && (
                  <p className="text-sm text-[#1264a3] hover:underline font-semibold cursor-pointer">
                    Edit
                  </p>
                )}
              </div>
              <p className="text-sm text-gray-600"># {title}</p>
            </div>

            {/* Rename Channel Dialog */}
            <Dialog open={editOpen} onOpenChange={handleEditOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Rename this channel</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    value={value}
                    disabled={updatingChannel}
                    onChange={handleChange}
                    required
                    autoFocus
                    minLength={3}
                    maxLength={80}
                    placeholder="e.g. plan-budget"
                  />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button disabled={updatingChannel} variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button disabled={updatingChannel}>Save</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Delete Channel Button */}
            {member?.role === "admin" && (
              <Button
                onClick={handleDelete}
                disabled={isRemovingChannel}
                variant="outline"
                className="flex gap-x-2 px-5 py-4 rounded-lg cursor-pointer hover:bg-gray-50 text-rose-600 "
                aria-label="Delete channel"
              >
                <TrashIcon className="w-4 h-4" />
                <p className="text-sm font-semibold">Delete Channel</p>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Header;
