import { useQuery } from "convex/react"; // Import useQuery hook from Convex for querying data
import { api } from "@/convex/_generated/api"; // Import the auto-generated Convex API endpoints

import { Id } from "@/convex/_generated/dataModel"; // Import type definitions for Convex data models

// Define the interface for the hook's expected props
interface UseGetChannelsProps {
  workspaceId: Id<"workspaces">; // The workspaceId is of type Id and refers to the "workspaces" table
}

// Define the custom hook to fetch channels for a workspace
export const useGetChannels = ({ workspaceId }: UseGetChannelsProps) => {
  // Use the useQuery hook to fetch data from the 'get' query of the 'channels' API
  // Pass the workspaceId as the argument to the query
  const data = useQuery(api.channels.get, { workspaceId });

  // Determine the loading state by checking if data is undefined
  const isLoading = data === undefined;

  // Return both the data and the loading state
  return { data, isLoading };
};
