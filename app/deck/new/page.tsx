"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VocabInput } from "@/components/VocabInput";
import { CardPreview } from "@/components/CardPreview";
import { ParseResult } from "@/lib/parser";

export default function NewDeckPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parseResult, setParseResult] = useState<ParseResult>({
    cards: [],
    errors: [],
    warnings: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!name.trim()) {
      setError("Deck name is required");
      return;
    }

    if (parseResult.errors.length > 0) {
      setError("Please fix parsing errors before creating the deck");
      return;
    }

    if (parseResult.cards.length === 0) {
      setError("Please add at least one card");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/decks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          cards: parseResult.cards,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create deck");
      }

      const data = await response.json();
      router.push(`/deck/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-8">Create New Deck</h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Deck Info */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-xl font-semibold mb-4">Deck Information</h3>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Deck Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Pokemon Vocabulary"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description (optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="A brief description of this deck"
              />
            </div>
          </div>
        </div>

        {/* Vocabulary Input */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-xl font-semibold mb-4">Vocabulary Cards</h3>
          <VocabInput onChange={setParseResult} />
        </div>

        {/* Card Preview */}
        {parseResult.cards.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <CardPreview cards={parseResult.cards} />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={
              loading ||
              parseResult.cards.length === 0 ||
              parseResult.errors.length > 0
            }
          >
            {loading ? "Creating..." : "Create Deck"}
          </button>
        </div>
      </form>
    </div>
  );
}
