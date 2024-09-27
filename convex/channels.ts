import { getAuthUserId } from "@convex-dev/auth/server"; // Helper to get the authenticated user's ID
import { mutation, query } from "./_generated/server"; // Import the Convex query method
import { v } from "convex/values"; // Import Convex value validators for argument validation

// Define the query to get channels for a workspace
export const get = query({
  // Arguments for the query
  args: {
    workspaceId: v.id("workspaces"), // Validate that 'workspaceId' is a valid ID from the "workspaces" table
  },
  // The handler function that processes the query
  handler: async (ctx, args) => {
    // Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);

    // If no user is authenticated, return an empty array
    if (!userId) {
      return [];
    }

    // Check if the user is a member of the workspace
    const member = await ctx.db
      .query("members")
      .withIndex(
        "by_workspace_id_user_id",
        (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId) // Query by workspaceId and userId
      )
      .unique(); // Ensure that the combination of workspaceId and userId is unique

    // If the user is not a member, return an empty array
    if (!member) {
      return [];
    }

    // Query the "channels" table for all channels in the specified workspace
    const channels = await ctx.db
      .query("channels")
      .withIndex(
        "by_workspace_id",
        (q) => q.eq("workspaceId", args.workspaceId) // Query channels by the workspaceId
      )
      .collect(); // Collect the results into an array

    // Return the list of channels
    return channels;
  },
});

export const create = mutation({
  // Define the expected arguments for the mutation
  args: {
    name: v.string(), // Ensure 'name' is a string, which will be the channel name
    workspaceId: v.id("workspaces"), // Validate 'workspaceId' as a valid ID from the "workspaces" table
  },
  // The handler function that processes the mutation
  handler: async (ctx, args) => {
    {
      // Get the authenticated user's ID
      const userId = await getAuthUserId(ctx);

      // If no user is authenticated, throw an error
      if (!userId) {
        throw new Error("Unauthorized User");
      }

      // Check if the authenticated user is a member of the workspace and has the "admin" role
      const member = await ctx.db
        .query("members")
        .withIndex(
          "by_workspace_id_user_id", // Query by both workspaceId and userId using an index
          (q) => q.eq("workspaceId", args.workspaceId).eq("userId", userId) // Ensure the user is part of the workspace
        )
        .unique(); // Ensure that the combination of workspaceId and userId is unique

      // If the user is not a member or not an admin, throw an error
      if (!member || member.role !== "admin") {
        throw new Error("Unauthorized User"); // Only admins are allowed to create channels
      }

      // Parse the name of the channel: replace spaces with hyphens and convert to lowercase
      const parseName = args.name.replace(/\s+/g, "-").toLowerCase();

      // Insert the new channel into the "channels" table with the parsed name and workspaceId
      const channelId = await ctx.db.insert("channels", {
        name: parseName, // Store the formatted channel name
        workspaceId: args.workspaceId, // Associate the channel with the workspace
      });

      // Return the ID of the newly created channel
      return channelId;
    }
  },
});

export const getById = query({
  args: {
    id: v.id("channels"), // Validate 'id' as a valid ID from the "channels" table
  },
  handler: async (ctx, args) => {
    // Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);

    // If the user is not authenticated, return null
    if (!userId) {
      return null;
    }

    // Query the "channels" table for the channel with the specified ID
    const channel = await ctx.db.get(args.id);

    // If the channel does not exist, return null
    if (!channel) {
      return null;
    }

    // Check if the user is a member of the workspace that the channel belongs to
    const member = await ctx.db
      .query("members")
      .withIndex("by_workspace_id_user_id", (q) =>
        q.eq("workspaceId", channel.workspaceId).eq("userId", userId)
      )
      .unique(); // Ensure there is only one unique result (a valid member of the workspace)

    // If the user is NOT a member of the workspace, return null (user cannot access the channel)
    if (!member) {
      return null;
    }

    // Return the channel if the user is authenticated and is a member of the workspace
    return channel;
  },
});

export const update = mutation({
  args: {
    id: v.id("channels"), // Validate 'id' as a valid ID from the "channels" table
    name: v.string(), // Validate 'name' as a string (new channel name)
  },
  handler: async (ctx, args) => {
    // Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);

    // If no user is authenticated, throw an unauthorized error
    if (!userId) {
      throw new Error("Unauthorized User");
    }

    // Query the "channels" table for the channel with the specified ID
    const channel = await ctx.db.get(args.id);

    // If the channel does not exist, throw a 'Channel not found' error
    if (!channel) {
      throw new Error("Channel not found");
    }

    // Check if the authenticated user is a member of the workspace that the channel belongs to
    const member = await ctx.db
      .query("members")
      .withIndex(
        "by_workspace_id_user_id", // Use the index on workspaceId and userId to quickly query membership
        (q) => q.eq("workspaceId", channel.workspaceId).eq("userId", userId) // Match both workspaceId and userId
      )
      .unique(); // Ensure a unique member is returned for the workspaceId and userId combination

    // If the user is not a member or their role is not 'admin', throw an unauthorized error
    if (!member || member.role !== "admin") {
      throw new Error("Unauthorized User"); // Only members with an 'admin' role can update channels
    }

    // Perform the update in the database, setting the new name for the channel
    await ctx.db.patch(args.id, {
      name: args.name, // Update the 'name' field of the channel to the new name provided
    });

    // Return the ID of the updated channel as confirmation of the operation
    return args.id;
  },
});

export const remove = mutation({
  args: {
    id: v.id("channels"), // Validate 'id' as a valid ID from the "channels" table
  },
  handler: async (ctx, args) => {
    // Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);

    // If no user is authenticated, throw an unauthorized error
    if (!userId) {
      throw new Error("Unauthorized User");
    }

    // Query the "channels" table for the channel with the specified ID
    const channel = await ctx.db.get(args.id);

    // If the channel does not exist, throw a 'Channel not found' error
    if (!channel) {
      throw new Error("Channel not found");
    }

    // Check if the authenticated user is a member of the workspace that the channel belongs to
    const member = await ctx.db
      .query("members")
      .withIndex(
        "by_workspace_id_user_id", // Use the index on workspaceId and userId to quickly query membership
        (q) => q.eq("workspaceId", channel.workspaceId).eq("userId", userId) // Match both workspaceId and userId
      )
      .unique(); // Ensure a unique member is returned for the workspaceId and userId combination

    // If the user is not a member or their role is not 'admin', throw an unauthorized error
    if (!member || member.role !== "admin") {
      throw new Error("Unauthorized User"); // Only members with an 'admin' role can delete channels
    }

    // TODO: Remove associated messages (if needed)

    const [messages] = await Promise.all([
      ctx.db
        .query("messages")
        .withIndex("by_channel_id", (q) => q.eq("channelId", args.id))
        .collect(),
    ]);

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    // You might want to add logic here to remove messages associated with this channel
    // For example, query the 'messages' table and delete messages tied to this channel

    // Delete the channel from the database
    await ctx.db.delete(args.id);

    // Return the ID of the deleted channel as confirmation of the operation
    return args.id;
  },
});
