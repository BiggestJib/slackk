// Import necessary hooks and types
import { useMutation } from "convex/react"; // Hook to handle mutations with Convex
import { api } from "@/convex/_generated/api"; // Import the API endpoints from Convex
import { useCallback, useMemo, useState } from "react"; // React hooks for state and memoization
import { Id } from "@/convex/_generated/dataModel"; // Type definition for Convex database IDs

// Define options type for handling success, error, settled states, and throwing errors
type Options = {
  onSuccess?: (data: ResponseType) => void; // Optional callback for successful mutation
  onError?: (error: Error) => void; // Optional callback for errors
  onSettled?: () => void; // Optional callback when mutation is settled
  throwError?: boolean; // Option to throw an error
};

// Define the request and response types for the mutation
type RequestType = { name: string; workspaceId: Id<"workspaces"> }; // Type for mutation request data
type ResponseType = Id<"channels"> | null; // Type for response (channel ID or null)

// Custom hook to create a channel using Convex mutation
export const useCreateChannels = () => {
  const [data, setData] = useState<ResponseType>(null); // State to hold response data
  const [error, setError] = useState<Error | null>(null); // State to handle errors
  const [status, setStatus] = useState<
    "success" | "error" | "settled" | "pending" | null
  >(null); // State to track the status of the mutation

  // Memoized state checks for various statuses
  const isPending = useMemo(() => status === "pending", [status]); // True if mutation is in progress
  const isSuccess = useMemo(() => status === "success", [status]); // True if mutation is successful
  const isError = useMemo(() => status === "error", [status]); // True if mutation has an error
  const isSettled = useMemo(() => status === "settled", [status]); // True if mutation is complete (success or error)

  // Get the mutation function from Convex
  const mutation = useMutation(api.channels.create);

  // Define the `mutate` function that handles mutation and status updates
  const mutate = useCallback(
    async (values: RequestType, options?: Options) => {
      try {
        setData(null); // Reset data state before mutation
        setError(null); // Reset error state before mutation
        setStatus("pending"); // Set status to pending

        // Perform the mutation and update the response data
        const response = await mutation(values);
        setData(response); // Update data state with the response after a successful mutation
        setStatus("success"); // Set status to success
        options?.onSuccess?.(response); // Call onSuccess callback if provided
        return response;
      } catch (error) {
        setStatus("error"); // Set status to error
        setError(error as Error); // Set error state with the caught error
        options?.onError?.(error as Error); // Call onError callback if provided
        if (options?.throwError) {
          throw error; // Optionally throw the error
        }
      } finally {
        setStatus("settled"); // Set status to settled (complete)
        options?.onSettled?.(); // Call onSettled callback if provided
      }
    },
    [mutation] // Dependency array ensures the function is memoized correctly
  );

  // Return mutation state and helpers
  return { mutate, data, error, isPending, isSettled, isError, isSuccess };
};
