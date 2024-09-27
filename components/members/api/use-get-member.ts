import { useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel"; // Ensure this path is correct
import { api } from "@/convex/_generated/api"; // Ensure the API endpoint is defined

// Define the props interface for the hook
interface UseGetMemberProps {
  id: Id<"members">; // Expect the id to be an Id from the "members" table
}

// Hook to fetch a specific member by ID
export const useGetMember = ({ id }: UseGetMemberProps) => {
  // Query the members API, passing in the member ID
  const data = useQuery(api.members.getById, { id });

  // Determine if the data is still loading
  const isLoading = data === undefined;

  // Return the data (or null if no data) and loading status
  return { data: data || null, isLoading };
};
