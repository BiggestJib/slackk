import { mutation } from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl(); // Call Convex storage API to generate the URL
});
