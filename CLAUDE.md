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
│   ├── domain/                      # Business logic layer (pure functions)
│   │   ├── types.ts                 # Domain type definitions
│   │   ├── analysis.ts              # Pareto analysis functions
│   │   ├── analysis.test.ts         # Tests for Pareto analysis
│   │   ├── statistics.ts            # Statistical calculations
│   │   ├── statistics.test.ts       # Tests for statistics
│   │   ├── filters.ts               # Transaction filtering & sorting
│   │   └── filters.test.ts          # Tests for filters
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
├── vitest.config.ts                # Vitest test configuration
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
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
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

# Run tests in watch mode (auto-rerun on file changes)
npm test

# Run tests once (for CI/CD)
npm run test:run

# Run tests with visual UI interface
npm run test:ui

# Run tests with coverage report
npm run test:coverage
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

**Framework**: Vitest 4.0.8 with full TypeScript support

**Test Coverage**: 84 tests across 3 test suites
- Analysis tests: 14 tests
- Statistics tests: 25 tests
- Filter tests: 45 tests

**Configuration**: See [vitest.config.ts](vitest.config.ts)
- Node environment for pure logic tests
- Path aliases configured (`@/*` → `./src/*`)
- Global test utilities (describe, it, expect)
- Coverage reporting with v8 provider

**Test Organization**:
All tests colocated with source files in `/src/domain/`:
```
src/domain/
├── types.ts              # Domain type definitions
├── analysis.ts           # Pareto analysis logic
├── analysis.test.ts      # 14 tests for Pareto calculations
├── statistics.ts         # Statistical functions
├── statistics.test.ts    # 25 tests for stats calculations
├── filters.ts            # Transaction filtering
└── filters.test.ts       # 45 tests for filtering & sorting
```

**Running Tests**:
- `npm test` - Watch mode (auto-rerun on changes)
- `npm run test:run` - Run once (CI/CD)
- `npm run test:ui` - Visual UI at http://localhost:51204
- `npm run test:coverage` - Generate coverage report

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

## Domain Layer (Business Logic)

The `/src/domain/` directory contains pure functions for business logic, fully tested with Vitest.

### Module: [analysis.ts](src/domain/analysis.ts)
**Purpose**: Pareto analysis (80/20 rule) for expense optimization

**Key Functions**:
- `calculateParetoAnalysis(transactions, categories)` - Identifies which 20% of categories represent 80% of spending
- `getParetoCount(analysis)` - Returns number of high-impact categories
- `isParetoCategory(categoryId, analysis)` - Checks if a category is in the Pareto group

**Use Cases**:
- Homepage dashboard showing top spending categories
- Recommendations for which categories to focus on for savings

### Module: [statistics.ts](src/domain/statistics.ts)
**Purpose**: Statistical calculations for spending analysis

**Key Functions**:
- `calculateSpendingStats(transactions)` - Comprehensive stats (total, average, median, min, max)
- `calculateStatsByCategory(transactions)` - Per-category statistics
- `calculateDailyAverage(transactions, startDate, endDate)` - Average spending per day
- `calculateMonthlyAverage(transactions, startDate, endDate)` - Average spending per month
- `calculateStandardDeviation(transactions)` - Measure of spending volatility
- `findOutliers(transactions, threshold)` - Identify unusually high expenses

**Use Cases**:
- Monthly spending reports
- Budget vs. actual comparisons
- Detecting anomalous spending patterns

### Module: [filters.ts](src/domain/filters.ts)
**Purpose**: Transaction filtering, sorting, and searching

**Key Functions**:
- Date filters: `filterByDateRange`, `filterCurrentMonth`, `filterByMonth`, `filterLastNDays`
- Category filters: `filterByCategory`, `filterByCategories`, `filterUncategorized`, `filterCategorized`
- Amount filters: `filterByMinAmount`, `filterByMaxAmount`, `filterByAmountRange`
- Search: `searchByDescription`
- Sorting: `sortByDate`, `sortByAmount`
- Composition: `composeFilters` - Chain multiple filters together

**Use Cases**:
- Transaction list page with filters
- Search functionality
- Date range selectors (e.g., "Last 30 days")

### Module: [types.ts](src/domain/types.ts)
**Purpose**: Domain type definitions (independent of database schema)

