import { v } from "convex/values"; // Import value validators from Convex
import { mutation, query, QueryCtx } from "./_generated/server"; // Import mutation and query context for server-side logic
import { getAuthUserId } from "@convex-dev/auth/server"; // Import function to get the authenticated user ID
import { Doc, Id } from "./_generated/dataModel"; // Import type definitions for IDs from the data model
import { paginationOptsValidator } from "convex/server";

// Helper function to retrieve a member by workspaceId and userId
const getMember = async (
  ctx: QueryCtx,
  workspaceId: Id<"workspaces">,
  userId: Id<"users">
) => {
  // Query the `members` table with an index to find the specific member by workspace and user
  return ctx.db
    .query("members")
    .withIndex("by_workspace_id_user_id", (q) =>
      q.eq("workspaceId", workspaceId).eq("userId", userId)
    )
    .unique(); // Ensure only one result is returned
};

export const create = mutation({
  // Define the arguments required for this mutation
  args: {
    body: v.string(), // The message body, which must be a string
    image: v.optional(v.id("_storage")), // Optional image ID from Convex storage
    workspaceId: v.id("workspaces"), // The workspace ID where the message will be posted
    channelId: v.optional(v.id("channels")), // Optional channel ID for channel-based messages
    conversationId: v.optional(v.id("conversations")), // Optional conversation ID for direct messages
    parentMessageId: v.optional(v.id("messages")), // Optional parent message ID for replies
  },
  handler: async (ctx, args) => {
    // Get the current authenticated user ID
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized"); // Throw an error if the user is not authenticated
    }

    // Retrieve the member object using the workspace ID and user ID
    const member = await getMember(ctx, args.workspaceId, userId);
    if (!member) {
      throw new Error("Unauthorized"); // Throw an error if the user is not a member of the workspace
    }

    let _conversationId = args.conversationId; // Initialize the conversation ID variable

    // If no conversationId and no channelId, but there is a parentMessageId, retrieve the conversationId from the parent message
    if (!args.conversationId && !args.channelId && args.parentMessageId) {
      const parentMessage = await ctx.db.get(args.parentMessageId); // Get the parent message
      if (!parentMessage) {
        throw new Error("Parent message not found"); // Throw an error if the parent message doesn't exist
      }
      _conversationId = parentMessage.conversationId; // Use the parent message's conversation ID
    }

    // Insert a new message into the `messages` table
    const messageId = await ctx.db.insert("messages", {
      memberId: member._id, // Reference the member ID who is sending the message
      body: args.body, // Store the message body
      image: args.image, // Store the optional image (if provided)
      channelId: args.channelId, // Store the optional channel ID (if it's a channel message)
      workspaceId: args.workspaceId, // Store the workspace ID where the message is posted
      conversationId: _conversationId, // Store the conversation ID for direct messages (if applicable)
      parentMessageId: args.parentMessageId, // Store the optional parent message ID (for replies)
    });

    return messageId; // Return the new message ID to the client
  },
});

// Function to populate user data by their user ID
const populateUser = (ctx: QueryCtx, userId: Id<"users">) => {
  return ctx.db.get(userId); // Fetch the user document from the "users" table using their userId
};

// Function to populate member data by their member ID
const populateMember = (ctx: QueryCtx, memberId: Id<"members">) => {
  return ctx.db.get(memberId); // Fetch the member document from the "members" table using their memberId
};

// Function to populate all reactions associated with a given message
const populateReactions = (ctx: QueryCtx, messageId: Id<"messages">) => {
  // Query the "reactions" table to get all reactions for the specified messageId
  return ctx.db
    .query("reactions")
    .withIndex("by_message_id", (q) => q.eq("messageId", messageId)) // Use an index to filter reactions by messageId
    .collect(); // Collect the results into an array
};

