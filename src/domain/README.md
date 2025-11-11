# Domain Layer - Business Logic

This directory contains pure functions for RadinLibre's business logic, following clean architecture principles.

## Design Principles

- **Pure Functions**: No side effects, deterministic output
- **Immutability**: Functions return new data structures instead of mutating inputs
- **Type Safety**: Full TypeScript with strict typing
- **Testability**: 100% test coverage with Vitest
- **Independence**: No dependencies on database, UI, or external services

## Modules

### [types.ts](./types.ts)
Core domain types (Transaction, Category, SpendingStats, etc.)

### [analysis.ts](./analysis.ts) | [tests](./analysis.test.ts)
**Pareto Analysis (80/20 rule)**

```typescript
import { calculateParetoAnalysis } from '@/domain/analysis';

const analysis = calculateParetoAnalysis(transactions, categories);
// Returns: { categories, paretoCategories, totalSpending, paretoThreshold }

// Use case: Show which categories to focus on for maximum savings
console.log(`Focus on ${analysis.paretoCategories.length} categories`);
console.log(`They represent 80% of your ${analysis.totalSpending}€ spending`);
```

### [statistics.ts](./statistics.ts) | [tests](./statistics.test.ts)
**Statistical Calculations**

```typescript
import {
  calculateSpendingStats,
  calculateDailyAverage,
  findOutliers
} from '@/domain/statistics';

const stats = calculateSpendingStats(transactions);
// Returns: { total, average, median, min, max, count }

const daily = calculateDailyAverage(transactions, startDate, endDate);
// Returns: average spending per day

const outliers = findOutliers(transactions);
// Returns: unusually high expenses
```

### [filters.ts](./filters.ts) | [tests](./filters.test.ts)
**Filtering, Sorting, and Searching**

```typescript
import {
  filterByDateRange,
  filterByCategory,
  searchByDescription,
  sortByAmount,
  composeFilters
} from '@/domain/filters';

// Single filter
const lastMonth = filterByDateRange(transactions, startDate, endDate);

// Composed filters
const result = composeFilters(transactions, [
  (txs) => filterByCategory(txs, foodCategoryId),
  (txs) => filterByMinAmount(txs, 50),
  (txs) => sortByAmount(txs, 'desc')
]);
// Returns: Food expenses over 50€, sorted by amount
```

## Testing

All functions are tested with Vitest. Run tests with:

```bash
npm test              # Watch mode
npm run test:run      # Run once
npm run test:ui       # Visual UI
npm run test:coverage # Coverage report
```

### Test Coverage
- **84 tests** across 3 modules
- **Analysis**: 14 tests
- **Statistics**: 25 tests
- **Filters**: 45 tests

## Usage in Application

### Server Components (Recommended)
```typescript
// app/dashboard/page.tsx
import { prisma } from '@/lib/prisma';
import { calculateParetoAnalysis } from '@/domain/analysis';

export default async function DashboardPage() {
  // Fetch data from database
  const transactions = await prisma.transaction.findMany();
  const categories = await prisma.category.findMany();

  // Apply business logic
  const analysis = calculateParetoAnalysis(transactions, categories);

  // Render UI
  return (
    <div>
      <h1>Top Spending Categories</h1>
      {analysis.paretoCategories.map(cat => (
        <div key={cat.categoryId}>
          {cat.categoryName}: {cat.totalAmount}€ ({cat.percentage.toFixed(1)}%)
        </div>
      ))}
    </div>
  );
}
```

### API Routes
```typescript
// app/api/analysis/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateParetoAnalysis } from '@/domain/analysis';

export async function GET() {
  const transactions = await prisma.transaction.findMany();
  const categories = await prisma.category.findMany();

  const analysis = calculateParetoAnalysis(transactions, categories);

  return NextResponse.json(analysis);
}
```

### Client Components (with React Query)
```typescript
// components/SpendingChart.tsx
'use client';

import { useQuery } from '@tanstack/react-query';

export function SpendingChart() {
  const { data } = useQuery({
    queryKey: ['analysis'],
    queryFn: async () => {
      const res = await fetch('/api/analysis');
      return res.json();
    }
  });

  return <div>{/* Render chart with data.paretoCategories */}</div>;
}
```

## Adding New Functions

1. **Write tests first** (TDD approach)
   ```typescript
   // myfeature.test.ts
   import { describe, it, expect } from 'vitest';
   import { myFunction } from './myfeature';

   describe('myFunction', () => {
     it('should handle typical case', () => {
       const result = myFunction([/* test data */]);
       expect(result).toBe(/* expected */);
     });
   });
   ```

2. **Implement the function**
   ```typescript
   // myfeature.ts
   export function myFunction(input: Type[]): ReturnType {
     // Pure function logic here
     return result;
   }
   ```

3. **Run tests**: `npm test`

4. **Use in app**: Import and call from components/routes

## Best Practices

- Keep functions **pure** (no side effects)
- Use **TypeScript types** from `types.ts`
- Write **comprehensive tests** (happy path + edge cases)
- Prefer **composition** over complex functions
- Document with **JSDoc comments**
- Handle **edge cases** (empty arrays, null values, etc.)
