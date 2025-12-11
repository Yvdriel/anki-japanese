/**
 * Parser for Japanese vocabulary in 3-line format:
 * Line 1: kanji（reading）
 * Line 2: English definition
 * Line 3: blank line (separator)
 */

export interface ParsedCard {
  primaryKey: string; // Full first line: "先（さき、まず、セン）"
  kanji: string; // Just the kanji: "先"
  readings: string; // Just the readings: "さき、まず、セン"
  definition: string; // English definitions
}

export interface ParseResult {
  cards: ParsedCard[];
  errors: string[];
  warnings: string[];
}

/**
 * Parse vocabulary text in 3-line format
 * @param input - Raw text with vocabulary entries
 * @returns ParseResult with cards, errors, and warnings
 */
export function parseVocab(input: string): ParseResult {
  const lines = input.split("\n");
  const cards: ParsedCard[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  for (let i = 0; i < lines.length; i += 3) {
    const line1 = lines[i]?.trim();
    const line2 = lines[i + 1]?.trim();
    const line3 = lines[i + 2];

    // Skip completely empty entries
    if (!line1 && !line2) continue;

    // Validate format
    if (!line1) {
      errors.push(`Line ${i + 1}: Empty kanji/reading line`);
      continue;
    }

    if (!line2) {
      errors.push(`Line ${i + 2}: Missing definition for "${line1}"`);
      continue;
    }

    // Check for blank line separator (allow missing at end of input)
    if (i + 2 < lines.length && line3 && line3.trim() !== "") {
      warnings.push(
        `Line ${i + 3}: Expected blank line, got "${line3.substring(0, 30)}..."`
      );
    }

    // Parse the first line to extract kanji and readings
    const match = line1.match(/^([^（]+)（([^）]+)）$/);

    if (match) {
      // Standard format: kanji（readings）
      const [, kanji, readings] = match;

      // Validate definition length
      if (line2.length > 500) {
        warnings.push(
          `Card "${line1}": Very long definition (${line2.length} chars)`
        );
      }

      cards.push({
        primaryKey: line1,
        kanji: kanji.trim(),
        readings: readings.trim(),
        definition: line2,
      });
    } else {
      // No parentheses - likely kana-only word
      warnings.push(`Card "${line1}": No readings found (kana-only word?)`);

      cards.push({
        primaryKey: line1,
        kanji: line1,
        readings: "",
        definition: line2,
      });
    }
  }

  return { cards, errors, warnings };
}

/**
 * Validate parsed cards for common issues
 * @param cards - Array of parsed cards
 * @returns Array of validation warnings
 */
export function validateCards(cards: ParsedCard[]): string[] {
  const warnings: string[] = [];
  const seen = new Set<string>();

  for (const card of cards) {
    // Check for duplicates
    if (seen.has(card.primaryKey)) {
      warnings.push(`Duplicate entry: "${card.primaryKey}"`);
    }
    seen.add(card.primaryKey);

    // Check for empty fields
    if (!card.kanji) {
      warnings.push(`Empty kanji for entry: "${card.primaryKey}"`);
    }
    if (!card.definition) {
      warnings.push(`Empty definition for entry: "${card.primaryKey}"`);
    }

    // Check for unusual characters that might not display well
    if (
      /[^\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf（）、。]/.test(
        card.kanji
      )
    ) {
      // Contains characters outside common Japanese ranges
      if (
        /[^\x00-\x7F]/.test(
          card.kanji.replace(
            /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf（）、。]/g,
            ""
          )
        )
      ) {
        warnings.push(`Unusual characters in: "${card.kanji}"`);
      }
    }
  }

  return warnings;
}
