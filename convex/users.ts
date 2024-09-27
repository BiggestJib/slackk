// Import `getAuthUserId` to fetch the authenticated user's ID.
import { getAuthUserId } from "@convex-dev/auth/server";

// Import `query` to define a server-side query.
import { query } from "./_generated/server";

// Define a query named `Crrent` with no arguments.
export const Crrent = query({
  args: {},

  // The async handler function processes the query.
  handler: async (ctx) => {
    // Get the authenticated user's ID.
    const userId = await getAuthUserId(ctx);

    // If no user is logged in, return null.
    if (userId === null) {
      return null;
    }

    // If user is logged in, fetch their data from the database.
    return await ctx.db.get(userId);
  },
});
