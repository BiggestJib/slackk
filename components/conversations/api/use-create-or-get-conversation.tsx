// Import necessary hooks and types
import { useMutation } from "convex/react"; // Hook to handle mutations with Convex
import { api } from "@/convex/_generated/api"; // Import the API endpoints from Convex
import { useCallback, useMemo, useState } from "react"; // React hooks for state and memoization
import { Doc, Id } from "@/convex/_generated/dataModel"; // Type definition for Convex database IDs

// Define options type for handling success, error, settled states, and throwing errors
type Options = {
  onSuccess?: (data: ResponseType) => void; // Optional callback for successful mutation
  onError?: (error: Error) => void; // Optional callback for handling errors
  onSettled?: () => void; // Optional callback for when mutation is settled (complete)
  throwError?: boolean; // Option to throw an error, useful for manual error handling
};

// Define the request and response types for the mutation

type RequestType = {
  workspaceId: Id<"workspaces">; // Workspace ID where the conversation will happen
  memberId: Id<"members">; // Optional member ID (target member for the conversation)
};

type ResponseType = Id<"conversations"> | null; // Type for the response, either a conversation document or null

// Custom hook to create a conversation or fetch an existing one using Convex mutation
export const useCreateOrGetConversation = () => {
  const [data, setData] = useState<ResponseType>(null); // State to hold the response data
  const [error, setError] = useState<Error | null>(null); // State to handle errors
  const [status, setStatus] = useState<
    // State to track the mutation status
    "success" | "error" | "settled" | "pending" | null
  >(null); // Status can be "success", "error", "settled", "pending", or null

  // Memoized state checks for various statuses to avoid unnecessary re-renders
  const isPending = useMemo(() => status === "pending", [status]); // True if mutation is in progress
  const isSuccess = useMemo(() => status === "success", [status]); // True if mutation was successful
  const isError = useMemo(() => status === "error", [status]); // True if mutation failed with an error
  const isSettled = useMemo(() => status === "settled", [status]); // True if mutation is settled (complete)

  // Get the mutation function from Convex
  const mutation = useMutation(api.conversations.createOrGet); // Use the `createOrGet` mutation from Convex

  // Define the `mutate` function that performs the mutation and updates status and data
  const mutate = useCallback(
    async (values: RequestType, options?: Options) => {
      try {
        setData(null); // Reset data state before mutation
        setError(null); // Reset error state before mutation
        setStatus("pending"); // Set status to pending to indicate the mutation is in progress

        // Perform the mutation using the provided `values` and store the response
        const response = await mutation(values);
        setData(response); // Store the successful response data
        setStatus("success"); // Set status to success
        options?.onSuccess?.(response); // Call the onSuccess callback if provided
        return response;
      } catch (error) {
        setStatus("error"); // Set status to error if mutation fails
        setError(error as Error); // Store the error in the state
        options?.onError?.(error as Error); // Call the onError callback if provided
        if (options?.throwError) {
          throw error; // Optionally throw the error for manual error handling
        }
      } finally {
        setStatus("settled"); // Set status to settled once mutation is done
        options?.onSettled?.(); // Call the onSettled callback if provided
      }
    },
    [mutation] // Ensure the `mutate` function is memoized properly by using the mutation dependency
  );

  // Return the mutation function and the various pieces of state for external use
  return { mutate, data, error, isPending, isSettled, isError, isSuccess };
};
