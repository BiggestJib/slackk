import { useNewJoinCode } from "@/components/workspaces/api/use-new-join-code";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useConfirm } from "@/hooks/use-confirm";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { CopyIcon, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface InviteModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  joinCode: string;
  name: string;
}

export const InviteModal = ({
  open,
  setOpen,
  name,
  joinCode,
}: InviteModalProps) => {
  const [copyText, setCopyText] = useState("Copy Link");
  const workspaceId = useWorkspaceId();
  const { mutate, isPending } = useNewJoinCode();
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure you want to change your Invite Code ?",
    "This would deactivate the current invite code and generate a new one "
  );

  const handleNewCode = async () => {
    const ok = await confirm();
    if (!ok) return;
    mutate(
      { workspaceId },
      {
        onSuccess: () => {
          toast.success("New Invite code generated successfully");
        },
        onError: () => {
          toast.error("Failed to generate new join code");
        },
      }
    );
  };

  const handleCopy = () => {
    const inviteLink = `${window.location.origin}/join/${workspaceId}`;
    navigator.clipboard
      .writeText(inviteLink)
      .then(() => {
        setCopyText("Copied");
        toast.success("Invite link copied to Clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy link");
      })
      .finally(() => {
        setTimeout(() => {
          setCopyText("Copy Link");
        }, 3000); // Reset the text after 3 seconds
      });
  };

  return (
    <>
      <ConfirmDialog />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite People to {name}</DialogTitle>
            <DialogDescription>
              Use the code below to invite people to your workspace:
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-y-4 items-center justify-center py-10">
            <p className="text-4xl font-bold tracking-widest uppercase">
              {joinCode}
            </p>
            <Button onClick={handleCopy} size="sm" variant="ghost">
              {copyText}
              <CopyIcon className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* New Code and Close Button */}
          <div className="flex items-center justify-between w-full">
            <Button
              onClick={handleNewCode}
              size="sm"
              variant="outline"
              disabled={isPending}
            >
              New Code
              <RefreshCcw className="size-4 ml-2" />
            </Button>
            <DialogClose asChild>
              <Button size="sm">Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
        <DialogFooter>{/* Optional footer actions */}</DialogFooter>
      </Dialog>
    </>
  );
};
