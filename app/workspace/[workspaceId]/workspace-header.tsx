import React, { useState } from "react";
import {
  DropdownMenuContent,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Doc } from "@/convex/_generated/dataModel";
import { ChevronDown, ListFilter, SquarePen } from "lucide-react";
import { Hint } from "@/components/hint";
import PreferenceModal from "./preferences-modal";
import { InviteModal } from "./invite-modal";

interface WorkspaceHeaderProps {
  workspace: Doc<"workspaces">;
  isAdmin: boolean;
}

const WorkspaceHeader = ({ workspace, isAdmin }: WorkspaceHeaderProps) => {
  const [preferencesOpen, setPrefrencesOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  return (
    <>
      <InviteModal
        name={workspace.name}
        open={inviteOpen}
        setOpen={setInviteOpen}
        joinCode={workspace.joinCode}
      />
      <PreferenceModal
        open={preferencesOpen}
        setOpen={setPrefrencesOpen}
        initialValue={workspace.name}
      />
      <div className="flex mt-12 items-center justify-between px-4 h-[49px] gap-0.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="transparent"
              size="sm"
              className="font-semibold text-lg w-auto p-1.5 flex items-center"
            >
              <span className="font-semibold truncate text-base sm:text-lg">
                {workspace.name}
              </span>
              <ChevronDown className="w-4 h-4 ml-1 shrink-0 sm:w-5 sm:h-5" />
            </Button>
          </DropdownMenuTrigger>

          {/* Dropdown menu content */}
          <DropdownMenuContent
            side="bottom"
            align="start"
            className="shadow-lg rounded-md w-48 sm:w-64 mt-2"
          >
            <DropdownMenuItem
              className="cursor-pointer capitalize"
              key={workspace._id}
            >
              <div className="h-8 w-8 relative overflow-hidden bg-[#616061] text-white font-semibold rounded-md flex items-center justify-center mr-2">
                {workspace?.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col items-start">
                <p className="font-bold text-sm sm:text-base">
                  {workspace.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Active workspace
                </p>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {isAdmin && (
              <>
                <DropdownMenuItem
                  onClick={() => setInviteOpen(true)}
                  className="cursor-pointer py-1 sm:py-2 text-sm sm:text-base"
                >
                  Invite People to {workspace.name}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setPrefrencesOpen(true)}
                  className="cursor-pointer py-1 sm:py-2 text-sm sm:text-base"
                >
                  Preferences
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2">
          <Hint side="bottom" label="Filter conversation">
            <Button variant="transparent" size="iconSm">
              <ListFilter className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </Hint>
          <Hint side="bottom" label="New message">
            <Button variant="transparent" size="iconSm">
              <SquarePen className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </Hint>
        </div>
      </div>
    </>
  );
};

export default WorkspaceHeader;
