import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server"; // Import authentication tables for managing user data
import { v } from "convex/values"; // Import value validators for defining schema rules

// Define the schema for the application
const schema = defineSchema({
  // Include the authentication tables like `users` by spreading `authTables`
  ...authTables, // Merges authentication-related tables into the schema

  // Define a table for `workspaces`, representing collaborative spaces
  workspaces: defineTable({
    name: v.string(), // The name of the workspace, must be a string
    userId: v.id("users"), // References the `users` table for the owner of the workspace
    joinCode: v.string(), // A string used for inviting members to the workspace
  }),

  // Define a table for `members` to track workspace membership
  members: defineTable({
    userId: v.id("users"), // References the `users` table for the user who is a member
    workspaceId: v.id("workspaces"), // References the `workspaces` table for the workspace the user belongs to
    role: v.union(v.literal("admin"), v.literal("members")), // Restrict the role to either 'admin' or 'members'
  })
    // Indexes for faster querying
    .index("by_user_id", ["userId"]) // Create an index to search members by `userId`
    .index("by_workspace_id", ["workspaceId"]) // Create an index to search members by `workspaceId`
    .index("by_workspace_id_user_id", ["workspaceId", "userId"]), // A compound index to search by both `workspaceId` and `userId`

  // Define a table for `channels` where conversations happen within workspaces
  channels: defineTable({
    workspaceId: v.id("workspaces"), // References the `workspaces` table for the workspace the channel belongs to
    name: v.string(), // The name of the channel, must be a string
  }).index("by_workspace_id", ["workspaceId"]), // Create an index to search channels by `workspaceId`

  // Define a table for `conversations`, representing direct messages between members
  conversations: defineTable({
    memberOneId: v.id("members"), // References the first member involved in the conversation
    memberTwoId: v.id("members"), // References the second member involved in the conversation
    workspaceId: v.id("workspaces"), // References the workspace where the conversation happens
  }).index("by_workspace_id", ["workspaceId"]), // Create an index to search conversations by `workspaceId`

  // Define a table for `messages`, storing messages sent in channels or direct conversations
  messages: defineTable({
    body: v.string(), // The message body, must be a string
    image: v.optional(v.id("_storage")), // An optional reference to an image stored in Convex's storage
    memberId: v.id("members"), // References the `members` table for the member sending the message
    workspaceId: v.id("workspaces"), // References the workspace where the message is sent
    channelId: v.optional(v.id("channels")), // Optional reference to a channel (if the message is in a channel)
    parentMessageId: v.optional(v.id("messages")), // Optional reference for replies to other messages
    conversationId: v.optional(v.id("conversations")), // Optional reference to a conversation (if the message is a DM)
    updatedAt: v.optional(v.number()), // Timestamp for when the message was last updated
  })
    .index("by_workspace_id", ["workspaceId"]) // Create an index to search messages by `workspaceId`
    .index("by_member_id", ["memberId"]) // Create an index to search messages by `memberId`
    .index("by_channel_id", ["channelId"]) // Create an index to search messages by `channelId`
    .index("by_conversationId", ["conversationId"]) // Create an index to search messages by `conversationId`

    .index("by_parent_message_id", ["parentMessageId"]) // Create an index to search messages by parentMessageId
    .index("by_channel_id_parent_message_id_conversation_id", [
      "channelId",
      "parentMessageId",
      "conversationId",
    ]), // Compound index for advanced querying

  // Define a table for `reactions`, storing emoji reactions or responses to messages
  reactions: defineTable({
    memberId: v.id("members"), // References the `members` table for the member who reacted
    workspaceId: v.id("workspaces"), // References the workspace where the reaction occurred
    messageId: v.id("messages"), // References the `messages` table for the message being reacted to
    value: v.string(), // The type of reaction, stored as a string (e.g., "like", "heart")
  })
    .index("by_workspace_id", ["workspaceId"]) // Create an index to search reactions by `workspaceId`
    .index("by_message_id", ["messageId"]) // Create an index to search reactions by `messageId`
    .index("by_member_id", ["memberId"]), // Create an index to search reactions by `memberId`
});

// Export the schema for use in the Convex application
export default schema;
