import { NextRequest, NextResponse } from 'next/server';
import { prisma, getAllDecks } from '@/lib/db';
import { getClerkUserId } from '@/lib/session';
import { getOrCreateUser } from '@/lib/db';
import { generateStableGuid } from '@/lib/anki/guid';
import { ParsedCard } from '@/lib/parser';

/**
 * GET /api/decks
 * Get all decks for the current user
 */
export async function GET() {
  try {
    const clerkId = await getClerkUserId();
    const user = await getOrCreateUser(clerkId);

    const decks = await getAllDecks(user.id);

    return NextResponse.json({
      decks: decks.map(deck => ({
        id: deck.id,
        name: deck.name,
        description: deck.description,
        version: deck.version,
        cardCount: deck._count.cards,
        createdAt: deck.createdAt.toISOString(),
        updatedAt: deck.updatedAt.toISOString()
      }))
    });
  } catch (error) {
    console.error('Error fetching decks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch decks' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/decks
 * Create a new deck with cards
 */
export async function POST(request: NextRequest) {
  try {
    const clerkId = await getClerkUserId();
    const user = await getOrCreateUser(clerkId);

    const body = await request.json();
    const { name, description, cards } = body;

    // Validate input
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Deck name is required' },
        { status: 400 }
      );
    }

    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json(
        { error: 'At least one card is required' },
        { status: 400 }
      );
    }

    // Create deck with cards
    const deck = await prisma.deck.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        userId: user.id,
        cards: {
          create: cards.map((card: ParsedCard) => ({
            primaryKey: card.primaryKey,
            kanji: card.kanji,
            readings: card.readings,
            definition: card.definition,
            guid: generateStableGuid(card.primaryKey)
          }))
        }
      },
      include: {
        _count: {
          select: { cards: true }
        }
      }
    });

    return NextResponse.json({
      id: deck.id,
      name: deck.name,
      description: deck.description,
      version: deck.version,
      cardCount: deck._count.cards,
      createdAt: deck.createdAt.toISOString(),
      updatedAt: deck.updatedAt.toISOString()
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating deck:', error);
    return NextResponse.json(
      { error: 'Failed to create deck' },
      { status: 500 }
    );
  }
}
