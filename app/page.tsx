"use client";
import { UserButton } from "@/components/user-button";
import { useGetWorkspaces } from "@/components/workspaces/api/use-get-workspaces";
import { useCreateWorkspaceModal } from "@/store/use-create-workspace-modal";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

export default function Home() {
  const router = useRouter();
  const { data, isLoading } = useGetWorkspaces();
  const workSpaceId = useMemo(() => data?.[0]?._id, [data]);
  const [open, setOpen] = useCreateWorkspaceModal();

  useEffect(() => {
    if (isLoading) return;
    if (workSpaceId) {
      router.replace(`/workspace/${workSpaceId}`);
      console.log(workSpaceId);
    } else if (!open) {
      setOpen(true);
    }
  }, [workSpaceId, isLoading, open, setOpen, router]);
  return (
    <>
      <UserButton />
    </>
  );
}
