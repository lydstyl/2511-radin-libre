# RadinLibre - Architecture Guide for Claude

## Project Overview

**RadinLibre** is a financial expense management web application designed to help users import and analyze their banking expenses to reduce spending and gain financial freedom. The application is built with modern web technologies and follows a clean, organized architecture pattern.

**Key Purpose**: Aggregate banking transactions, categorize expenses, and provide analysis tools to help users understand and optimize their spending patterns.

## Technology Stack

### Core Framework
- **Next.js 16** (App Router) - React-based full-stack framework with built-in routing, server components, and API routes
- **React 19.2.0** - UI library for component composition
- **TypeScript 5** - Strongly typed JavaScript for type safety

### Database & ORM
- **Prisma 6.19.0** - Database ORM with type-safe database access
- **SQLite** - Lightweight, file-based database (suitable for development/small deployments)
- **Database file**: `prisma/dev.db` (created on first run)

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS framework with modern features
- **PostCSS 4** - CSS processor with Tailwind plugin
- **Geist fonts** - Next.js official font family

### Data & State Management
- **@tanstack/react-query 5.90.7** - Server state management with caching, synchronization, and background refetching
- **Zod 4.1.12** - TypeScript-first schema validation library
- **Papaparse 5.5.3** - CSV parsing library for transaction imports

### Development Tools
- **ESLint 9** - JavaScript linter with Next.js configuration
- **tsx 4.20.6** - TypeScript executor for Node.js scripts

## Project Structure & Organization

```
/home/gab/apps/2511-radin-libre/
├── src/                           # Source code root
│   ├── app/                        # Next.js App Router pages and layouts
│   │   ├── layout.tsx              # Root layout component (French UI)
│   │   ├── page.tsx                # Home page "/"
│   │   ├── globals.css             # Global styles with Tailwind
│   │   ├── transactions/
│   │   │   └── page.tsx            # Transactions page "/transactions" (placeholder)
│   │   └── categories/
│   │       └── page.tsx            # Categories page "/categories" (placeholder)
│   ├── components/                 # Reusable UI components
│   │   └── Navigation.tsx           # Client-side navigation bar component
│   ├── domain/                      # (Empty) Business logic layer
│   │   └── [To be filled]           # Pure functions for domain logic
│   └── lib/                         # Utilities and singleton services
│       └── prisma.ts               # Prisma client singleton with development safeguards
├── prisma/                         # Database schema and migrations
│   ├── schema.prisma               # Prisma data model (Category, Transaction)
│   ├── seed.ts                     # Database seeding script with sample data
│   ├── dev.db                      # SQLite database file
│   └── migrations/                 # Migration history directory
├── public/                         # Static assets (images, icons)
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── next.config.ts                  # Next.js configuration
├── postcss.config.mjs              # PostCSS configuration for Tailwind
├── eslint.config.mjs               # ESLint configuration
├── prisma.config.ts                # Prisma CLI configuration
├── .env                            # Environment variables (DATABASE_URL)
├── .gitignore                      # Git ignore rules
└── README.md                       # Project README
```

## Key Architectural Patterns

### 1. Database Layer (Prisma Singleton Pattern)
Located in: `/home/gab/apps/2511-radin-libre/src/lib/prisma.ts`

