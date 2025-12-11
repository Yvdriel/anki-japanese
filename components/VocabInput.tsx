'use client';

import { useState, useEffect } from 'react';
import { parseVocab, ParsedCard, ParseResult } from '@/lib/parser';

interface VocabInputProps {
  initialValue?: string;
  onChange: (result: ParseResult) => void;
}

export function VocabInput({ initialValue = '', onChange }: VocabInputProps) {
  const [input, setInput] = useState(initialValue);
  const [result, setResult] = useState<ParseResult>({ cards: [], errors: [], warnings: [] });

  useEffect(() => {
    // Parse input whenever it changes
    const parseResult = parseVocab(input);
    setResult(parseResult);
    onChange(parseResult);
  }, [input, onChange]);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="vocab-input" className="block text-sm font-medium text-gray-700 mb-2">
          Vocabulary Input (3-line format)
        </label>
        <textarea
          id="vocab-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={`道路（どうろ）
road, highway

先（さき、まず、セン）
before, ahead, previous, future, precedence`}
        />
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <div className="px-4 py-2 bg-green-50 text-green-700 rounded">
          {result.cards.length} cards parsed
        </div>
        {result.errors.length > 0 && (
          <div className="px-4 py-2 bg-red-50 text-red-700 rounded">
            {result.errors.length} errors
          </div>
        )}
        {result.warnings.length > 0 && (
          <div className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded">
            {result.warnings.length} warnings
          </div>
        )}
      </div>

      {/* Errors */}
      {result.errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold text-red-800 mb-2">Errors</h3>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {result.errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Warnings</h3>
          <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
            {result.warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
