import { useCurrentMembers } from "@/components/members/api/use-current-member";
import { useGetWorkspace } from "@/components/workspaces/api/use-get-workspace";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import {
  AlertTriangle,
  HashIcon,
  Loader,
  MessageSquareText,
  SendHorizonal,
} from "lucide-react";
import React from "react";
import WorkspaceHeader from "./workspace-header";
import { SidebarItem } from "./sidebar-item";
import { useGetChannels } from "@/components/channels/api/use-get-channels";
import { WorkspaceSection } from "./workspace-section";
import { useGetMembers } from "@/components/members/api/use-get-members";
import { UserItem } from "./user-item";
import { useCreateChannelModal } from "@/components/channels/store/use-create-channel-modal";
import { useChannelId } from "@/hooks/use-channel-id";
import { Item } from "@radix-ui/react-dropdown-menu";
import { useMemberId } from "@/hooks/use-member-id";

interface WorkspaceSidebarProps {
  closeSidebar: () => void;
}

const WorkspaceSidebar = ({ closeSidebar }: WorkspaceSidebarProps) => {
  const memberId = useMemberId();
  const channelId = useChannelId();
  const workspaceId = useWorkspaceId();
  const [_open, setOpen] = useCreateChannelModal();
  const { data: channels, isLoading: channelsLoading } = useGetChannels({
    workspaceId,
  });
  const { data: member, isLoading: memberLoading } = useCurrentMembers({
    workspaceId,
  });
  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspace({
    id: workspaceId,
  });
  const { data: members, isLoading: membersLoading } = useGetMembers({
    workspaceId,
  });
  if (memberLoading || workspaceLoading)
    return (
      <div className="flex flex-col bg-[#5E2C5f] h-full items-center justify-center">
        <Loader className="size-5 animate-spin text-white" />
      </div>
    );
  if (!workspace || !member)
    return (
      <div className="flex flex-col bg-[#5E2C5f] h-full items-center justify-center">
        <AlertTriangle className="size-5 text-white" />
        <p className="text-sm text-white">Workspace not Found </p>
      </div>
    );
  return (
    <div className="flex flex-col bg-[#5E2C5f] h-full">
      <WorkspaceHeader
        workspace={workspace}
        isAdmin={member?.role === "admin"}
      />
      <div className="flex flex-col px-2 mt-3">
        <SidebarItem
          closeSidebar={closeSidebar}
          label="Threads"
          icon={MessageSquareText}
          id="threads"
        />
        <SidebarItem
          closeSidebar={closeSidebar}
          label="Drafts & Sent"
          icon={SendHorizonal}
          id="Drafts"
        />
      </div>
      <WorkspaceSection
        label="Channels"
        hint="New Channel"
        onNew={member.role === "admin" ? () => setOpen(true) : undefined}
      >
        {channels?.map((item) => (
          <SidebarItem
            variant={channelId === item._id ? "active" : "default"}
            closeSidebar={closeSidebar}
            label={item.name}
            id={item._id}
            key={item._id}
            icon={HashIcon}
          />
        ))}
      </WorkspaceSection>
      <WorkspaceSection
        label="Direct Messages"
        hint="New Direct Message"
        onNew={() => {}}
        open
      >
        {members?.map((item) => (
          <UserItem
            closeSidebar={closeSidebar}
            key={item._id}
            id={item._id}
            label={item.user.name}
            image={item.user.image}
            variant={item._id === memberId ? "active" : "default"}
          />
        ))}
      </WorkspaceSection>
    </div>
  );
};

export default WorkspaceSidebar;
