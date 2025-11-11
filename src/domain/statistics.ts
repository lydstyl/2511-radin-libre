/**
 * Statistical Analysis Functions
 *
 * Pure functions for calculating spending statistics
 * All functions handle edge cases and return safe defaults
 */

import { Transaction, SpendingStats } from './types';

/**
 * Calculate comprehensive spending statistics for a set of transactions
 *
 * @param transactions - Array of transactions to analyze
 * @returns Statistical summary including total, average, median, min, max
 */
export function calculateSpendingStats(transactions: Transaction[]): SpendingStats {
  // Handle empty array
  if (transactions.length === 0) {
    return {
      total: 0,
      average: 0,
      median: 0,
      min: 0,
      max: 0,
      count: 0,
    };
  }

  // Extract absolute amounts
  const amounts = transactions.map(t => Math.abs(t.amount));

  // Calculate total
  const total = amounts.reduce((sum, amount) => sum + amount, 0);

  // Calculate average
  const average = total / amounts.length;

  // Calculate median
  const sortedAmounts = [...amounts].sort((a, b) => a - b);
  const mid = Math.floor(sortedAmounts.length / 2);
  const median =
    sortedAmounts.length % 2 === 0
      ? (sortedAmounts[mid - 1] + sortedAmounts[mid]) / 2
      : sortedAmounts[mid];

  // Find min and max
  const min = Math.min(...amounts);
  const max = Math.max(...amounts);

  return {
    total,
    average,
    median,
    min,
    max,
    count: transactions.length,
  };
}

/**
 * Calculate spending statistics grouped by category
 *
 * @param transactions - Array of transactions to analyze
 * @returns Map of categoryId to SpendingStats
 */
export function calculateStatsByCategory(
  transactions: Transaction[]
): Map<number, SpendingStats> {
  const statsByCategory = new Map<number, SpendingStats>();

  // Group transactions by category
  const transactionsByCategory = new Map<number, Transaction[]>();

  for (const transaction of transactions) {
    const categoryId = transaction.categoryId ?? 0; // 0 for uncategorized
    const existing = transactionsByCategory.get(categoryId) ?? [];
    transactionsByCategory.set(categoryId, [...existing, transaction]);
  }

  // Calculate stats for each category
  for (const [categoryId, categoryTransactions] of transactionsByCategory) {
    statsByCategory.set(categoryId, calculateSpendingStats(categoryTransactions));
  }

  return statsByCategory;
}

/**
 * Calculate the average spending per day over a date range
 *
 * @param transactions - Array of transactions
 * @param startDate - Start of the period
 * @param endDate - End of the period
 * @returns Average daily spending
 */
export function calculateDailyAverage(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): number {
  if (transactions.length === 0) {
    return 0;
  }

  // Calculate total spending
  const totalSpending = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Calculate number of days in period
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const days = Math.max(daysDiff, 1); // At least 1 day

  return totalSpending / days;
}

/**
 * Calculate the average spending per month
 *
 * @param transactions - Array of transactions
 * @param startDate - Start of the period
 * @param endDate - End of the period
 * @returns Average monthly spending
 */
export function calculateMonthlyAverage(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): number {
  if (transactions.length === 0) {
    return 0;
  }

  // Calculate total spending
  const totalSpending = transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Calculate number of months in period
  const yearsDiff = endDate.getFullYear() - startDate.getFullYear();
  const monthsDiff = endDate.getMonth() - startDate.getMonth();
  const totalMonths = Math.max(yearsDiff * 12 + monthsDiff + 1, 1); // At least 1 month

  return totalSpending / totalMonths;
}

/**
 * Calculate the standard deviation of transaction amounts
 * Useful for understanding spending volatility
 *
 * @param transactions - Array of transactions
 * @returns Standard deviation of amounts
 */
export function calculateStandardDeviation(transactions: Transaction[]): number {
  if (transactions.length === 0) {
    return 0;
  }

  const amounts = transactions.map(t => Math.abs(t.amount));
  const average = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;

  const squaredDifferences = amounts.map(amount => Math.pow(amount - average, 2));
  const variance = squaredDifferences.reduce((sum, sq) => sum + sq, 0) / amounts.length;

  return Math.sqrt(variance);
}

/**
 * Identify outlier transactions (unusually high spending)
 * Uses the IQR (Interquartile Range) method
 *
 * @param transactions - Array of transactions
 * @param threshold - Multiplier for IQR (default: 1.5, standard for outliers)
 * @returns Array of outlier transactions
 */
export function findOutliers(
  transactions: Transaction[],
  threshold: number = 1.5
): Transaction[] {
  if (transactions.length < 4) {
    // Need at least 4 data points for quartile calculation
    return [];
  }

  // Sort amounts
  const sortedTransactions = [...transactions].sort(
    (a, b) => Math.abs(a.amount) - Math.abs(b.amount)
  );

  // Calculate quartiles
  const q1Index = Math.floor(sortedTransactions.length * 0.25);
  const q3Index = Math.floor(sortedTransactions.length * 0.75);

  const q1 = Math.abs(sortedTransactions[q1Index].amount);
  const q3 = Math.abs(sortedTransactions[q3Index].amount);
  const iqr = q3 - q1;

  // Define outlier boundaries
  const upperBound = q3 + threshold * iqr;

  // Find outliers (only high outliers, as low spending is not concerning)
  return transactions.filter(t => Math.abs(t.amount) > upperBound);
}