// Function to populate the thread of replies for a specific message
const populateThread = async (ctx: QueryCtx, messageId: Id<"messages">) => {
  // Query the "messages" table to find all messages that are replies to the specified messageId (parentMessageId)
  const messages = await ctx.db
    .query("messages")
    .withIndex(
      "by_parent_message_id",
      (q) => q.eq("parentMessageId", messageId) // Filter messages by parentMessageId
    )
    .collect(); // Collect the result as an array

  // If no replies are found, return an empty thread result
  if (messages.length === 0) {
    return {
      count: 0, // No replies, so the count is 0
      image: undefined, // No user image
      timeStamp: 0, // No timestamp since there are no replies
      name: "",
    };
  }

  // Get the last message in the thread (the most recent reply)
  const lastMessage = messages[messages.length - 1];

  // Populate the member who sent the last message
  const lastMessageMember = await populateMember(ctx, lastMessage.memberId);
  if (!lastMessageMember) {
    // If the member who sent the last message is not found, return an empty thread result
    return {
      count: 0,
      image: undefined,
      timeStamp: 0,
      name: "",
    };
  }

  // Populate the user associated with the member who sent the last message
  const lastMessagesUser = await populateUser(ctx, lastMessageMember.userId);

  // Return the populated thread information, including:
  // - The number of replies (count)
  // - The user's image (if available)
  // - The timestamp of the last message in the thread
  return {
    count: messages.length, // Total number of replies
    image: lastMessagesUser?.image, // The image of the user who sent the last message (if available)
    timeStamp: lastMessage._creationTime, // Timestamp of the last message in the thread
    name: lastMessagesUser?.name, // The name of the user who sent the last message
  };
};

export const get = query({
  args: {
    channelId: v.optional(v.id("channels")),
    conversationId: v.optional(v.id("conversations")),
    parentMessageId: v.optional(v.id("messages")),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    // Get the current authenticated user ID
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized"); // Throw an error if the user is not authenticated
    }

    let _conversationId = args.conversationId; // Initialize the conversation ID variable

    // If no conversationId and no channelId, but there is a parentMessageId, retrieve the conversationId from the parent message
    if (!args.conversationId && !args.channelId && args.parentMessageId) {
      const parentMessage = await ctx.db.get(args.parentMessageId); // Get the parent message
      if (!parentMessage) {
        throw new Error("Parent message not found");
      }
      _conversationId = parentMessage.conversationId; // Use the parent message's conversation ID
    }

    // Fetch the paginated results
    const results = await ctx.db
      .query("messages")
      .withIndex("by_channel_id_parent_message_id_conversation_id", (q) =>
        q
          .eq("channelId", args.channelId)
          .eq("parentMessageId", args.parentMessageId)
          .eq("conversationId", _conversationId)
      )
      .order("desc")
      .paginate(args.paginationOpts);

    return {
      ...results,
      page: (
        await Promise.all(
          results.page.map(async (message) => {
            const member = await populateMember(ctx, message.memberId);
            const user = member
              ? await populateUser(ctx, member?.userId)
              : null;

            if (!member || !user) {
              return null;
            }

            const reactions = await populateReactions(ctx, message._id);
            const thread = await populateThread(ctx, message._id);
            const image = message.image
              ? await ctx.storage.getUrl(message.image)
              : undefined;

            const reactionWithCounts = reactions.map((reaction) => {
              return {
                ...reaction,
                count: reactions.filter((r) => r.value === reaction.value)
                  .length,
              };
            });

            // Deduplicate reactions by their value and merge member IDs
            const dedupedReactions = reactionWithCounts.reduce(
              (acc, reaction) => {
                const existingReaction = acc.find(
                  (r) => r.value === reaction.value
                );
                if (existingReaction) {
                  existingReaction.memberIds = Array.from(
                    new Set([...existingReaction.memberIds, reaction.memberId])
                  );
                } else {
                  acc.push({
                    ...reaction,
                    memberIds: [reaction.memberId],
                  });
                }
                return acc;
              },
              [] as (Doc<"reactions"> & {
                count: number;
                memberIds: Id<"members">[];
              })[]
            );

            // Exclude the `memberId` field from the deduplicated reactions
            const reactionsWithoutMemberId = dedupedReactions.map(
              ({ memberId, ...rest }) => rest
            );

            // Return the final message object with deduplicated reactions
            return {
              ...message,
              user,
              member,
              reactions: reactionsWithoutMemberId,
              threadCount: thread.count,
              threadImage: thread.image,
              threadTimeStamp: thread.timeStamp,
              threadName: thread.name,
              image,
            };
          })
        )
      ).filter(
        (message): message is NonNullable<typeof message> => message !== null
      ),
    };
  },
});

export const update = mutation({
  args: {
    id: v.id("messages"), // Validate that 'id' is a valid message ID
    body: v.string(), // Validate that 'body' is a string (the updated message body)
  },
  handler: async (ctx, args) => {
    // Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);

    // If no user is authenticated, throw an error
    if (!userId) {
      throw new Error("Unauthorized"); // Only authenticated users can update messages
    }

    // Fetch the message by ID
    const message = await ctx.db.get(args.id);

    // If the message is not found, throw an error
    if (!message) {
      throw new Error("Message not found"); // Ensure the message exists
    }

    // Fetch the user's membership status within the workspace
    const member = await getMember(ctx, message.workspaceId, userId);

    // Check if the user is the author of the message; if not, throw an error
    if (!member || member._id !== message.memberId) {
      throw new Error("Unauthorized to update this message"); // Only the author of the message can update it
    }

    // Update the message's body and timestamp in the database
    await ctx.db.patch(args.id, {
      body: args.body, // Update the message body
      updatedAt: Date.now(), // Set the current timestamp as the updated time
    });

    // Return the ID of the updated message as confirmation
    return args.id;
  },
});

