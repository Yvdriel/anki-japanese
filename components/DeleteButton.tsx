'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteButtonProps {
  deckId: string;
  deckName: string;
}

export function DeleteButton({ deckId, deckName }: DeleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/decks/${deckId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete deck');
      }

      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition"
      >
        Delete Deck
      </button>
    );
  }

  return (
    <div className="relative">
      <div className="absolute right-0 top-0 bg-white p-4 rounded-lg shadow-lg border border-gray-200 z-10 min-w-80">
        <p className="font-semibold mb-2">Delete &quot;{deckName}&quot;?</p>
        <p className="text-sm text-gray-600 mb-4">
          This will permanently delete the deck and all its cards. This action cannot be undone.
        </p>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirm(false)}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
