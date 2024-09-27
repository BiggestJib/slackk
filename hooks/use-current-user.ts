import { api } from "@/convex/_generated/api"; // Import the API object that contains the defined queries.
import { useQuery } from "convex/react"; // Import `useQuery` hook to interact with Convex queries.

// Custom hook to fetch the current user data.
export const useCurrentUser = () => {
  // Use `useQuery` to call the `Crrent` query from the API and retrieve user data.
  const data = useQuery(api.users.Crrent);

  // `isLoading` is true when the data is still being fetched (i.e., `data` is `undefined`).
  const isLoading = data === undefined;

  // Return the user data and the loading state.
  return { data, isLoading };
};
