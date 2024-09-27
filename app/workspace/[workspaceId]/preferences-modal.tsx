import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogFooter,
  DialogTrigger,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import { Router, TrashIcon } from "lucide-react";
import { useUpdateWorkspace } from "@/components/workspaces/api/use-update-workspace";
import { useRemoveWorkspae } from "@/components/workspaces/api/use-remove-workspace";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/hooks/use-confirm";

interface PreferencesModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  initialValue: string;
}

const PreferenceModal = ({
  open,
  setOpen,
  initialValue,
}: PreferencesModalProps) => {
  const workspaceId = useWorkspaceId();
  const [value, setValue] = useState(initialValue);
  const [editOpen, setEditOpen] = useState(false);
  const [ConfirmDialog, confirm] = useConfirm(
    "Are you sure ",
    "This action is irreversible"
  );

  const { mutate: updateWorkspace, isPending: isUpdatingWorkspace } =
    useUpdateWorkspace();
  const { mutate: removeWorkspace, isPending: isRemoveWorkspace } =
    useRemoveWorkspae();
  const router = useRouter();

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    updateWorkspace(
      {
        id: workspaceId,
        name: value,
      },
      {
        onSuccess: () => {
          toast.success("Workspace Name Updated");
          setEditOpen(false);
        },
        onError: () => {
          toast.error("Failed to Update Workspace Name");
        },
      }
    );
  };

  const handleRemove = async () => {
    const ok = await confirm();
    if (!ok) return;
    removeWorkspace(
      {
        id: workspaceId,
      },
      {
        onSuccess: () => {
          toast.success("Workspace Removed");
          setOpen(false);
          router.replace("/");
        },
        onError: () => {
          toast.error("Failed to Remove Workspace");
        },
      }
    );
  };

  return (
    <>
      <ConfirmDialog />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="p-0 bg-gray-50 overflow-hidden rounded-lg">
          <DialogHeader className="p-4 border-b bg-white flex justify-between items-center">
            <DialogTitle className="text-lg font-semibold">{value}</DialogTitle>
            <DialogClose asChild>
              <button
                aria-label="Close"
                className="text-gray-500 hover:text-black"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </DialogClose>
          </DialogHeader>

          <div className="px-4 pb-4 flex flex-col gap-y-2">
            {/* Workspace Name Section */}
            <div
              className="px-5 py-4 bg-white rounded-lg border cursor-pointer hover:bg-gray-50"
              onClick={() => setEditOpen(true)}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Workspace name</p>
                <p className="text-sm text-[#1264a3] hover:underline font-semibold cursor-pointer">
                  Edit
                </p>
              </div>
              <p className="text-sm text-gray-600">{value}</p>
            </div>

            {/* Rename Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent className="bg-white p-6 rounded-lg">
                <DialogHeader>
                  <DialogTitle>Rename Workspace</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleEdit}>
                  <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    disabled={isUpdatingWorkspace}
                    required
                    autoFocus
                    minLength={3}
                    maxLength={80}
                    placeholder="Workspace name e.g., 'Work', 'Personal'"
                  />
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline" disabled={isUpdatingWorkspace}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isUpdatingWorkspace}>
                      Save
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Delete Workspace Button */}
            <button
              disabled={isRemoveWorkspace}
              onClick={handleRemove}
              className="flex items-center gap-x-2 px-5 py-4 bg-white rounded-lg border cursor-pointer hover:bg-gray-50 text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <TrashIcon className="w-5 h-5" />
              <p className="text-sm font-semibold">Delete workspace</p>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PreferenceModal;
