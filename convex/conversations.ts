import { v } from "convex/values"; // Importing value validators from Convex to validate input arguments
import { mutation } from "./_generated/server"; // Importing the mutation helper from Convex's server-side functions
import { getAuthUserId } from "@convex-dev/auth/server"; // Importing function to get the authenticated user's ID

export const createOrGet = mutation({
  // Define the expected arguments for this mutation function
  args: {
    workspaceId: v.id("workspaces"), // Validates that `workspaceId` is a valid ID from the "workspaces" table
    memberId: v.id("members"), // Validates that `memberId` is a valid ID from the "members" table
  },

  // The main function logic
  handler: async (ctx, args) => {
    // Step 1: Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);

    // Step 2: If no user is authenticated, throw an error
    if (!userId) {
      throw new Error("Unauthorized User"); // Error handling for unauthenticated requests
    }

    // Step 3: Check if the authenticated user is already a member of the workspace
    const currentMember = await ctx.db
      .query("members") // Query the "members" table
      .withIndex(
        "by_workspace_id_user_id",
        (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId) // Find the member where workspaceId and userId match
      )
      .unique(); // Ensures only one result is returned

    // Step 4: Get the member data of the user you want to start the conversation with (otherMember)
    const otherMember = await ctx.db.get(args.memberId); // Fetches the `otherMember` from the "members" table

    // Step 5: If either the current authenticated user or the other member is not found, return null
    if (!currentMember || !otherMember) {
      return null; // If either user does not exist in the members table, return null (conversation cannot proceed)
    }

    // Step 6: Check if a conversation already exists between the two members in this workspace
    const existingConversation = await ctx.db
      .query("conversations") // Query the "conversations" table
      .filter((q) => q.eq(q.field("workspaceId"), args.workspaceId)) // Filter by workspaceId
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("memberOneId"), currentMember._id), // Check if `currentMember` is memberOne and `otherMember` is memberTwo
            q.eq(q.field("memberTwoId"), otherMember._id)
          ),
          q.and(
            q.eq(q.field("memberOneId"), otherMember._id), // Or vice versa, if `otherMember` is memberOne and `currentMember` is memberTwo
            q.eq(q.field("memberTwoId"), currentMember._id)
          )
        )
      )
      .unique(); // Ensure that only one conversation exists between the two members

    // Step 7: If an existing conversation is found, return it
    if (existingConversation) {
      return existingConversation._id; // Return the existing conversation if it already exists
    }

    // Step 8: If no conversation exists, create a new one
    const conversationId = await ctx.db.insert("conversations", {
      workspaceId: args.workspaceId, // Save the workspaceId
      memberOneId: currentMember._id, // Set the current member as memberOne
      memberTwoId: otherMember._id, // Set the other member as memberTwo
    });

    // Step 11: Return the newly created conversation
    return conversationId; // Return the new conversation object
  },
});
