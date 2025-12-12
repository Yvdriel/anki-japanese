'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VocabInput } from './VocabInput';
import { CardPreview } from './CardPreview';
import { ParseResult } from '@/lib/parser';

interface UpdateDeckFormProps {
  deckId: string;
  deckName: string;
}

export function UpdateDeckForm({ deckId, deckName }: UpdateDeckFormProps) {
  const router = useRouter();
  const [parseResult, setParseResult] = useState<ParseResult>({
    cards: [],
    errors: [],
    warnings: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (parseResult.errors.length > 0) {
      setError('Please fix parsing errors before updating the deck');
      return;
    }

    if (parseResult.cards.length === 0) {
      setError('Please add at least one card');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/decks/${deckId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cards: parseResult.cards
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update deck');
      }

      const data = await response.json();
      setSuccess(
        `Successfully updated! Added ${data.added} new cards, skipped ${data.skipped} duplicates. Total: ${data.total} cards.`
      );
      setShowForm(false);

      // Refresh the page to show new cards
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-xl font-semibold mb-4">Add More Cards</h3>
        <p className="text-gray-600 mb-4">
          Paste additional vocabulary to add to &quot;{deckName}&quot;. Duplicate entries will be skipped automatically.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Add Cards
        </button>
        {success && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">Add More Cards</h3>
          <p className="text-gray-600 text-sm mb-4">
            Paste vocabulary below. Duplicate entries will be automatically skipped.
          </p>
        </div>

        <VocabInput onChange={setParseResult} />

        {parseResult.cards.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Preview New Cards</h4>
            <CardPreview cards={parseResult.cards} />
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || parseResult.cards.length === 0 || parseResult.errors.length > 0}
          >
            {loading ? 'Updating...' : 'Add Cards to Deck'}
          </button>
        </div>
      </form>
    </div>
  );
}
