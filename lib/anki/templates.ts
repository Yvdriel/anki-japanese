/**
 * Anki card templates and styling
 */

export interface CardTemplate {
  name: string;
  qfmt: string; // Question format (front of card)
  afmt: string; // Answer format (back of card)
}

export interface NoteType {
  name: string;
  fields: string[];
  templates: CardTemplate[];
  css: string;
}

/**
 * Note type for Japanese vocabulary cards
 *
 * Fields:
 * - Kanji: The Japanese word in kanji
 * - Reading: Hiragana/katakana readings
 * - Definition: English definition
 */
export const JAPANESE_VOCAB_NOTE_TYPE: NoteType = {
  name: 'Japanese Vocabulary',
  fields: ['Kanji', 'Reading', 'Definition'],
  templates: [
    {
      name: 'Recognition',
      // Front: Show only kanji
      qfmt: '<div class="kanji">{{Kanji}}</div>',
      // Back: Show kanji, hint for reading, and definition
      afmt: `<div class="kanji">{{Kanji}}</div>

<hr id="answer">

<div class="reading">{{hint:Reading}}</div>

<div class="definition">{{Definition}}</div>`,
    },
  ],
  css: `
.card {
  font-family: 'Hiragino Sans', 'Yu Gothic', 'Meiryo', sans-serif;
  text-align: center;
  color: #333;
  background-color: #fff;
  font-size: 20px;
  padding: 20px;
}

.kanji {
  font-size: 72px;
  margin: 40px 0;
  font-weight: 500;
}

.reading {
  font-size: 32px;
  color: #666;
  margin: 20px 0;
}

.definition {
  font-size: 24px;
  margin: 30px 0;
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

hr {
  border: none;
  border-top: 1px solid #ddd;
  margin: 30px 0;
}

/* Hint styling */
a.hint {
  text-decoration: none;
  color: #0066cc;
  border-bottom: 1px dashed #0066cc;
}

a.hint:hover {
  color: #0052a3;
}
`,
};
