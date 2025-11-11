/**
 * Tests for Transaction Filtering Functions
 */

import { describe, it, expect } from 'vitest';
import {
  filterByDateRange,
  filterByCategory,
  filterByCategories,
  filterByMinAmount,
  filterByMaxAmount,
  filterByAmountRange,
  searchByDescription,
  filterUncategorized,
  filterCategorized,
  sortByDate,
  sortByAmount,
  filterCurrentMonth,
  filterByMonth,
  filterLastNDays,
  composeFilters,
} from './filters';
import { Transaction } from './types';

const mockTransactions: Transaction[] = [
  { id: 1, date: new Date('2024-01-15'), description: 'Groceries at Supermarket', amount: 150, categoryId: 1 },
  { id: 2, date: new Date('2024-01-20'), description: 'Gas station', amount: 50, categoryId: 2 },
  { id: 3, date: new Date('2024-02-05'), description: 'Restaurant dinner', amount: 80, categoryId: 1 },
  { id: 4, date: new Date('2024-02-10'), description: 'Movie tickets', amount: 30, categoryId: 3 },
  { id: 5, date: new Date('2024-03-01'), description: 'Pharmacy', amount: 25, categoryId: null },
  { id: 6, date: new Date('2024-03-15'), description: 'Online shopping', amount: 200, categoryId: null },
];

describe('filterByDateRange', () => {
  it('should filter transactions within date range', () => {
    const startDate = new Date('2024-02-01');
    const endDate = new Date('2024-02-28');

    const result = filterByDateRange(mockTransactions, startDate, endDate);

    expect(result.length).toBe(2);
    expect(result[0].id).toBe(3);
    expect(result[1].id).toBe(4);
  });

  it('should include transactions on boundary dates', () => {
    const startDate = new Date('2024-01-15');
    const endDate = new Date('2024-01-20');

    const result = filterByDateRange(mockTransactions, startDate, endDate);

    expect(result.length).toBe(2);
    expect(result.map(t => t.id)).toEqual([1, 2]);
  });

  it('should return empty array when no transactions in range', () => {
    const startDate = new Date('2025-01-01');
    const endDate = new Date('2025-12-31');

    const result = filterByDateRange(mockTransactions, startDate, endDate);

    expect(result.length).toBe(0);
  });

  it('should handle single day range', () => {
    const date = new Date('2024-01-15');

    const result = filterByDateRange(mockTransactions, date, date);

    expect(result.length).toBe(1);
    expect(result[0].id).toBe(1);
  });
});

describe('filterByCategory', () => {
  it('should filter transactions by category ID', () => {
    const result = filterByCategory(mockTransactions, 1);

    expect(result.length).toBe(2);
    expect(result.every(t => t.categoryId === 1)).toBe(true);
  });

  it('should filter uncategorized transactions (null)', () => {
    const result = filterByCategory(mockTransactions, null);

    expect(result.length).toBe(2);
    expect(result.every(t => t.categoryId === null)).toBe(true);
  });

  it('should return empty array for non-existent category', () => {
    const result = filterByCategory(mockTransactions, 999);

    expect(result.length).toBe(0);
  });
});

describe('filterByCategories', () => {
  it('should filter transactions by multiple categories', () => {
    const result = filterByCategories(mockTransactions, [1, 2]);

    expect(result.length).toBe(3);
    expect(result.every(t => t.categoryId === 1 || t.categoryId === 2)).toBe(true);
  });

  it('should include uncategorized when null is in array', () => {
    const result = filterByCategories(mockTransactions, [1, null]);

    expect(result.length).toBe(4);
  });

  it('should return empty array for empty category array', () => {
    const result = filterByCategories(mockTransactions, []);

    expect(result.length).toBe(0);
  });
});

describe('filterByMinAmount', () => {
  it('should filter transactions above minimum amount', () => {
    const result = filterByMinAmount(mockTransactions, 100);

    expect(result.length).toBe(2);
    expect(result.every(t => Math.abs(t.amount) >= 100)).toBe(true);
  });

  it('should include transactions exactly at minimum', () => {
    const result = filterByMinAmount(mockTransactions, 50);

    expect(result.length).toBe(4); // 150, 50, 80, 200
  });

  it('should handle negative amounts (uses absolute value)', () => {
    const transactions: Transaction[] = [
      { id: 1, date: new Date('2024-01-01'), description: 'Negative', amount: -100, categoryId: 1 },
      { id: 2, date: new Date('2024-01-02'), description: 'Positive', amount: 50, categoryId: 1 },
    ];

    const result = filterByMinAmount(transactions, 75);

    expect(result.length).toBe(1);
    expect(result[0].id).toBe(1);
  });
});

