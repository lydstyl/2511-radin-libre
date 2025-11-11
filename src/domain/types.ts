/**
 * Domain Types
 * Core types for business logic (independent of database/UI layers)
 */

export interface Transaction {
  id: number;
  date: Date;
  description: string;
  amount: number;
  categoryId: number | null;
}

export interface Category {
  id: number;
  name: string;
  color?: string | null;
}

export interface CategorySpending {
  categoryId: number;
  categoryName: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
  cumulativePercentage: number;
}

export interface ParetoAnalysisResult {
  categories: CategorySpending[];
  paretoCategories: CategorySpending[]; // Top 20% that make 80% of spending
  totalSpending: number;
  paretoThreshold: number; // The spending amount at 80%
}

export interface SpendingStats {
  total: number;
  average: number;
  median: number;
  min: number;
  max: number;
  count: number;
}
