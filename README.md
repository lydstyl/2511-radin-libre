# RadinLibre

A web application to help users import and analyze their banking expenses to reduce spending and gain financial freedom.

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Prisma** with SQLite
- **React Query** (@tanstack/react-query)
- **Zod** for validation
- **Papaparse** for CSV parsing

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── page.tsx      # Home page
│   ├── transactions/ # Transactions page
│   └── categories/   # Categories page
├── components/       # Reusable UI components
├── domain/           # Pure functions for business logic
└── lib/              # Utilities and database client
    └── prisma.ts     # Prisma client singleton

prisma/
├── schema.prisma     # Database schema
└── seed.ts           # Database seed script
```

## Database Schema

- **Transaction**: id, date, description, amount, categoryId (nullable), createdAt, updatedAt
- **Category**: id, name (unique), color (optional), createdAt

## Getting Started

### Install dependencies

```bash
npm install
```

### Set up the database

The database is already initialized with SQLite. To reset and seed it:

```bash
npx prisma migrate reset
```

Or just seed:

```bash
npm run db:seed
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Pages

- `/` - Home page displaying "RadinLibre"
- `/transactions` - Transaction management (placeholder)
- `/categories` - Category management (placeholder)

## Development Conventions

- **Code**: English (comments, variables, functions, filenames)
- **UI**: French (all user-facing text)
- **Architecture**: Pure functions in `src/domain/` (no classes)
- **Testing**: TDD for domain logic (not yet implemented)

## Next Steps

- Implement CSV import functionality
- Add expense filtering and analysis
- Implement Pareto cumulative calculations
- Create UI components for transaction and category management
