import { notFound, redirect } from 'next/navigation';
import { getDeckWithCards } from '@/lib/db';
import { getClerkUserId } from '@/lib/session';
import { getOrCreateUser } from '@/lib/db';
import { UpdateDeckForm } from '@/components/UpdateDeckForm';
import { ExportButton } from '@/components/ExportButton';
import { DeleteButton } from '@/components/DeleteButton';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DeckDetailPage({ params }: PageProps) {
  const { id } = await params;
  const clerkId = await getClerkUserId();
  const user = await getOrCreateUser(clerkId);

  const deck = await getDeckWithCards(id);

  if (!deck) {
    notFound();
  }

  // Verify ownership
  if (deck.userId !== user.id) {
    redirect('/');
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl font-bold">{deck.name}</h2>
            {deck.description && (
              <p className="text-gray-600 mt-2">{deck.description}</p>
            )}
            <div className="flex gap-4 mt-3 text-sm text-gray-500">
              <span>{deck.cards.length} cards</span>
              <span>Version {deck.version}</span>
              <span>Updated {new Date(deck.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <ExportButton deckId={deck.id} deckName={deck.name} />
            <DeleteButton deckId={deck.id} deckName={deck.name} />
          </div>
        </div>
      </div>

      {/* Cards List */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
        <h3 className="text-xl font-semibold mb-4">Cards in This Deck</h3>

        {deck.cards.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No cards in this deck yet.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {deck.cards.map((card, index) => (
              <div
                key={card.id}
                className="p-4 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition"
              >
                <div className="grid grid-cols-4 gap-4 items-center">
                  <div className="text-gray-500 text-sm">#{index + 1}</div>
                  <div>
                    <div className="text-2xl font-bold">{card.kanji}</div>
                  </div>
                  <div>
                    <div className="text-gray-700">{card.readings || '(no reading)'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 line-clamp-2">{card.definition}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Update Form */}
      <UpdateDeckForm deckId={deck.id} deckName={deck.name} />
    </div>
  );
}
