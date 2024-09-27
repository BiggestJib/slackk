// Import necessary modules from Convex and authentication libraries
import { v } from "convex/values"; // Import Convex's value validators for arguments
import { mutation, query } from "./_generated/server"; // Import Convex mutation and query methods
import { getAuthUserId } from "@convex-dev/auth/server"; // Helper function to get authenticated user ID

// Function to generate a random 6-character code (for join codes)
const generateCode = () => {
  // Generate a 6-character string using a combination of numbers and lowercase letters
  return Array.from(
    { length: 6 },
    () => "0123456789abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 36)]
  ).join(""); // Join the array of characters into a single string
};
// Mutation to create a workspace
export const create = mutation({
  // Define the expected arguments for the mutation
  args: {
    name: v.string(), // Ensure 'name' is a string, which will be used as the workspace's name
  },
  // The handler function that processes the mutation
  handler: async (ctx, args) => {
    // Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);

    // If no user is authenticated, throw an error
    if (!userId) {
      throw new Error("Unauthorized User"); // Only authenticated users can create a workspace
    }

    // Generate a unique join code for the workspace (e.g., for inviting members)
    const joinCode = generateCode(); // Assuming 'generateCode()' is a helper function that generates a unique join code

    // Insert the new workspace into the "workspaces" table
    const workspaceId = await ctx.db.insert("workspaces", {
      name: args.name, // The name of the workspace as provided by the user
      userId, // The authenticated user is associated with the workspace as its creator
      joinCode, // The generated join code is stored for inviting new members
    });

    // Insert the authenticated user as a member of the workspace with the "admin" role
    await ctx.db.insert("members", {
      userId, // The authenticated user who created the workspace
      workspaceId, // Associate this member with the newly created workspace
      role: "admin", // The user is given the "admin" role by default, as they created the workspace
    });

    // Insert the initial "general" channel into the "channels" table for the new workspace
    await ctx.db.insert("channels", {
      name: "general", // The default channel name is "general"
      workspaceId, // Associate this channel with the newly created workspace
      // More fields could be added if necessary, such as descriptions or channel types
    });

    // Return the ID of the newly created workspace
    return workspaceId; // This allows the client to know the workspace ID and proceed accordingly (e.g., redirect to the workspace)
  },
});

// Query to retrieve all workspaces associated with the authenticated user
export const get = query({
  // No arguments required for this query
  args: {},
  // Handler function for the query
  handler: async (ctx) => {
    // Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);

    // If the user is not authenticated, return an empty array
    if (!userId) {
      return [];
    }

    // Query the "members" table to find all workspaces where the user is a member
    const members = await ctx.db
      .query("members")
      .withIndex("by_user_id", (q) => q.eq("userId", userId)) // Use an index to find all member records for the user
      .collect();

    // Extract the workspace IDs from the members data
    const workspaceIds = members.map((member) => member.workspaceId);

    // Initialize an empty array to store the workspaces
    const workspaces = [];

    // Loop through each workspaceId, retrieve the workspace, and add it to the array
    for (const workspaceId of workspaceIds) {
      const workspace = await ctx.db.get(workspaceId); // Fetch the workspace by its ID
      if (workspace) {
        workspaces.push(workspace); // Push the workspace to the array if it exists
      }
    }

    // Return the array of workspaces associated with the user
    return workspaces;
  },
});

// Query to retrieve a workspace by its ID
export const getById = query({
  // Define the expected argument, which is the workspace ID
  args: {
    id: v.id("workspaces"), // Validate that 'id' is a valid workspace ID
  },
  // Handler function for the query
  handler: async (ctx, args) => {
    // Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);

    // If the user is not authenticated, throw an error
    if (!userId) {
      throw new Error("Unauthorized User");
    }

    // Check if the user is a member of the workspace by querying the "members" table
    const member = await ctx.db
      .query("members")
      .withIndex(
        "by_workspace_id_user_id",
        (q) => q.eq("workspaceId", args.id).eq("userId", userId) // Query using both workspaceId and userId
      )
      .unique(); // Ensure that the combination of workspaceId and userId is unique

    // If the user is not a member of the workspace, return null
    if (!member) {
      return null;
    }

    // Retrieve and return the workspace by its ID from the "workspaces" table
    return await ctx.db.get(args.id); // Fetch the workspace with the given ID
  },
});

