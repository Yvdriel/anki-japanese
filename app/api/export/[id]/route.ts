import { NextRequest, NextResponse } from "next/server";
import { getDeckWithCards } from "@/lib/db";
import { getClerkUserId } from "@/lib/session";
import { getOrCreateUser } from "@/lib/db";
import {
  generateApkg,
  generateFilename,
  validateDeckData,
} from "@/lib/anki/generator";

/**
 * GET /api/export/[id]
 * Export a deck as .apkg file
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const clerkId = await getClerkUserId();
    const user = await getOrCreateUser(clerkId);

    // Get deck with cards
    const deck = await getDeckWithCards(id);

    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    // Verify ownership
    if (deck.userId !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if deck has cards
    if (deck.cards.length === 0) {
      return NextResponse.json(
        { error: "Deck has no cards to export" },
        { status: 400 }
      );
    }

    // Prepare deck data for export
    const deckData = {
      name: deck.name,
      cards: deck.cards.map((card) => ({
        kanji: card.kanji,
        readings: card.readings,
        definition: card.definition,
        guid: card.guid,
      })),
    };

    console.log(deckData);
    // Validate deck data
    const validationErrors = validateDeckData(deckData);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Invalid deck data", details: validationErrors },
        { status: 400 }
      );
    }

    // Generate .apkg file
    const apkgBuffer = await generateApkg(deckData);

    // Generate filename
    const filename = generateFilename(deck.name, deck.version);

    // Return as download
    // Convert Node.js Buffer to Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(apkgBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/apkg",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": apkgBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error exporting deck:", error);
    return NextResponse.json(
      {
        error: "Failed to export deck",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
