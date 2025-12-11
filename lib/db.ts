import { PrismaClient } from '@/app/generated/prisma';

/**
 * Prisma Client singleton
 *
 * This ensures we only instantiate one Prisma Client instance
 * in development (where hot reloading can create multiple instances)
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Helper types for querying decks with cards
 */
export type DeckWithCards = Awaited<ReturnType<typeof getDeckWithCards>>;
export type DeckSummary = Awaited<ReturnType<typeof getAllDecks>>[number];

/**
 * Get a deck with all its cards
 */
export async function getDeckWithCards(deckId: string) {
  return prisma.deck.findUnique({
    where: { id: deckId },
    include: {
      cards: {
        orderBy: { createdAt: 'asc' }
      },
      user: {
        select: {
          id: true,
          email: true
        }
      }
    }
  });
}

/**
 * Get all decks for a user (summary view)
 */
export async function getAllDecks(userId: string) {
  return prisma.deck.findMany({
    where: { userId },
    include: {
      _count: {
        select: { cards: true }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });
}

/**
 * Get or create a user by Clerk ID
 */
export async function getOrCreateUser(clerkId: string, email?: string) {
  let user = await prisma.user.findUnique({
    where: { clerkId }
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId,
        email
      }
    });
  }

  return user;
}