```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Pattern Benefit**: Prevents multiple Prisma Client instances in Next.js development mode where modules are reloaded frequently. In development, the singleton is attached to globalThis; in production, a new instance is created per request.

### 2. Next.js App Router Architecture
- **Server Components by default**: Pages and layouts are server components unless marked with `"use client"`
- **Client Components**: Only `Navigation.tsx` uses `"use client"` because it needs `usePathname()` hook
- **File-based routing**: URLs map directly to file structure (e.g., `/src/app/transactions/page.tsx` → `/transactions`)

### 3. Separation of Concerns
- **`/app`**: Presentation and routing (Server + Client components)
- **`/components`**: Reusable UI components
- **`/domain`** (currently empty): Intended for pure business logic functions
- **`/lib`**: Infrastructure and utilities (Prisma client, helpers)
- **`/prisma`**: Data access schema and migrations

### 4. Language Convention
- **Code**: English (comments, variable names, function names, filenames)
- **UI**: French (all user-facing text in components)
- Database seed includes French category names: "Alimentation", "Transport"

## Database Schema

### Models

#### Category
```prisma
model Category {
  id          Int           @id @default(autoincrement())
  name        String        @unique
  color       String?       // Optional hex color for UI display
  createdAt   DateTime      @default(now())
  transactions Transaction[] // One-to-many relationship
}
```

#### Transaction
```prisma
model Transaction {
  id          Int       @id @default(autoincrement())
  date        DateTime
  description String
  amount      Float
  categoryId  Int?      // Optional foreign key to Category
  category    Category? @relation(fields: [categoryId], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

**Key Design Decisions**:
- Transactions can exist without a category (null categoryId)
- Categories have unique names (prevents duplicates)
- Timestamps track creation and updates
- Amounts stored as Float (for currency values)
- Relationship: One Category → Many Transactions

## Development Commands & Workflows

### From package.json

```bash
# Start development server with hot-reload
npm run dev

# Build production bundle
npm build

# Start production server
npm start

# Run ESLint for code quality
npm lint

# Seed database with sample data
npm run db:seed
```

### Prisma Commands (from CLI)

```bash
# Reset database and run migrations + seeding
npx prisma migrate reset

# Generate Prisma Client after schema changes
npx prisma generate

# Open Prisma Studio (GUI for database management)
npx prisma studio

# Create a new migration
npx prisma migrate dev --name <migration-name>
```

### Development Workflow
1. **Initial Setup**: `npm install` → Database auto-initializes
2. **Database Population**: `npm run db:seed` or `npx prisma migrate reset`
3. **Development**: `npm run dev` → Runs on http://localhost:3000
4. **Code Quality**: `npm lint` → Checks ESLint rules

## Current State & Placeholders

### Implemented
- Home page with hero text
- Navigation bar with links (Accueil, Dépenses, Catégories)
- Database models and seeding
- Tailwind CSS styling

### Placeholders (To Be Implemented)
- `/transactions` page - Full transaction management UI
- `/categories` page - Category management UI
- CSV import functionality (library `papaparse` included but not used)
- React Query integration (package included but not used)
- Domain logic layer (empty `/src/domain/` directory)
- Expense filtering and analysis
- Pareto cumulative calculations

## Build & Deployment

### TypeScript Configuration
- **Target**: ES2017
- **Module Resolution**: Bundler (Next.js optimized)
- **Path Alias**: `@/*` maps to root `/`
- **Strict Mode**: Enabled for type safety

### Next.js Configuration
- Currently minimal (`next.config.ts` is empty)
- Uses default App Router behavior
- Supports middleware and API routes if needed

### Testing Strategy
Current: None implemented
Planned: TDD for domain logic (per README)

## Environment Variables

### Required
- `DATABASE_URL="file:./dev.db"` - SQLite database file path

### Optional
- Set by `.env` file (currently untracked due to `.gitignore`)

## Design Principles Observed

1. **Type Safety**: Full TypeScript, strict mode enabled
2. **Performance**: Prisma singleton prevents connection leaks; React Query for efficient data fetching
3. **DRY**: Reusable Navigation component, centralized Prisma client
4. **Separation of Concerns**: Clear directory structure (app/components/lib/domain)
5. **Scalability**: App Router ready for API routes; Prisma scalable across databases
6. **User Experience**: French UI text; Tailwind for responsive design

## Common Patterns & Gotchas

### Working with Prisma
- Always import from `src/lib/prisma.ts`, not directly from `@prisma/client`
- Use `await` with all database operations
- Type safety: TypeScript catches schema mismatches at compile time

### React Server Components
- Default in App Router; no `"use client"` needed unless using hooks
- Async components for data fetching (`async function Page() {...}`)
- Form actions and database calls can happen server-side

### Styling
- Tailwind v4 with `@import "tailwindcss"` in CSS
- CSS variables for theming (--background, --foreground)
- Dark mode support via `prefers-color-scheme`

## Next Steps for Development

1. **Implement Transaction Page**:
   - Fetch transactions from database
   - Display in table/list format
   - Add filtering by category and date

2. **Implement Category Management**:
   - CRUD operations for categories
   - Color picker for UI customization
   - Delete protection if categories have transactions

3. **CSV Import Feature**:
   - Use `papaparse` to parse CSV files
   - Map CSV columns to Transaction fields
   - Validate data with Zod

4. **React Query Integration**:
   - Set up query hooks for transactions and categories
   - Enable background refetching and caching
   - Implement optimistic updates

5. **Domain Logic Layer**:
   - Implement Pareto analysis (80/20 rule)
   - Spending trend calculations
   - Export functions as pure functions in `/src/domain/`

## Notes for Future Claude Instances

- This codebase is in early development with placeholder pages
- Follow existing patterns: French UI text, English code, server components by default
- Always use Prisma singleton from `src/lib/prisma.ts`
- Add tests to `/src/domain/` functions as they're created (TDD approach)
- Tailwind is configured with v4 syntax; use modern utilities
- Database uses SQLite for development; can be switched via Prisma `datasource.provider`
