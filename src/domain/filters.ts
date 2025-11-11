/**
 * Transaction Filtering Functions
 *
 * Pure functions for filtering and searching transactions
 * All functions are composable and immutable
 */

import { Transaction } from './types';

/**
 * Filter transactions by date range (inclusive)
 *
 * @param transactions - Array of transactions to filter
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @returns Filtered transactions within the date range
 */
export function filterByDateRange(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): Transaction[] {
  return transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= startDate && transactionDate <= endDate;
  });
}

/**
 * Filter transactions by single category
 *
 * @param transactions - Array of transactions to filter
 * @param categoryId - Category ID to filter by (null for uncategorized)
 * @returns Filtered transactions matching the category
 */
export function filterByCategory(
  transactions: Transaction[],
  categoryId: number | null
): Transaction[] {
  return transactions.filter(t => t.categoryId === categoryId);
}

/**
 * Filter transactions by multiple categories
 *
 * @param transactions - Array of transactions to filter
 * @param categoryIds - Array of category IDs to include
 * @returns Filtered transactions matching any of the categories
 */
export function filterByCategories(
  transactions: Transaction[],
  categoryIds: (number | null)[]
): Transaction[] {
  return transactions.filter(t => categoryIds.includes(t.categoryId));
}

/**
 * Filter transactions by minimum amount
 *
 * @param transactions - Array of transactions to filter
 * @param minAmount - Minimum amount (inclusive)
 * @returns Filtered transactions with amount >= minAmount
 */
export function filterByMinAmount(
  transactions: Transaction[],
  minAmount: number
): Transaction[] {
  return transactions.filter(t => Math.abs(t.amount) >= minAmount);
}

/**
 * Filter transactions by maximum amount
 *
 * @param transactions - Array of transactions to filter
 * @param maxAmount - Maximum amount (inclusive)
 * @returns Filtered transactions with amount <= maxAmount
 */
export function filterByMaxAmount(
  transactions: Transaction[],
  maxAmount: number
): Transaction[] {
  return transactions.filter(t => Math.abs(t.amount) <= maxAmount);
}

/**
 * Filter transactions by amount range
 *
 * @param transactions - Array of transactions to filter
 * @param minAmount - Minimum amount (inclusive)
 * @param maxAmount - Maximum amount (inclusive)
 * @returns Filtered transactions within the amount range
 */
export function filterByAmountRange(
  transactions: Transaction[],
  minAmount: number,
  maxAmount: number
): Transaction[] {
  return transactions.filter(t => {
    const absAmount = Math.abs(t.amount);
    return absAmount >= minAmount && absAmount <= maxAmount;
  });
}

/**
 * Search transactions by description text
 *
 * @param transactions - Array of transactions to search
 * @param searchTerm - Text to search for (case-insensitive)
 * @returns Filtered transactions with matching descriptions
 */
export function searchByDescription(
  transactions: Transaction[],
  searchTerm: string
): Transaction[] {
  const normalizedSearch = searchTerm.toLowerCase().trim();

  if (normalizedSearch === '') {
    return transactions;
  }

  return transactions.filter(t =>
    t.description.toLowerCase().includes(normalizedSearch)
  );
}

/**
 * Filter uncategorized transactions only
 *
 * @param transactions - Array of transactions to filter
 * @returns Transactions without a category assigned
 */
export function filterUncategorized(transactions: Transaction[]): Transaction[] {
  return transactions.filter(t => t.categoryId === null);
}

/**
 * Filter categorized transactions only
 *
 * @param transactions - Array of transactions to filter
 * @returns Transactions with a category assigned
 */
export function filterCategorized(transactions: Transaction[]): Transaction[] {
  return transactions.filter(t => t.categoryId !== null);
}

/**
 * Sort transactions by date (ascending or descending)
 *
 * @param transactions - Array of transactions to sort
 * @param order - 'asc' for oldest first, 'desc' for newest first
 * @returns Sorted transactions (new array)
 */
export function sortByDate(
  transactions: Transaction[],
  order: 'asc' | 'desc' = 'desc'
): Transaction[] {
  return [...transactions].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return order === 'asc' ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Sort transactions by amount (ascending or descending)
 *
 * @param transactions - Array of transactions to sort
 * @param order - 'asc' for smallest first, 'desc' for largest first
 * @returns Sorted transactions (new array)
 */
export function sortByAmount(
  transactions: Transaction[],
  order: 'asc' | 'desc' = 'desc'
): Transaction[] {
  return [...transactions].sort((a, b) => {
    const amountA = Math.abs(a.amount);
    const amountB = Math.abs(b.amount);
    return order === 'asc' ? amountA - amountB : amountB - amountA;
  });
}

/**
 * Get transactions from the current month
 *
 * @param transactions - Array of transactions to filter
 * @param referenceDate - Reference date (defaults to today)
 * @returns Transactions from the same month and year as reference date
 */
export function filterCurrentMonth(
  transactions: Transaction[],
  referenceDate: Date = new Date()
): Transaction[] {
  const refMonth = referenceDate.getMonth();
  const refYear = referenceDate.getFullYear();

  return transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return (
      transactionDate.getMonth() === refMonth &&
      transactionDate.getFullYear() === refYear
    );
  });
}

/**
 * Get transactions from a specific month
 *
 * @param transactions - Array of transactions to filter
 * @param month - Month (0-11, where 0 = January)
 * @param year - Year
 * @returns Transactions from the specified month and year
 */
export function filterByMonth(
  transactions: Transaction[],
  month: number,
  year: number
): Transaction[] {
  return transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return (
      transactionDate.getMonth() === month &&
      transactionDate.getFullYear() === year
    );
  });
}

/**
 * Get transactions from the last N days
 *
 * @param transactions - Array of transactions to filter
 * @param days - Number of days to look back
 * @param referenceDate - Reference date (defaults to today)
 * @returns Transactions from the last N days
 */
export function filterLastNDays(
  transactions: Transaction[],
  days: number,
  referenceDate: Date = new Date()
): Transaction[] {
  const startDate = new Date(referenceDate);
  startDate.setDate(startDate.getDate() - days);

  return transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= startDate && transactionDate <= referenceDate;
  });
}

/**
 * Compose multiple filter functions
 * Useful for building complex queries
 *
 * @param transactions - Array of transactions to filter
 * @param filters - Array of filter functions to apply in sequence
 * @returns Filtered transactions after applying all filters
 */
export function composeFilters(
  transactions: Transaction[],
  filters: Array<(txs: Transaction[]) => Transaction[]>
): Transaction[] {
  return filters.reduce((acc, filterFn) => filterFn(acc), transactions);
}
