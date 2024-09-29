import { getAuthUserId } from "@convex-dev/auth/server"; // Helper to get authenticated user ID
import { mutation, query, QueryCtx } from "./_generated/server"; // Convex query method
import { v } from "convex/values"; // Value validators
import { Id } from "./_generated/dataModel";

export const current = query({
  // Define the expected argument, which is workspaceId
  args: { workspaceId: v.id("workspaces") }, // Validate that 'workspaceId' is a valid ID for the workspaces table
  // Handler function to process the query
  handler: async (ctx, args) => {
    // Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);

    // If no user is authenticated, return null
    if (!userId) {
      return null;
    }

    // Query the "members" table to find a member with the given workspaceId and userId
    const member = await ctx.db
      .query("members")
      .withIndex(
        "by_workspace_id_user_id",
        (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId) // Check for both workspaceId and userId within the index
      )
      .unique(); // Collect the unique or ingleresult of the query

    // If no member is found, return null
    if (!member) {
      return null;
    }

    // Return the member details if found
    return member;
  },
});

// Helper function to populate user data from the "users" table
const populateUser = (ctx: QueryCtx, id: Id<"users">) => {
  return ctx.db.get(id); // Retrieve the user information by their ID from the "users" table
};

// Define the main query to get members of a workspace
export const get = query({
  // Define the expected arguments for the query
  args: { workspaceId: v.id("workspaces") }, // Validate that 'workspaceId' is a valid ID for the workspaces table

  // The handler function that processes the query
  handler: async (ctx, args) => {
    // Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);

    // If no user is authenticated, return an empty array
    if (!userId) {
      return [];
    }

    // Check if the user is a member of the workspace by querying the "members" table
    const member = await ctx.db
      .query("members")
      .withIndex(
        "by_workspace_id_user_id", // Query by both workspaceId and userId
        (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId)
      )
      .unique(); // Ensure that only one result is returned

    // If the user is not a member, return an empty array
    if (!member) {
      return [];
    }

    // Query all members of the workspace by workspaceId
    const data = await ctx.db
      .query("members")
      .withIndex("by_workspace_id", (q) =>
        q.eq("workspaceId", args.workspaceId)
      )
      .collect(); // Collect all members of the workspace

    // Array to hold the enriched members with user details
    const members = [];

    // Loop through each member and enrich their data with user information
    for (const member of data) {
      const user = await populateUser(ctx, member.userId); // Fetch user information by userId
      if (user) {
        // Push the member data along with the user information into the array
        members.push({
          ...member, // Spread member data
          user, // Add user details to the member object
        });
      }
    }

    // Return the array of enriched members
    return members;
  },
});
export const getById = query({
  // Validate that the `id` argument is of type `members` (Convex ID validation)
  args: { id: v.id("members") },

  // Handler function that executes when the query is called
  handler: async (ctx, args) => {
    // Get the authenticated user's ID (based on the current session)
    const userId = await getAuthUserId(ctx);

    // If no user is authenticated, return null
    if (!userId) {
      throw new Error("Unauthorized to update this member");
    }

    // Retrieve the member document from the database by its ID (`args.id`)
    const member = await ctx.db.get(args.id);

    // If the member is not found in the database, return null
    if (!member) {
      return null;
    }

    // Query the `members` table to find the current member using workspace ID and user ID
    const currentMember = await ctx.db.query("members").withIndex(
      "by_workspace_id_user_id",
      (q) =>
        q
          .eq("workspaceId", member.workspaceId) // Match workspace ID
          .eq("userId", userId) // Match user ID (authenticated user)
    );

    // If the current member is not found, return null
    if (!currentMember) {
      return null;
    }

    // Populate user details for the member being queried (populateUser is assumed to fetch user data)
    const user = await populateUser(ctx, member.userId);

    // If the user details could not be populated, return null
    if (!user) {
      return null;
    }

    // Return the member data along with the populated user details
    return {
      ...member, // Spread the `member` document properties
      user, // Add the populated user details
    };
  },
});

export const update = mutation({
  args: {
    id: v.id("members"),
    role: v.union(v.literal("admin"), v.literal("members")), // Use "members" instead of "member"
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const member = await ctx.db.get(args.id);
    if (!member) {
      return null;
    }

    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", member.workspaceId).eq("userId", userId)
      )
      .unique();
    if (!currentMember || currentMember.role !== "admin") {
      throw new Error("Unauthorized to update this member");
    }

    await ctx.db.patch(args.id, {
      role: args.role, // Update the role with the correct type
    });
    return args.id;
  },
});

export const remove = mutation({
  // Define the argument to accept a member ID to be deleted
  args: {
    id: v.id("members"), // Validate that the input is a valid member ID
  },
  handler: async (ctx, args) => {
    // Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User not authenticated"); // If the user is not logged in, throw an error
    }

    // Fetch the member by ID from the database
    const member = await ctx.db.get(args.id);
    if (!member) {
      return null;
    }

    // Get the current member from the same workspace and user
    const currentMember = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", member.workspaceId).eq("userId", userId)
      )
      .unique();
    if (!currentMember) {
      throw new Error("Unauthorized to update this member"); // If the current member doesn't exist, return null
    }

    // Prevent deleting if the member to be deleted is an admin
    if (member.role === "admin") {
      throw new Error("Unauthorized to update this member");
    }

    // Prevent self-deletion if the current user is an admin
    const isSelf =
      currentMember._id == args.id && currentMember.role === "admin";
    if (isSelf) {
      throw new Error("Unauthorized to update this member"); // If the current admin tries to delete themselves, return null
    }

    // Query for messages, reactions, and conversations related to the member
    const [messages, reactions, conversations] = await Promise.all([
      ctx.db
        .query("messages")
        .withIndex("by_member_id", (q) => q.eq("memberId", member._id))
        .collect(),
      ctx.db
        .query("reactions")
        .withIndex("by_member_id", (q) => q.eq("memberId", member._id))
        .collect(),
      ctx.db
        .query("conversations")
        .filter((q) =>
          q.or(
            q.eq(q.field("memberOneId"), member._id),
            q.eq(q.field("memberTwoId"), member._id)
          )
        )
        .collect(),
    ]);

    // Optionally delete messages (commented out)
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete reactions associated with the member
    for (const reaction of reactions) {
      await ctx.db.delete(reaction._id);
    }

    // Optionally delete conversations (commented out)
    for (const conversation of conversations) {
      await ctx.db.delete(conversation._id);
    }

    // Finally, delete the member record
    await ctx.db.delete(args.id);
    return args.id; // Return the deleted member ID
  },
});
