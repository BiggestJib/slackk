import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useWorkspaceId } from "@/hooks/use-workspace-id";
import { useGetWorkspace } from "@/components/workspaces/api/use-get-workspace";
import { useGetWorkspaces } from "@/components/workspaces/api/use-get-workspaces";
import { useCreateWorkspaceModal } from "@/store/use-create-workspace-modal";
import { Loader, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

const WorkspaceSwitcher = () => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const [_open, setOpen] = useCreateWorkspaceModal();
  const { data: workspace, isLoading: workspaceLoading } = useGetWorkspace({
    id: workspaceId,
  });
  const { data: workspaces, isLoading: workspacesLoading } = useGetWorkspaces();
  const filteredWorkSpaces = workspaces?.filter(
    (workspace) => workspace?._id !== workspaceId
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative">
          <Button className="relative bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold text-lg px-4 py-2 rounded-lg transition-colors duration-200 ease-in-out">
            {workspaceLoading ? (
              <Loader
                className="animate-spin shrink-0"
                width={20}
                height={20}
              />
            ) : (
              workspace?.name?.charAt(0).toUpperCase()
            )}
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="start"
        className="lg:w-72 w-64 p-2 z-[9999] rounded-lg shadow-md bg-white border border-gray-200"
        style={{ position: "absolute" }} // Ensure position is correctly set
      >
        <DropdownMenuItem
          onClick={() => router.push(`/workspace/${workspaceId}`)}
          className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex flex-col justify-start items-start capitalize text-sm p-2 transition-colors duration-200 ease-in-out"
        >
          <span className="font-semibold">{workspace?.name}</span>
          <span className="text-xs text-gray-500">Active workspace</span>
        </DropdownMenuItem>

        {filteredWorkSpaces?.map((workspace) => (
          <DropdownMenuItem
            onClick={() => router.push(`/workspace/${workspace._id}`)}
            key={workspace._id}
            className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center p-2 text-sm transition-colors duration-200 ease-in-out"
          >
            <div className="h-9 w-9 flex shrink-0 items-center justify-center bg-gray-600 text-white font-semibold text-lg rounded-md mr-2">
              {workspace.name.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">{workspace.name}</div>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator className="my-2 border-t border-gray-200" />

        <DropdownMenuItem
          onClick={() => setOpen(true)}
          className="flex cursor-pointer hover:bg-gray-100 focus:bg-gray-100 focus:outline-none p-2 transition-colors duration-200 ease-in-out"
        >
          <div className="h-9 w-9 flex items-center justify-center bg-gray-200 text-gray-800 font-semibold rounded-md mr-2">
            <Plus width={16} height={16} />
          </div>
          Create a New Workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WorkspaceSwitcher;
