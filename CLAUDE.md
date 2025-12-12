# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Anki Tools is a Next.js 15 application that converts Japanese vocabulary lists into Anki flashcard decks (.apkg files). Users paste vocabulary in a simple 3-line format, and the app generates downloadable Anki decks with stable GUIDs to support incremental updates.

## Technology Stack

**Runtime & Package Manager:**
- Node.js: v20.18.0 LTS (specified in `.nvmrc`)
- npm: 10+

**Core Framework & Libraries:**
- Next.js: 15.5.7 (App Router)
- React: 19.x
- TypeScript: 5.x

**Database & ORM:**
- Prisma: 6.19.1
- PostgreSQL (via Neon or local)
- Custom Prisma client location: `app/generated/prisma`

**Styling & UI:**
- Tailwind CSS: 4.x (CSS-based configuration)
- PostCSS: 8.4.x with `@tailwindcss/postcss` plugin

**Development Tools:**
- ESLint: 9.x (flat config format in `eslint.config.mjs`)
- eslint-config-next: 15.5.7

**Authentication:**
- Clerk: 6.x

**Anki Generation:**
- better-sqlite3: 12.5.0 (native module)
- JSZip: 3.10.1

**Important Notes:**
- The project uses Node.js v20 LTS for better native module support (better-sqlite3)
- Tailwind CSS 4 uses CSS-based configuration (`@import "tailwindcss"` in `globals.css`) instead of `tailwind.config.ts`
- ESLint uses flat config format with FlatCompat for Next.js integration
- The `.next` directory is ignored in ESLint config

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production (includes Prisma generation and migrations)
npm run build

# Linting
npm run lint

# Database operations
npx prisma generate              # Generate Prisma client
npx prisma migrate dev           # Run migrations in development
npx prisma migrate deploy        # Deploy migrations in production
npx prisma studio                # Open Prisma Studio (database GUI)
```

## Environment Setup

Required environment variables in `.env.local`:

```bash
DATABASE_URL=postgresql://...     # Pooled connection (for queries)
DIRECT_URL=postgresql://...       # Direct connection (for migrations)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

See `.env.example` for full reference.

## Architecture

### Core Data Flow

1. **Vocabulary Parsing** (`lib/parser.ts`): Parses 3-line format (kanji+readings, definition, blank line)
2. **GUID Generation** (`lib/anki/guid.ts`): Creates stable 32-char hex GUIDs via SHA-256 of primaryKey
3. **Database Storage** (Prisma): Stores decks and cards with unique constraint on `[deckId, primaryKey]`
4. **Anki Generation** (`lib/anki/generator.ts`): Creates .apkg files using better-sqlite3 and JSZip

### Key Design Decisions

**Stable GUIDs for Updates**: The GUID is generated from the full first line (primaryKey) which includes kanji and ALL readings. This ensures:
- When re-importing a deck, existing cards are recognized (no duplicates)
- Updating a definition doesn't create a new card
- The primaryKey uniqueness constraint prevents duplicate cards within a deck

**Vocabulary Format**: Each entry is exactly 3 lines:
```
道路（どうろ）
road, highway

```
Line 1 contains kanji with hiragana readings in full-width parentheses `（）`. Multiple readings are separated by commas.

**Database Constraints**:
- `@@unique([deckId, primaryKey])` on Card model prevents duplicates
- Cascading deletes ensure referential integrity
- Prisma client generated to custom location: `app/generated/prisma`

### Authentication

Uses Clerk for authentication. All routes under `/deck/*` and `/api/*` require authentication (see `middleware.ts`). User identification is via `clerkId` stored in the User model.

### Prisma Client Location

The Prisma client is generated to a non-standard location (`app/generated/prisma`) as specified in `prisma/schema.prisma`. Always import from this location:

```typescript
import prisma from '@/lib/db';  // NOT from @prisma/client directly
```

## API Routes

- `POST /api/decks` - Create new deck with cards
- `GET /api/decks` - List user's decks
- `GET /api/decks/[id]` - Get single deck with cards
- `PUT /api/decks/[id]` - Update deck (add new cards, skip duplicates)
- `DELETE /api/decks/[id]` - Delete deck
- `GET /api/export/[id]` - Generate and download .apkg file

## Anki .apkg Generation

The generator (`lib/anki/generator.ts`) manually creates an Anki database using better-sqlite3:

1. Creates SQLite database with Anki schema (col, notes, cards, revlog, graves tables)
2. Inserts collection metadata with model/deck definitions
3. Converts string GUIDs to numeric note IDs for SQLite: `parseInt(guid.substring(0, 12), 16)`
4. Uses consistent model ID (1891274392) for "Japanese Vocabulary" note type
5. Packages SQLite database and empty media file as .apkg (ZIP format)

Card template displays:
- Front: Kanji only
- Hint: Readings (click to reveal)
- Back: Definition

## Database Schema Notes

- User: Links to Clerk via `clerkId`, owns multiple decks
- Deck: Has name, description, version, belongs to User
- Card: Stores parsed fields (kanji, readings, definition), plus `primaryKey` for deduplication and `guid` for Anki compatibility

The `primaryKey` field stores the full first line verbatim (e.g., "先（さき、まず、セン）") and serves as the source for GUID generation and duplicate detection.

## Testing Workflow

1. Create test deck via web interface with sample vocabulary
2. Export as .apkg and import into Anki Desktop
3. Verify cards display correctly (kanji front, hint for reading, definition back)
4. Add more cards to same deck in web app
5. Re-export and re-import into Anki
6. Verify no duplicates created, only new cards added

Sample data available in `japanese_import/pokemon.md` (~265 cards).
