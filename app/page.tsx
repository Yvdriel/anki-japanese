import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getAllDecks, getOrCreateUser } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { userId } = await auth();

  // Show landing page for unauthenticated users
  if (!userId) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h2 className="text-4xl font-bold mb-6">Welcome to Anki Tools</h2>
        <p className="text-xl text-gray-600 mb-8">
          Create Japanese flashcard decks from vocabulary lists and export them
          to Anki
        </p>
        <div className="space-y-4 text-left max-w-2xl mx-auto mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">Easy Deck Creation</h3>
            <p className="text-gray-600">
              Paste your vocabulary list and we&apos;ll automatically create
              flashcards
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">Anki Integration</h3>
            <p className="text-gray-600">
              Export your decks as .apkg files ready to import into Anki
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold text-lg mb-2">Cloud Storage</h3>
            <p className="text-gray-600">
              Your decks are saved and accessible from anywhere
            </p>
          </div>
        </div>
        <p className="text-gray-500 mb-4">Sign in to get started</p>
      </div>
    );
  }

  // Show decks for authenticated users
  const user = await getOrCreateUser(userId);
  const decks = await getAllDecks(user.id);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold">Your Decks</h2>
        <Link
          href="/deck/new"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Create New Deck
        </Link>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <p className="text-gray-600 text-lg mb-4">
            You don&apos;t have any decks yet.
          </p>
          <Link
            href="/deck/new"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Create Your First Deck
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <Link
              key={deck.id}
              href={`/deck/${deck.id}`}
              className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition border border-gray-200"
            >
              <h3 className="text-xl font-semibold mb-2">{deck.name}</h3>
              {deck.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {deck.description}
                </p>
              )}
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>{deck._count.cards} cards</span>
                <span>v{deck.version}</span>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Updated {new Date(deck.updatedAt).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
