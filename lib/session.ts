import { auth } from "@clerk/nextjs/server";

/**
 * Session management utilities using Clerk
 */

/**
 * Get the current user's Clerk ID
 * Throws an error if the user is not authenticated
 */
export async function getClerkUserId(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized. Please sign in to continue.");
  }

  return userId;
}
