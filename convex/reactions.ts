// Import value validators from Convex to validate the input arguments
import { v } from "convex/values";

// Import mutation and query context for handling server-side logic
import { mutation, QueryCtx } from "./_generated/server";

// Import function to retrieve the authenticated user ID
import { getAuthUserId } from "@convex-dev/auth/server";

// Import type definitions for IDs from the data model (e.g., workspace and user IDs)
import { Id } from "./_generated/dataModel";

// Function to get a member from the 'members' table by workspace ID and user ID
const getMember = async (
  ctx: QueryCtx, // Server context object
  workspaceId: Id<"workspaces">, // ID of the workspace
  userId: Id<"users"> // ID of the user
) => {
  // Query the `members` table using the index 'by_workspace_id_user_id'
  // This query filters for a specific workspace and user to find the member
  return ctx.db
    .query("members")
    .withIndex(
      "by_workspace_id_user_id",
      (q) => q.eq("workspaceId", workspaceId).eq("userId", userId) // Filter by workspace and user
    )
    .unique(); // Ensure that the query returns exactly one unique result
};

// Mutation function to toggle or update a reaction on a message
export const toggle = mutation({
  // Define the input arguments for the mutation
  args: {
    messageId: v.id("messages"), // Validate that the messageId is of type 'messages'
    value: v.string(), // Validate that the value (reaction) is a string
  },

  // The main logic to be handled by the mutation
  handler: async (ctx, args) => {
    // Retrieve the current authenticated user ID
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized"); // Throw an error if the user is not authenticated
    }

    // Fetch the message by its ID from the database
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new Error("Message not found"); // Throw an error if the message doesn't exist
    }

    // Retrieve the member object associated with the workspace and user
    const member = await getMember(ctx, message.workspaceId, userId);
    if (!member) {
      throw new Error("Unauthorized"); // Throw an error if the user is not a member of the workspace
    }

    // Query to check if a reaction already exists for this message by the same member
    const existingReaction = await ctx.db
      .query("reactions")
      .filter((q) =>
        q.and(
          q.eq(q.field("messageId"), args.messageId), // Match message ID
          q.eq(q.field("memberId"), member._id) // Match member ID
        )
      )
      .first(); // Return the first match if any

    // If the user has already reacted
    if (existingReaction) {
      if (existingReaction.value === args.value) {
        // If the existing reaction is the same as the new one, remove the reaction
        await ctx.db.delete(existingReaction._id); // Delete the existing reaction
        return existingReaction._id; // Return the ID of the deleted reaction
      } else {
        // If the existing reaction is different, update it with the new value
        await ctx.db.patch(existingReaction._id, {
          value: args.value, // Update the reaction value
        });
        return existingReaction._id; // Return the updated reaction ID
      }
    } else {
      // If no reaction exists, create a new one
      const newReactionId = await ctx.db.insert("reactions", {
        value: args.value, // The new reaction value (e.g., emoji)
        memberId: member._id, // The ID of the member reacting
        messageId: message._id, // The ID of the message being reacted to
        workspaceId: message.workspaceId, // The ID of the workspace where the message exists
      });
      return newReactionId; // Return the new reaction ID to the client
    }
  },
});
