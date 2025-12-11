import Database from 'better-sqlite3';
import JSZip from 'jszip';
import { tmpdir } from 'os';
import { join } from 'path';
import { unlinkSync } from 'fs';

export interface CardData {
  kanji: string;
  readings: string;
  definition: string;
  guid: string;
}

export interface DeckData {
  name: string;
  cards: CardData[];
}

// Model ID for our note type
const MODEL_ID = 1891274392;
const DECK_ID_BASE = 2000000000;

/**
 * Generate an Anki .apkg file from deck data
 */
export async function generateApkg(deckData: DeckData): Promise<Buffer> {
  const dbPath = join(tmpdir(), `anki-${Date.now()}.db`);
  const db = new Database(dbPath);

  try {
    // Create Anki database schema
    createAnkiSchema(db);

    // Generate stable deck ID
    const deckId = DECK_ID_BASE + Math.abs(hashCode(deckData.name));

    // Insert collection metadata
    insertCollection(db, deckId, deckData.name);

    // Insert model (note type) definition
    insertModel(db);

    // Insert all notes and cards
    insertCards(db, deckData, deckId);

    // Export database to buffer
    const dbBuffer = db.serialize();
    db.close();

    // Create .apkg (zip file)
    const zip = new JSZip();
    zip.file('collection.anki2', dbBuffer);
    zip.file('media', '{}'); // Empty media file

    const apkgBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    });

    // Clean up temp file
    try {
      unlinkSync(dbPath);
    } catch (e) {
      // Ignore cleanup errors
    }

    return apkgBuffer;
  } catch (error) {
    db.close();
    try {
      unlinkSync(dbPath);
    } catch (e) {
      // Ignore cleanup errors
    }
    throw error;
  }
}

/**
 * Create Anki database schema
 */
function createAnkiSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS col (
      id INTEGER PRIMARY KEY,
      crt INTEGER NOT NULL,
      mod INTEGER NOT NULL,
      scm INTEGER NOT NULL,
      ver INTEGER NOT NULL,
      dty INTEGER NOT NULL,
      usn INTEGER NOT NULL,
      ls INTEGER NOT NULL,
      conf TEXT NOT NULL,
      models TEXT NOT NULL,
      decks TEXT NOT NULL,
      dconf TEXT NOT NULL,
      tags TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY,
      guid TEXT NOT NULL,
      mid INTEGER NOT NULL,
      mod INTEGER NOT NULL,
      usn INTEGER NOT NULL,
      tags TEXT NOT NULL,
      flds TEXT NOT NULL,
      sfld TEXT NOT NULL,
      csum INTEGER NOT NULL,
      flags INTEGER NOT NULL,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY,
      nid INTEGER NOT NULL,
      did INTEGER NOT NULL,
      ord INTEGER NOT NULL,
      mod INTEGER NOT NULL,
      usn INTEGER NOT NULL,
      type INTEGER NOT NULL,
      queue INTEGER NOT NULL,
      due INTEGER NOT NULL,
      ivl INTEGER NOT NULL,
      factor INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      lapses INTEGER NOT NULL,
      left INTEGER NOT NULL,
      odue INTEGER NOT NULL,
      odid INTEGER NOT NULL,
      flags INTEGER NOT NULL,
      data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS revlog (
      id INTEGER PRIMARY KEY,
      cid INTEGER NOT NULL,
      usn INTEGER NOT NULL,
      ease INTEGER NOT NULL,
      ivl INTEGER NOT NULL,
      lastIvl INTEGER NOT NULL,
      factor INTEGER NOT NULL,
      time INTEGER NOT NULL,
      type INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS graves (
      usn INTEGER NOT NULL,
      oid INTEGER NOT NULL,
      type INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS ix_notes_usn ON notes (usn);
    CREATE INDEX IF NOT EXISTS ix_cards_usn ON cards (usn);
    CREATE INDEX IF NOT EXISTS ix_revlog_usn ON revlog (usn);
    CREATE INDEX IF NOT EXISTS ix_cards_nid ON cards (nid);
    CREATE INDEX IF NOT EXISTS ix_cards_sched ON cards (did, queue, due);
    CREATE INDEX IF NOT EXISTS ix_revlog_cid ON revlog (cid);
    CREATE INDEX IF NOT EXISTS ix_notes_csum ON notes (csum);
  `);
}

/**
 * Insert collection metadata
 */
function insertCollection(db: Database.Database, deckId: number, deckName: string) {
  const now = Date.now();
  const timestamp = Math.floor(now / 1000);

  const models = {
    [MODEL_ID]: {
      id: MODEL_ID,
      name: 'Japanese Vocabulary',
      type: 0,
      mod: timestamp,
      usn: -1,
      sortf: 0,
      did: deckId,
      tmpls: [
        {
          name: 'Card 1',
          ord: 0,
          qfmt: '<div class="kanji">{{Kanji}}</div>',
          afmt: '<div class="kanji">{{Kanji}}</div>\n<hr id="answer">\n<div class="reading">{{hint:Reading}}</div>\n<div class="definition">{{Definition}}</div>',
          bqfmt: '',
          bafmt: '',
          did: null,
        }
      ],
      flds: [
        { name: 'Kanji', ord: 0, sticky: false, rtl: false, font: 'Arial', size: 20 },
        { name: 'Reading', ord: 1, sticky: false, rtl: false, font: 'Arial', size: 20 },
        { name: 'Definition', ord: 2, sticky: false, rtl: false, font: 'Arial', size: 20 }
      ],
      css: `.card {
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
}
hr {
  border: none;
  border-top: 1px solid #ddd;
  margin: 30px 0;
}
a.hint {
  text-decoration: none;
  color: #0066cc;
  border-bottom: 1px dashed #0066cc;
}`,
      latexPre: '',
      latexPost: '',
      latexsvg: false,
      req: [[0, 'all', [0]]]
    }
  };

  const decks = {
    [deckId]: {
      id: deckId,
      name: deckName,
      mod: timestamp,
      usn: -1,
      lrnToday: [0, 0],
      revToday: [0, 0],
      newToday: [0, 0],
      timeToday: [0, 0],
      collapsed: false,
      browserCollapsed: false,
      desc: '',
      dyn: 0,
      conf: 1,
      extendNew: 0,
      extendRev: 0
    },
    1: {
      id: 1,
      name: 'Default',
      mod: timestamp,
      usn: -1,
      lrnToday: [0, 0],
      revToday: [0, 0],
      newToday: [0, 0],
      timeToday: [0, 0],
      collapsed: false,
      browserCollapsed: false,
      desc: '',
      dyn: 0,
      conf: 1,
      extendNew: 0,
      extendRev: 0
    }
  };

  const dconf = {
    1: {
      id: 1,
      name: 'Default',
      mod: timestamp,
      usn: -1,
      maxTaken: 60,
      autoplay: true,
      timer: 0,
      replayq: true,
      new: {
        bury: false,
        delays: [1, 10],
        initialFactor: 2500,
        ints: [1, 4, 0],
        order: 1,
        perDay: 20
      },
      rev: {
        bury: false,
        ease4: 1.3,
        ivlFct: 1,
        maxIvl: 36500,
        perDay: 200,
        hardFactor: 1.2
      },
      lapse: {
        delays: [10],
        leechAction: 0,
        leechFails: 8,
        minInt: 1,
        mult: 0
      }
    }
  };

  const conf = {
    nextPos: 1,
    estTimes: true,
    activeDecks: [deckId],
    sortType: 'noteFld',
    timeLim: 0,
    sortBackwards: false,
    addToCur: true,
    curDeck: deckId,
    newBury: true,
    newSpread: 0,
    dueCounts: true,
    curModel: MODEL_ID,
    collapseTime: 1200
  };

  db.prepare(`
    INSERT INTO col (id, crt, mod, scm, ver, dty, usn, ls, conf, models, decks, dconf, tags)
    VALUES (1, ?, ?, ?, 11, 0, 0, 0, ?, ?, ?, ?, '{}')
  `).run(
    timestamp,
    timestamp,
    timestamp,
    JSON.stringify(conf),
    JSON.stringify(models),
    JSON.stringify(decks),
    JSON.stringify(dconf)
  );
}

/**
 * Insert model definition
 */
function insertModel(db: Database.Database) {
  // Model is defined in the collection metadata
  // No separate insert needed
}

/**
 * Insert all cards
 */
function insertCards(db: Database.Database, deckData: DeckData, deckId: number) {
  const now = Date.now();
  const timestamp = Math.floor(now / 1000);

  for (let i = 0; i < deckData.cards.length; i++) {
    const card = deckData.cards[i];

    // Convert hex GUID to number
    const noteId = parseInt(card.guid.substring(0, 12), 16);
    const cardId = noteId + 1; // Card ID slightly offset from note ID

    // Fields separated by \x1f
    const fields = [card.kanji, card.readings, card.definition].join('\x1f');

    // Sort field (first field for sorting)
    const sortField = card.kanji;

    // Checksum for duplicate detection
    const checksum = simpleChecksum(sortField);

    // Insert note
    db.prepare(`
      INSERT INTO notes (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data)
      VALUES (?, ?, ?, ?, -1, '', ?, ?, ?, 0, '')
    `).run(noteId, card.guid, MODEL_ID, timestamp, fields, sortField, checksum);

    // Insert card
    db.prepare(`
      INSERT INTO cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data)
      VALUES (?, ?, ?, 0, ?, -1, 0, 0, ?, 0, 0, 0, 0, 0, 0, 0, 0, '')
    `).run(cardId, noteId, deckId, timestamp, i + 1);
  }
}

/**
 * Simple checksum for duplicate detection
 */
function simpleChecksum(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length && i < 8; i++) {
    hash = hash * 31 + text.charCodeAt(i);
  }
  return hash & 0x7FFFFFFF; // Keep positive
}

/**
 * Hash function for generating stable deck IDs
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

/**
 * Validate deck data before generation
 */
export function validateDeckData(deckData: DeckData): string[] {
  const errors: string[] = [];

  if (!deckData.name || deckData.name.trim() === '') {
    errors.push('Deck name is required');
  }

  if (!deckData.cards || deckData.cards.length === 0) {
    errors.push('Deck must contain at least one card');
  }

  if (deckData.cards.length > 10000) {
    errors.push('Deck contains too many cards (max 10,000)');
  }

  for (let i = 0; i < deckData.cards.length; i++) {
    const card = deckData.cards[i];

    if (!card.kanji) {
      errors.push(`Card ${i + 1}: Missing kanji`);
    }

    if (!card.definition) {
      errors.push(`Card ${i + 1}: Missing definition`);
    }

    if (!card.guid || card.guid.length !== 32) {
      errors.push(`Card ${i + 1}: Invalid GUID`);
    }
  }

  return errors;
}

/**
 * Generate a filename for the .apkg file
 */
export function generateFilename(deckName: string, version?: number): string {
  let sanitized = deckName
    .replace(/[^a-zA-Z0-9\s\-_]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);

  if (!sanitized) {
    sanitized = 'anki_deck';
  }

  const versionSuffix = version ? `_v${version}` : '';
  return `${sanitized}${versionSuffix}.apkg`;
}
