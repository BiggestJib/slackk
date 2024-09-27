import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface UseGetWorkspaceProps {
  id: Id<"workspaces">; // Id of the "workspaces" table
}

export const useGetWorkspace = ({ id }: UseGetWorkspaceProps) => {
  // Assuming `getById` is defined in your API and returns a workspace object
  const data = useQuery(api.workspaces.getById, { id });
  const isLoading = data === undefined;

  return { data, isLoading };
};
