# Anki Tools - Japanese Flashcard Generator

A Next.js web application that converts Japanese vocabulary lists into Anki flashcard decks (.apkg files).

## Features

- **3-Line Format Parser**: Paste vocabulary in simple format (kanji+reading, definition, blank line)
- **Anki Deck Generation**: Creates .apkg files with hint field support
- **Deck Management**: Store decks in PostgreSQL with version tracking
- **Smart Updates**: Add new cards to existing decks, automatically skip duplicates
- **Stable GUIDs**: Maintains consistent card IDs so Anki recognizes updates

## Vocabulary Format

```
道路（どうろ）
road, highway

先（さき、まず、セン）
before, ahead, previous, future, precedence
```

Each entry consists of:
1. Line 1: Kanji with hiragana readings in parentheses `（）`
2. Line 2: English definition(s)
3. Line 3: Blank line (separator)

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma 6
- **Authentication**: Clerk
- **Anki Generation**: Custom implementation using better-sqlite3 and JSZip
- **Styling**: Tailwind CSS 4
- **Linting**: ESLint 9
- **Deployment**: Vercel (optimized)

## Setup Instructions

### Prerequisites

- Node.js 20.18.0 LTS (or higher in the v20.x range)
- npm 10+
- PostgreSQL database

**Note**: This project uses Node.js v20 LTS. If you're using `nvm`, simply run `nvm use` in the project directory (the `.nvmrc` file specifies the correct version).

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file:
   ```bash
   # Database (example with local PostgreSQL)
   DATABASE_URL="postgresql://user:password@localhost:5432/anki_tools"
   DIRECT_URL="postgresql://user:password@localhost:5432/anki_tools"

   # Clerk Authentication (get from https://dashboard.clerk.com)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
   CLERK_SECRET_KEY="sk_test_..."
   ```

   **For Vercel Postgres**:
   ```bash
   # Get these from Vercel project settings
   DATABASE_URL="postgres://..."  # Pooled connection
   DIRECT_URL="postgres://..."    # Direct connection

   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
   CLERK_SECRET_KEY="sk_test_..."
   ```

3. **Initialize database**:
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Generate Prisma Client**:
   ```bash
   npx prisma generate
   ```

5. **Run development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### Option 1: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: Via Vercel Dashboard

1. **Create Vercel project**: Import your repository
2. **Add Postgres database**:
   - Go to Storage tab
   - Create new Postgres database
   - Copy connection strings
3. **Set environment variables**:
   - `DATABASE_URL`: Use the pooled connection string
   - `DIRECT_URL`: Use the direct connection string
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Get from Clerk dashboard
   - `CLERK_SECRET_KEY`: Get from Clerk dashboard
4. **Deploy**: Vercel will auto-deploy on push

## Usage

### Creating a Deck

1. Click "Create New Deck"
2. Enter deck name and description
3. Paste vocabulary in 3-line format
4. Review parsed cards in preview
5. Click "Create Deck"

### Updating a Deck

1. Open an existing deck
2. Click "Add Cards"
3. Paste additional vocabulary (including old + new entries)
4. System automatically skips duplicates
5. Only new cards are added

### Exporting to Anki

1. Open a deck
2. Click "Export .apkg"
3. Import the downloaded file into Anki Desktop or Mobile
4. Cards appear with:
   - **Front**: Kanji only
   - **Hint**: Click to reveal hiragana reading
   - **Back**: English definition

### Updating Anki Decks

When you update a deck and re-export:
1. Import the new .apkg into Anki
2. Anki recognizes existing cards (via GUID)
3. Only new cards are added
4. No duplicates created

## Project Structure

```
anki-tools/
├── app/                        # Next.js App Router
│   ├── api/                   # API routes
│   │   ├── decks/            # CRUD operations
│   │   └── export/           # .apkg generation
│   ├── deck/                 # Deck pages
│   │   ├── new/             # Create deck
│   │   └── [id]/            # View/edit deck
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home (deck list)
├── components/               # React components
│   ├── VocabInput.tsx       # Vocabulary textarea
│   ├── CardPreview.tsx      # Card preview
│   ├── UpdateDeckForm.tsx   # Update form
│   ├── ExportButton.tsx     # Export button
│   └── DeleteButton.tsx     # Delete button
├── lib/                     # Core logic
│   ├── parser.ts           # 3-line format parser
│   ├── db.ts               # Prisma client and queries
│   ├── session.ts          # Clerk authentication utilities
│   └── anki/               # Anki generation
│       ├── generator.ts    # .apkg file creation
│       ├── guid.ts         # Stable GUID generation
│       └── templates.ts    # Card templates
├── prisma/
│   └── schema.prisma       # Database schema
└── package.json
```

## Database Schema

```prisma
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique  // Clerk authentication ID
  email     String?  @unique
  decks     Deck[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Deck {
  id          String   @id @default(cuid())
  name        String
  description String?
  version     Int      @default(1)
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  cards       Card[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Card {
  id         String   @id @default(cuid())
  deckId     String
  deck       Deck     @relation(fields: [deckId], references: [id])
  primaryKey String   # Full first line (for duplicate detection)
  kanji      String   # Just kanji
  readings   String   # Just readings
  definition String   # English definition
  guid       String   # Stable GUID (SHA-256 of primaryKey)
  noteId     BigInt?  # Optional Anki note ID
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([deckId, primaryKey])
}
```

## Testing

### Unit Testing Parser

```bash
# Create test file
cat > __tests__/parser.test.ts << 'EOF'
import { parseVocab } from '../lib/parser';

test('parses basic vocabulary', () => {
  const input = `道路（どうろ）
road, highway

先（さき、まず、セン）
before, ahead`;

  const result = parseVocab(input);
  expect(result.cards).toHaveLength(2);
  expect(result.errors).toHaveLength(0);
});
EOF

npm test
```

### Testing Anki Import

1. **Create test deck**:
   - Use the web app to create a deck with 3-5 cards
   - Export as .apkg

2. **Import into Anki Desktop**:
   - File → Import → Select .apkg file
   - Verify cards display correctly
   - Check hint field works (click to reveal reading)

3. **Test update flow**:
   - Add more cards to the deck via web app
   - Export updated .apkg
   - Import into Anki again
   - Verify: No duplicates, new cards added

## Troubleshooting

### Prisma Client Not Found

```bash
npx prisma generate
```

### Database Connection Issues

- Check `DATABASE_URL` format
- Ensure PostgreSQL is running
- Verify credentials

### Anki Import Fails

- Check card count (max 10,000)
- Verify Japanese characters encode properly
- Ensure GUIDs are 32 characters

### Vercel Deployment Issues

- Ensure `postinstall` script exists in package.json
- Check `DIRECT_URL` is set (for migrations)
- Verify connection pooling is enabled

## Sample Data

Test with the provided `japanese_import/pokemon.md` file:

```bash
# Copy content from pokemon.md
# Paste into web app
# Should parse ~265 cards
```

## Future Enhancements

- [ ] Pre-import diff preview
- [ ] Import history tracking
- [ ] Conflict resolution (when definitions change)
- [ ] Quick card editing
- [ ] Partial deck exports
- [ ] Multiple source merging
- [ ] Card search/filter
- [ ] Audio support
- [ ] Image support

## License

MIT

## Credits

Built with:
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Clerk](https://clerk.com/)
- [better-sqlite3](https://www.npmjs.com/package/better-sqlite3)
- [JSZip](https://www.npmjs.com/package/jszip)
- [Tailwind CSS](https://tailwindcss.com/)
