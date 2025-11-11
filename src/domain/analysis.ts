/**
 * Pareto Analysis Functions
 *
 * Business logic for expense analysis following the Pareto principle (80/20 rule)
 * Pure functions with no side effects or external dependencies
 */

import { Transaction, Category, CategorySpending, ParetoAnalysisResult } from './types';

/**
 * Calculate Pareto analysis for transactions grouped by category
 * Identifies which categories represent 80% of total spending
 *
 * @param transactions - Array of transactions to analyze
 * @param categories - Array of available categories
 * @returns Pareto analysis result with sorted categories and 80/20 breakdown
 */
export function calculateParetoAnalysis(
  transactions: Transaction[],
  categories: Category[]
): ParetoAnalysisResult {
  // Handle edge cases
  if (transactions.length === 0) {
    return {
      categories: [],
      paretoCategories: [],
      totalSpending: 0,
      paretoThreshold: 0,
    };
  }

  // Create a map for quick category lookup
  const categoryMap = new Map(categories.map(cat => [cat.id, cat.name]));

  // Group transactions by category and calculate totals
  const categoryTotals = new Map<number, { total: number; count: number }>();

  for (const transaction of transactions) {
    const categoryId = transaction.categoryId ?? 0; // Use 0 for uncategorized
    const existing = categoryTotals.get(categoryId) ?? { total: 0, count: 0 };

    categoryTotals.set(categoryId, {
      total: existing.total + Math.abs(transaction.amount),
      count: existing.count + 1,
    });
  }

  // Calculate total spending
  const totalSpending = Array.from(categoryTotals.values())
    .reduce((sum, item) => sum + item.total, 0);

  // Convert to CategorySpending array and sort by amount (descending)
  const sortedCategories: CategorySpending[] = Array.from(categoryTotals.entries())
    .map(([categoryId, data]) => ({
      categoryId,
      categoryName: categoryMap.get(categoryId) ?? 'Non catégorisé',
      totalAmount: data.total,
      transactionCount: data.count,
      percentage: totalSpending > 0 ? (data.total / totalSpending) * 100 : 0,
      cumulativePercentage: 0, // Will be calculated next
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // Calculate cumulative percentages
  let cumulativeSum = 0;
  for (const category of sortedCategories) {
    cumulativeSum += category.totalAmount;
    category.cumulativePercentage = totalSpending > 0 ? (cumulativeSum / totalSpending) * 100 : 0;
  }

  // Find Pareto categories (those that contribute to first 80% of spending)
  const paretoCategories = sortedCategories.filter(
    cat => cat.cumulativePercentage <= 80
  );

  // If no categories fall exactly at 80%, include the first one that crosses the threshold
  if (paretoCategories.length === 0 && sortedCategories.length > 0) {
    paretoCategories.push(sortedCategories[0]);
  } else if (paretoCategories.length < sortedCategories.length) {
    // Add the category that crosses the 80% threshold
    const nextCategory = sortedCategories[paretoCategories.length];
    if (nextCategory) {
      paretoCategories.push(nextCategory);
    }
  }

  const paretoThreshold = totalSpending * 0.8;

  return {
    categories: sortedCategories,
    paretoCategories,
    totalSpending,
    paretoThreshold,
  };
}

/**
 * Calculate the number of categories that represent 80% of spending
 * Useful for quick insights
 *
 * @param analysis - Pareto analysis result
 * @returns Number of categories in the Pareto group
 */
export function getParetoCount(analysis: ParetoAnalysisResult): number {
  return analysis.paretoCategories.length;
}

/**
 * Check if a specific category is in the Pareto group (top spenders)
 *
 * @param categoryId - Category ID to check
 * @param analysis - Pareto analysis result
 * @returns True if category is in the top 20%
 */
export function isParetoCategory(categoryId: number, analysis: ParetoAnalysisResult): boolean {
  return analysis.paretoCategories.some(cat => cat.categoryId === categoryId);
}