describe('filterByMaxAmount', () => {
  it('should filter transactions below maximum amount', () => {
    const result = filterByMaxAmount(mockTransactions, 50);

    expect(result.length).toBe(3); // 50, 30, 25
    expect(result.every(t => Math.abs(t.amount) <= 50)).toBe(true);
  });

  it('should include transactions exactly at maximum', () => {
    const result = filterByMaxAmount(mockTransactions, 80);

    expect(result.length).toBe(4); // 50, 80, 30, 25
  });
});

describe('filterByAmountRange', () => {
  it('should filter transactions within amount range', () => {
    const result = filterByAmountRange(mockTransactions, 50, 100);

    expect(result.length).toBe(2); // 50, 80
    expect(result.every(t => {
      const abs = Math.abs(t.amount);
      return abs >= 50 && abs <= 100;
    })).toBe(true);
  });

  it('should include transactions at boundaries', () => {
    const result = filterByAmountRange(mockTransactions, 25, 150);

    expect(result.length).toBe(5); // All except 200
  });
});

describe('searchByDescription', () => {
  it('should search by partial text (case-insensitive)', () => {
    const result = searchByDescription(mockTransactions, 'super');

    expect(result.length).toBe(1);
    expect(result[0].description).toContain('Supermarket');
  });

  it('should handle case-insensitive search', () => {
    const result = searchByDescription(mockTransactions, 'RESTAURANT');

    expect(result.length).toBe(1);
    expect(result[0].id).toBe(3);
  });

  it('should return all transactions for empty search', () => {
    const result = searchByDescription(mockTransactions, '');

    expect(result.length).toBe(mockTransactions.length);
  });

  it('should handle whitespace in search term', () => {
    const result = searchByDescription(mockTransactions, '  gas  ');

    expect(result.length).toBe(1);
    expect(result[0].description).toContain('Gas');
  });

  it('should return empty array when no matches', () => {
    const result = searchByDescription(mockTransactions, 'nonexistent');

    expect(result.length).toBe(0);
  });
});

describe('filterUncategorized', () => {
  it('should return only uncategorized transactions', () => {
    const result = filterUncategorized(mockTransactions);

    expect(result.length).toBe(2);
    expect(result.every(t => t.categoryId === null)).toBe(true);
  });

  it('should return empty array when all are categorized', () => {
    const categorized: Transaction[] = [
      { id: 1, date: new Date('2024-01-01'), description: 'Item', amount: 100, categoryId: 1 },
    ];

    const result = filterUncategorized(categorized);

    expect(result.length).toBe(0);
  });
});

describe('filterCategorized', () => {
  it('should return only categorized transactions', () => {
    const result = filterCategorized(mockTransactions);

    expect(result.length).toBe(4);
    expect(result.every(t => t.categoryId !== null)).toBe(true);
  });

  it('should return empty array when all are uncategorized', () => {
    const uncategorized: Transaction[] = [
      { id: 1, date: new Date('2024-01-01'), description: 'Item', amount: 100, categoryId: null },
    ];

    const result = filterCategorized(uncategorized);

    expect(result.length).toBe(0);
  });
});

describe('sortByDate', () => {
  it('should sort by date descending (newest first) by default', () => {
    const result = sortByDate(mockTransactions);

    expect(result[0].id).toBe(6); // 2024-03-15
    expect(result[result.length - 1].id).toBe(1); // 2024-01-15
  });

  it('should sort by date ascending (oldest first)', () => {
    const result = sortByDate(mockTransactions, 'asc');

    expect(result[0].id).toBe(1); // 2024-01-15
    expect(result[result.length - 1].id).toBe(6); // 2024-03-15
  });

  it('should not mutate original array', () => {
    const original = [...mockTransactions];
    sortByDate(mockTransactions);

    expect(mockTransactions).toEqual(original);
  });
});

