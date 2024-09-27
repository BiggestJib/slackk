import { Button } from "@/components/ui/button";
import { useGetWorkspace } from "@/components/workspaces/api/use-get-workspace";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { Info, Search } from "lucide-react";
import React, { useState } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useGetChannels } from "@/components/channels/api/use-get-channels";
import { useGetMembers } from "@/components/members/api/use-get-members";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Toolbar = () => {
  const workspaceId = useWorkspaceId();
  const { data, isLoading: isLoadingWorkspace } = useGetWorkspace({
    id: workspaceId,
  });
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const { data: channels, isLoading: isLoadingChannels } = useGetChannels({
    workspaceId,
  });
  const { data: members, isLoading: isLoadingMembers } = useGetMembers({
    workspaceId,
  });

  return (
    <nav className="bg-[#481346] flex items-center justify-between h-10 p-1.5">
      <div className="flex-1" />
      <div className="min-w-[280px] max-[642px]:grow-[2] shrink">
        <Button
          onClick={() => setOpen(true)}
          size="sm"
          className="bg-accent/25 hover:bg-accent/25 w-full justify-start h-7 px-2"
        >
          <Search className="text-white mr-2" width={16} height={16} />
          {/* Show loading state for workspace name */}
          <span className="text-white text-xs">
            {isLoadingWorkspace ? "Loading..." : `Search ${data?.name}`}
          </span>
        </Button>
        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            {/* Add loading state for channels and members */}
            {(isLoadingChannels || isLoadingMembers) && (
              <div className="p-4 text-sm text-muted-foreground">
                Loading...
              </div>
            )}
            {/* Improved empty state messages */}
            {!channels?.length &&
              !members?.length &&
              !isLoadingChannels &&
              !isLoadingMembers && (
                <CommandEmpty>
                  No channels or members found in this workspace.
                </CommandEmpty>
              )}

            {/* Display channels */}
            {!!channels?.length && (
              <CommandGroup heading="Channels">
                {channels.map((channel) => (
                  <CommandItem
                    className="cursor-pointer"
                    key={channel._id}
                    onSelect={() => setOpen(false)}
                    asChild
                  >
                    <Link
                      href={`/workspace/${workspaceId}/channel/${channel._id}`}
                    >
                      <div className="flex items-center gap-2">
                        <span>#</span>
                        <span>{channel.name}</span>
                      </div>
                    </Link>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandSeparator />

            {/* Display members */}
            {!!members?.length && (
              <CommandGroup heading="Members">
                {members.map((member) => (
                  <CommandItem
                    key={member._id}
                    asChild
                    className="cursor-pointer"
                  >
                    <Link
                      href={`/workspace/${workspaceId}/members/${member._id}`}
                    >
                      <div className="flex items-center gap-2">
                        <span>👤</span>
                        <span>{member.user.name}</span>
                      </div>
                    </Link>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </CommandDialog>
      </div>
      <div className="ml-auto flex-1 flex items-center justify-end">
        <Button variant="transparent" size="iconSm" aria-label="Info">
          <Info className="text-white" width={20} height={20} />
        </Button>
      </div>
    </nav>
  );
};

export default Toolbar;