export const remove = mutation({
  args: {
    id: v.id("messages"), // Validate that 'id' is a valid message ID
  },
  handler: async (ctx, args) => {
    // Get the authenticated user's ID
    const userId = await getAuthUserId(ctx);

    // If no user is authenticated, throw an error
    if (!userId) {
      throw new Error("Unauthorized"); // Only authenticated users can delete messages
    }

    // Fetch the message by ID
    const message = await ctx.db.get(args.id);

    // If the message is not found, throw an error
    if (!message) {
      throw new Error("Message not found"); // Ensure the message exists
    }

    // Fetch the user's membership status within the workspace
    const member = await getMember(ctx, message.workspaceId, userId);

    // Check if the user is the author of the message; if not, throw an error
    if (!member || member._id !== message.memberId) {
      throw new Error("Unauthorized to delete this message"); // Only the author of the message can delete it
    }

    // Delete the message from the database
    await ctx.db.delete(args.id);

    // Return the ID of the deleted message as confirmation
    return args.id;
  },
});

export const getById = query({
  // Arguments required for this query, specifically the ID of the message
  args: {
    id: v.id("messages"), // Validate that the ID passed is a valid message ID
  },
  handler: async (ctx, args) => {
    // Step 1: Get the authenticated user ID
    const userId = await getAuthUserId(ctx);

    // If the user is not authenticated, return null (the user cannot access the message)
    if (!userId) {
      return null;
    }

    // Step 2: Fetch the message by its ID
    const message = await ctx.db.get(args.id);

    // If the message does not exist, return null
    if (!message) {
      return null;
    }

    // Step 3: Check if the authenticated user is a member of the workspace where the message exists
    // (Assume getMember is a function that checks if the user is part of the workspace)
    const currentMember = await getMember(ctx, message.workspaceId, userId);

    // If the user is not a member of the workspace, return null
    if (!currentMember) {
      return null;
    }

    // Step 4: Fetch the member who posted the message
    const member = await populateMember(ctx, message.memberId);

    // If the member is not found, return null
    if (!member) {
      return null;
    }

    // Step 5: Fetch the user information for the member who posted the message
    const user = await populateUser(ctx, member?.userId);

    // If the user doesn't exist, return null
    if (!user) {
      return null;
    }

    // Step 6: Fetch all reactions related to the message
    const reactions = await populateReactions(ctx, message._id);

    // Step 7: Count and deduplicate reactions (group by reaction value and count member IDs)
    const reactionWithCounts = reactions.map((reaction) => {
      return {
        ...reaction,
        count: reactions.filter((r) => r.value === reaction.value).length, // Count how many times this reaction type has been used
      };
    });

    const dedupedReactions = reactionWithCounts.reduce(
      (acc, reaction) => {
        const existingReaction = acc.find((r) => r.value === reaction.value);

        if (existingReaction) {
          // Combine memberIds to avoid duplication
          existingReaction.memberIds = Array.from(
            new Set([...existingReaction.memberIds, reaction.memberId])
          );
        } else {
          acc.push({
            ...reaction,
            memberIds: [reaction.memberId], // Store the memberId who made the reaction
          });
        }
        return acc;
      },
      [] as (Doc<"reactions"> & {
        count: number;
        memberIds: Id<"members">[]; // Ensure that memberIds is an array of member IDs
      })[]
    );

    // Step 8: Return reactions without individual memberId (optional depending on your frontend)
    const reactionsWithoutMemberId = dedupedReactions.map(
      ({ memberId, ...rest }) => rest
    );

    // Step 9: Return the message data along with enriched information:
    // - Image URL if any
    // - The user who posted the message
    // - The member object
    // - All the reactions with counts and deduplication
    return {
      ...message,
      image: message.image
        ? await ctx.storage.getUrl(message.image) // Get the image URL if an image is attached to the message
        : undefined, // Return undefined if there's no image
      user, // The user who posted the message
      member, // The member who posted the message
      reactions: reactionsWithoutMemberId, // Reactions to the message with deduplication and counts
    };
  },
});
