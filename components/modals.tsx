"use client";

import { useEffect, useState } from "react";
import { CreateWorkspaceModal } from "./workspaces/components/create-workspace-modal";
import { CreateChannelModal } from "./channels/components/create-channel-modal";

export const Modals = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;
  return (
    <>
      <CreateWorkspaceModal />
      <CreateChannelModal />
    </>
  );
};
