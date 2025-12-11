'use client';

import { useState } from 'react';

interface ExportButtonProps {
  deckId: string;
  deckName: string;
}

export function ExportButton({ deckId, deckName }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExport = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/export/${deckId}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to export deck');
      }

      // Get the filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${deckName}.apkg`;

      if (contentDisposition) {
        const matches = /filename="([^"]+)"/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleExport}
        disabled={loading}
        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Exporting...' : 'Export .apkg'}
      </button>
      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