export const update = mutation({
  // Define the expected arguments for the mutation
  args: {
    id: v.id("workspaces"), // The workspace ID being updated
    name: v.string(), // The new name for the workspace
  },
  // The handler function that will process the mutation
  handler: async (ctx, args) => {
    // Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);

    // If the user is not authenticated, throw an error
    if (!userId) {
      throw new Error("Unauthorized User");
    }

    // Check if the user is a member of the workspace by querying the "members" table
    const member = await ctx.db
      .query("members")
      .withIndex(
        "by_workspace_id_user_id", // Use the index to efficiently query by workspaceId and userId
        (q) => q.eq("workspaceId", args.id).eq("userId", userId) // Check if the user is part of the workspace
      )
      .unique(); // Ensure there is only one combination of workspaceId and userId

    // If the user is not a member or not an admin, throw an error
    if (!member || member.role !== "admin") {
      throw new Error("Unauthorized"); // User must be an admin to update the workspace
    }

    // Update the workspace with the new name
    await ctx.db.patch(args.id, {
      name: args.name,
    });
    return args.id;
  },
});

export const remove = mutation({
  // Define the expected arguments for the mutation
  args: {
    id: v.id("workspaces"), // The workspace ID that needs to be deleted
  },
  // The handler function that will process the mutation
  handler: async (ctx, args) => {
    // Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);

    // If the user is not authenticated, throw an error
    if (!userId) {
      throw new Error("Unauthorized User"); // Ensure only authenticated users can delete the workspace
    }

    // Check if the user is an admin of the workspace by querying the "members" table
    const member = await ctx.db
      .query("members")
      .withIndex(
        "by_workspace_id_user_id", // Use the index to efficiently query by both workspaceId and userId
        (q) => q.eq("workspaceId", args.id).eq("userId", userId) // Check if the user is a member and admin of the workspace
      )
      .unique(); // Ensure that there is only one matching member

    // If the user is not a member or is not an admin, throw an error
    if (!member || member.role !== "admin") {
      throw new Error("Unauthorized"); // Only admins are authorized to delete the workspace
    }

    // Query to find all members associated with the workspace
    const [members, channels, conversations, messages, reactions] =
      await Promise.all([
        ctx.db
          .query("members")
          .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.id)) // Find all members with the given workspaceId
          .collect(),
        ctx.db
          .query("channels")
          .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.id)) // Find all members with the given workspaceId
          .collect(),
        ctx.db
          .query("conversations")
          .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.id)) // Find all members with the given workspaceId
          .collect(),
        ctx.db
          .query("messages")
          .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.id)) // Find all members with the given workspaceId
          .collect(),
        ctx.db
          .query("reactions")
          .withIndex("by_workspace_id", (q) => q.eq("workspaceId", args.id)) // Find all members with the given workspaceId
          .collect(),
      ]); // Collect the results

    // Loop through each member and delete them
    for (const member of members) {
      await ctx.db.delete(member._id); // Delete each member associated with the workspace
    }
    for (const member of members) {
      await ctx.db.delete(member._id); // Delete each member associated with the workspace
    }
    for (const channel of channels) {
      await ctx.db.delete(channel._id); // Delete each member associated with the workspace
    }
    for (const message of messages) {
      await ctx.db.delete(message._id); // Delete each member associated with the workspace
    }
    for (const conversation of conversations) {
      await ctx.db.delete(conversation._id); // Delete each member associated with the workspace
    }
    for (const message of messages) {
      await ctx.db.delete(message._id); // Delete each member associated with the workspace
    }
    for (const reaction of reactions) {
      await ctx.db.delete(reaction._id); // Delete each member associated with the workspace
    }

    // Finally, delete the workspace itself
    await ctx.db.delete(args.id);

    // Return the ID of the deleted workspace
    return args.id;
  },
});

