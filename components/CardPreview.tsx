'use client';

import { ParsedCard } from '@/lib/parser';

interface CardPreviewProps {
  cards: ParsedCard[];
}

export function CardPreview({ cards }: CardPreviewProps) {
  if (cards.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No cards to preview. Start typing in the vocabulary input above.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Preview ({cards.length} {cards.length === 1 ? 'card' : 'cards'})
      </h3>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {cards.map((card, index) => (
          <div
            key={index}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition"
          >
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Front (Kanji)</div>
                <div className="text-2xl font-bold">{card.kanji}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Hint (Reading)</div>
                <div className="text-lg text-gray-700">{card.readings || '(none)'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Back (Definition)</div>
                <div className="text-sm text-gray-800 line-clamp-2">{card.definition}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