describe('sortByAmount', () => {
  it('should sort by amount descending (largest first) by default', () => {
    const result = sortByAmount(mockTransactions);

    expect(result[0].amount).toBe(200);
    expect(result[result.length - 1].amount).toBe(25);
  });

  it('should sort by amount ascending (smallest first)', () => {
    const result = sortByAmount(mockTransactions, 'asc');

    expect(result[0].amount).toBe(25);
    expect(result[result.length - 1].amount).toBe(200);
  });

  it('should handle negative amounts (uses absolute value)', () => {
    const transactions: Transaction[] = [
      { id: 1, date: new Date('2024-01-01'), description: 'Small', amount: 10, categoryId: 1 },
      { id: 2, date: new Date('2024-01-02'), description: 'Large negative', amount: -100, categoryId: 1 },
    ];

    const result = sortByAmount(transactions, 'desc');

    expect(result[0].id).toBe(2); // -100 has larger absolute value
  });

  it('should not mutate original array', () => {
    const original = [...mockTransactions];
    sortByAmount(mockTransactions);

    expect(mockTransactions).toEqual(original);
  });
});

describe('filterCurrentMonth', () => {
  it('should filter transactions from current month', () => {
    const referenceDate = new Date('2024-02-15'); // Mid February

    const result = filterCurrentMonth(mockTransactions, referenceDate);

    expect(result.length).toBe(2);
    expect(result.every(t => {
      const date = new Date(t.date);
      return date.getMonth() === 1 && date.getFullYear() === 2024; // February = month 1
    })).toBe(true);
  });

  it('should handle month boundaries correctly', () => {
    const referenceDate = new Date('2024-01-31'); // Last day of January

    const result = filterCurrentMonth(mockTransactions, referenceDate);

    expect(result.length).toBe(2); // Only January transactions
  });
});

describe('filterByMonth', () => {
  it('should filter transactions by specific month and year', () => {
    const result = filterByMonth(mockTransactions, 1, 2024); // February 2024

    expect(result.length).toBe(2);
    expect(result[0].id).toBe(3);
    expect(result[1].id).toBe(4);
  });

  it('should return empty array for month with no transactions', () => {
    const result = filterByMonth(mockTransactions, 5, 2024); // June 2024

    expect(result.length).toBe(0);
  });

  it('should handle January (month 0) correctly', () => {
    const result = filterByMonth(mockTransactions, 0, 2024);

    expect(result.length).toBe(2);
  });
});

describe('filterLastNDays', () => {
  it('should filter transactions from last N days', () => {
    const referenceDate = new Date('2024-03-20');
    const result = filterLastNDays(mockTransactions, 10, referenceDate);

    // Should include transactions from 2024-03-10 to 2024-03-20
    expect(result.length).toBe(1); // Only transaction on 2024-03-15
    expect(result[0].id).toBe(6);
  });

  it('should include transactions on the reference date', () => {
    const referenceDate = new Date('2024-03-15');
    const result = filterLastNDays(mockTransactions, 0, referenceDate);

    expect(result.length).toBe(1);
    expect(result[0].id).toBe(6);
  });

  it('should handle 30-day period', () => {
    const referenceDate = new Date('2024-03-20');
    const result = filterLastNDays(mockTransactions, 30, referenceDate);

    // Should include transactions from late February and March
    expect(result.length).toBeGreaterThan(1);
  });
});

describe('composeFilters', () => {
  it('should apply multiple filters in sequence', () => {
    const result = composeFilters(mockTransactions, [
      (txs) => filterByCategory(txs, 1),
      (txs) => filterByMinAmount(txs, 100),
    ]);

    // Should have category 1 AND amount >= 100
    expect(result.length).toBe(1);
    expect(result[0].id).toBe(1); // Groceries: 150, category 1
  });

  it('should handle empty filter array', () => {
    const result = composeFilters(mockTransactions, []);

    expect(result).toEqual(mockTransactions);
  });

  it('should apply filters in correct order', () => {
    const result = composeFilters(mockTransactions, [
      (txs) => filterByDateRange(txs, new Date('2024-01-01'), new Date('2024-01-31')),
      (txs) => sortByAmount(txs, 'desc'),
    ]);

    // Should have January transactions sorted by amount
    expect(result.length).toBe(2);
    expect(result[0].amount).toBe(150); // Largest first
    expect(result[1].amount).toBe(50);
  });

  it('should support complex filter chains', () => {
    const result = composeFilters(mockTransactions, [
      (txs) => filterCategorized(txs),
      (txs) => filterByMinAmount(txs, 50),
      (txs) => sortByDate(txs, 'asc'),
    ]);

    // Categorized + amount >= 50 + sorted by date ascending
    // Results: ID 1 (150, cat 1), ID 2 (50, cat 2), ID 3 (80, cat 1)
    expect(result.length).toBe(3);
    expect(result[0].id).toBe(1); // Oldest first (2024-01-15)
  });
});