export const newJoinCode = mutation({
  args: {
    workspaceId: v.id("workspaces"), // Validate that 'workspaceId' is a valid ID from the "workspaces" table
  },
  handler: async (ctx, args) => {
    // Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);

    // If no user is authenticated, throw an error
    if (!userId) {
      throw new Error("Unauthorized User"); // Ensure only authenticated users can update the workspace
    }

    // Check if the user is an admin of the workspace by querying the "members" table
    const member = await ctx.db
      .query("members")
      .withIndex(
        "by_workspace_id_user_id",
        (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId) // Ensure the user is part of the workspace
      )
      .unique(); // Ensure that only one result is returned (unique combination of workspaceId and userId)

    // If the user is not an admin, throw an error
    if (!member || member.role !== "admin") {
      throw new Error("Unauthorized"); // Only admins are authorized to generate a new join code
    }

    // Generate a new unique join code
    const joinCode = generateCode(); // Assume 'generateCode()' is a helper function that generates a unique join code

    // Update the workspace's join code in the database
    await ctx.db.patch(args.workspaceId, {
      joinCode, // Update the join code in the "workspaces" table
    });

    // Return the workspace ID as confirmation
    return args.workspaceId;
  },
});

export const join = mutation({
  // Define the expected arguments for the mutation
  args: {
    joinCode: v.string(), // Validate that the 'joinCode' is a string
    workspaceId: v.id("workspaces"), // Validate that 'workspaceId' is a valid ID from the "workspaces" table
  },

  // The handler function that processes the mutation
  handler: async (ctx, args) => {
    // Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);

    // If the user is not authenticated, throw an error
    if (!userId) {
      throw new Error("Unauthorized User"); // Only authenticated users can join a workspace
    }

    // Fetch the workspace by its ID
    const workspace = await ctx.db.get(args.workspaceId);

    // If the workspace does not exist, throw an error
    if (!workspace) {
      throw new Error("Workspace not found"); // Ensure the workspace exists before proceeding
    }

    // Check if the join code provided by the user matches the workspace's join code
    if (workspace.joinCode !== args.joinCode.toLowerCase()) {
      throw new Error("Invalid join code"); // The join code is case-insensitive
    }

    // Check if the user is already a member of the workspace
    const existingMember = await ctx.db
      .query("members")
      .withIndex(
        "by_workspace_id_user_id", // Query the members using the workspaceId and userId
        (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId)
      )
      .unique(); // Ensure the query returns at most one unique result

    // If the user is already a member of the workspace, throw an error
    if (existingMember) {
      throw new Error("User already joined the workspace"); // Prevent duplicate membership
    }

    // If the user is not a member, insert them into the "members" table with the "members" role
    await ctx.db.insert("members", {
      workspaceId: workspace._id, // Associate the user with the workspace
      userId, // The authenticated user's ID
      role: "members", // Assign the default role "members" to the new user
    });

    // Return the workspace ID as confirmation
    return workspace._id;
  },
});

export const getInfoById = query({
  // Define the expected arguments for the query
  args: {
    id: v.id("workspaces"), // Validate that 'id' is a valid ID from the "workspaces" table
  },

  // The handler function that processes the query
  handler: async (ctx, args) => {
    // Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);

    // If the user is not authenticated, throw an error
    if (!userId) {
      throw new Error("Unauthorized User"); // Ensure only authenticated users can retrieve workspace information
    }

    // Check if the authenticated user is a member of the workspace
    const member = await ctx.db
      .query("members")
      .withIndex(
        "by_workspace_id_user_id",
        (q) => q.eq("workspaceId", args.id).eq("userId", userId) // Query the members by workspaceId and userId
      )
      .unique(); // Ensure the combination of workspaceId and userId is unique

    // Fetch the workspace by its ID
    const workspace = await ctx.db.get(args.id);

    // If the workspace does not exist, throw an error
    if (!workspace) {
      throw new Error("Workspace not found"); // Ensure the workspace exists before proceeding
    }

    // Return basic information about the workspace and membership status
    return {
      name: workspace?.name, // Return the name of the workspace
      isMember: !!member, // Return true if the user is a member, false otherwise
    };
  },
});