**Key Types**:
- `Transaction` - Core transaction type
- `Category` - Category type
- `CategorySpending` - Aggregated spending per category
- `ParetoAnalysisResult` - Result of Pareto analysis
- `SpendingStats` - Statistical summary

**Design Pattern**: These types mirror database models but are independent, allowing the domain layer to remain decoupled from Prisma.

## Common Patterns & Gotchas

### Working with Domain Logic

- **Pure Functions**: All domain functions are pure (no side effects, same input = same output)
- **Immutability**: Functions return new arrays/objects instead of mutating inputs
- **Composability**: Functions can be chained using `composeFilters` and similar patterns
- **Test Coverage**: All domain logic has comprehensive unit tests (edge cases, happy paths, error conditions)

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

### Testing

- Use `npm test` for watch mode during development
- All domain functions have tests colocated in `.test.ts` files
- Test pattern: Describe blocks for function, nested describes for happy path / edge cases
- Use `toBeCloseTo()` for floating-point comparisons
- Mock data should be realistic and cover boundary conditions

## Next Steps for Development

### Completed ✅
- **Domain Logic Layer**: Fully implemented with Pareto analysis, statistics, and filters (84 tests passing)
- **Testing Infrastructure**: Vitest configured with full test suite

### To Do

1. **Implement Transaction Page** (`/transactions`):
   - Fetch transactions from database using Prisma
   - Display in table/list format
   - Integrate filter functions from `src/domain/filters.ts`
   - Add search bar using `searchByDescription()`
   - Date range picker using `filterByDateRange()`

2. **Implement Category Management** (`/categories`):
   - CRUD operations for categories
   - Color picker for UI customization
   - Delete protection if categories have transactions
   - Display category spending using `calculateStatsByCategory()`

3. **Dashboard with Pareto Analysis** (homepage):
   - Use `calculateParetoAnalysis()` to show top spending categories
   - Visual chart showing 80/20 distribution
   - Spending statistics using `calculateSpendingStats()`
   - Outlier detection using `findOutliers()`

4. **CSV Import Feature**:
   - Use `papaparse` to parse CSV files
   - Map CSV columns to Transaction fields
   - Validate data with Zod schemas
   - Bulk insert to database

5. **React Query Integration**:
   - Set up query hooks for transactions and categories
   - Enable background refetching and caching
   - Implement optimistic updates for better UX

## Notes for Future Claude Instances

### Code Organization
- This codebase follows a clean architecture with clear separation between layers
- Follow existing patterns: French UI text, English code, server components by default
- Always use Prisma singleton from `src/lib/prisma.ts`
- Tailwind is configured with v4 syntax; use modern utilities
- Database uses SQLite for development; can be switched via Prisma `datasource.provider`

### Testing Philosophy
- **TDD Approach**: Domain logic layer is fully tested with 84 passing tests
- **Pure Functions**: All domain functions are pure, making them easy to test
- **Comprehensive Coverage**: Tests include happy paths, edge cases, and error conditions
- **Colocated Tests**: Test files are placed next to source files (e.g., `analysis.ts` + `analysis.test.ts`)
- **Fast Feedback**: Use `npm test` in watch mode during development
- **CI/CD Ready**: Use `npm run test:run` for continuous integration

### When Adding New Features
1. **Start with domain logic**: Write pure functions in `/src/domain/`
2. **Write tests first** (TDD): Create `.test.ts` file with test cases
3. **Implement the function**: Make tests pass
4. **Integrate in UI**: Use the domain functions in your React components
5. **Keep layers separate**: Database (Prisma) → Domain (pure functions) → UI (React components)

### Domain Functions Usage Examples
```typescript
// In a Server Component or API route
import { prisma } from '@/lib/prisma';
import { calculateParetoAnalysis } from '@/domain/analysis';
import { filterByDateRange } from '@/domain/filters';

// Fetch from DB
const transactions = await prisma.transaction.findMany();
const categories = await prisma.category.findMany();

// Apply domain logic
const filtered = filterByDateRange(transactions, startDate, endDate);
const analysis = calculateParetoAnalysis(filtered, categories);

// Return to UI
return analysis.paretoCategories;
```

# More instructions from the developper

- Use clean architecture.
- Try to always extract code from UI component to custom hooks. Hooks can use usecase business rules.
- Create tests for business logic, use TDD.
- Run npm run build and npm run test after coding / answering the user and fix issues.
- After coding, if you have new information and you can enhance this CLAUDE.md file, ask user if he whant you to do it.
