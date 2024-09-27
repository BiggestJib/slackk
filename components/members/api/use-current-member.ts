import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel"; // Ensure this path is correct
import { api } from "@/convex/_generated/api"; // Ensure the API endpoint is defined

// Define the props interface for the hook
interface UseCurrentMembersProps {
  workspaceId: Id<"workspaces">; // Expect the workspaceId to be an Id from the "workspaces" table
}

// Hook to fetch the current members of a workspace
export const useCurrentMembers = ({ workspaceId }: UseCurrentMembersProps) => {
  // Query the members API, passing in the workspaceId
  const data = useQuery(api.members.current, { workspaceId });

  // Determine if the data is still loading
  const isLoading = data === undefined;

  // Return the data and loading status
  return { data, isLoading };
};
