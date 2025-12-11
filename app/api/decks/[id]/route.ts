import { NextRequest, NextResponse } from 'next/server';
import { prisma, getDeckWithCards } from '@/lib/db';
import { getClerkUserId } from '@/lib/session';
import { getOrCreateUser } from '@/lib/db';
import { generateStableGuid } from '@/lib/anki/guid';
import { ParsedCard } from '@/lib/parser';

/**
 * GET /api/decks/[id]
 * Get a specific deck with all its cards
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clerkId = await getClerkUserId();
    const user = await getOrCreateUser(clerkId);

    const deck = await getDeckWithCards(id);

    if (!deck) {
      return NextResponse.json(
        { error: 'Deck not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (deck.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: deck.id,
      name: deck.name,
      description: deck.description,
      version: deck.version,
      cards: deck.cards.map(card => ({
        id: card.id,
        primaryKey: card.primaryKey,
        kanji: card.kanji,
        readings: card.readings,
        definition: card.definition,
        createdAt: card.createdAt.toISOString()
      })),
      createdAt: deck.createdAt.toISOString(),
      updatedAt: deck.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Error fetching deck:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deck' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/decks/[id]
 * Update a deck by adding new cards (skips duplicates)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clerkId = await getClerkUserId();
    const user = await getOrCreateUser(clerkId);

    const body = await request.json();
    const { cards, name, description } = body;

    // Get existing deck
    const deck = await getDeckWithCards(id);

    if (!deck) {
      return NextResponse.json(
        { error: 'Deck not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (deck.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Validate input
    if (!cards || !Array.isArray(cards)) {
      return NextResponse.json(
        { error: 'Cards array is required' },
        { status: 400 }
      );
    }

    // Get existing card primary keys
    const existingKeys = new Set(deck.cards.map(c => c.primaryKey));

    // Filter to only new cards
    const newCards = cards.filter(
      (card: ParsedCard) => !existingKeys.has(card.primaryKey)
    );

    // Update deck name/description if provided
    const updates: any = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;

    // Add new cards and increment version
    const updatedDeck = await prisma.deck.update({
      where: { id },
      data: {
        ...updates,
        version: { increment: 1 },
        cards: {
          create: newCards.map((card: ParsedCard) => ({
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
      id: updatedDeck.id,
      name: updatedDeck.name,
      version: updatedDeck.version,
      added: newCards.length,
      skipped: cards.length - newCards.length,
      total: updatedDeck._count.cards,
      updatedAt: updatedDeck.updatedAt.toISOString()
    });
  } catch (error) {
    console.error('Error updating deck:', error);
    return NextResponse.json(
      { error: 'Failed to update deck' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/decks/[id]
 * Delete a deck and all its cards
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clerkId = await getClerkUserId();
    const user = await getOrCreateUser(clerkId);

    // Get deck to verify ownership
    const deck = await prisma.deck.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!deck) {
      return NextResponse.json(
        { error: 'Deck not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (deck.userId !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Delete deck (cards will be cascade deleted)
    await prisma.deck.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Deck deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting deck:', error);
    return NextResponse.json(
      { error: 'Failed to delete deck' },
      { status: 500 }
    );
  }
}
