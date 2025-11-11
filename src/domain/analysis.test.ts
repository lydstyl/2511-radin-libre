/**
 * Tests for Pareto Analysis Functions
 *
 * Test strategy: Cover happy paths, edge cases, and error conditions
 */

import { describe, it, expect } from 'vitest';
import {
  calculateParetoAnalysis,
  getParetoCount,
  isParetoCategory,
} from './analysis';
import { Transaction, Category } from './types';

describe('calculateParetoAnalysis', () => {
  const mockCategories: Category[] = [
    { id: 1, name: 'Alimentation', color: '#FF5733' },
    { id: 2, name: 'Transport', color: '#33FF57' },
    { id: 3, name: 'Loisirs', color: '#3357FF' },
    { id: 4, name: 'Santé', color: '#F333FF' },
  ];

  describe('Happy path', () => {
    it('should calculate Pareto analysis correctly for typical data', () => {
      const transactions: Transaction[] = [
        { id: 1, date: new Date('2024-01-01'), description: 'Groceries', amount: 100, categoryId: 1 },
        { id: 2, date: new Date('2024-01-02'), description: 'Gas', amount: 50, categoryId: 2 },
        { id: 3, date: new Date('2024-01-03'), description: 'Restaurant', amount: 150, categoryId: 1 },
        { id: 4, date: new Date('2024-01-04'), description: 'Movie', amount: 20, categoryId: 3 },
        { id: 5, date: new Date('2024-01-05'), description: 'Pharmacy', amount: 30, categoryId: 4 },
      ];

      const result = calculateParetoAnalysis(transactions, mockCategories);

      // Total should be sum of all amounts
      expect(result.totalSpending).toBe(350);

      // Categories should be sorted by total amount (descending)
      expect(result.categories[0].categoryName).toBe('Alimentation');
      expect(result.categories[0].totalAmount).toBe(250);
      expect(result.categories[0].transactionCount).toBe(2);

      // Percentages should add up to 100
      const totalPercentage = result.categories.reduce((sum, cat) => sum + cat.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 1);

      // Cumulative percentages should be in ascending order
      for (let i = 1; i < result.categories.length; i++) {
        expect(result.categories[i].cumulativePercentage).toBeGreaterThanOrEqual(
          result.categories[i - 1].cumulativePercentage
        );
      }

      // Last cumulative percentage should be 100%
      expect(result.categories[result.categories.length - 1].cumulativePercentage).toBeCloseTo(100, 1);
    });

    it('should identify Pareto categories (80/20 rule)', () => {
      const transactions: Transaction[] = [
        // Category 1: 800 (80% of total)
        { id: 1, date: new Date('2024-01-01'), description: 'Item 1', amount: 800, categoryId: 1 },
        // Category 2: 100 (10% of total)
        { id: 2, date: new Date('2024-01-02'), description: 'Item 2', amount: 100, categoryId: 2 },
        // Category 3: 100 (10% of total)
        { id: 3, date: new Date('2024-01-03'), description: 'Item 3', amount: 100, categoryId: 3 },
      ];

      const result = calculateParetoAnalysis(transactions, mockCategories);

      // Pareto threshold should be 80% of total (800)
      expect(result.paretoThreshold).toBe(800);

      // Category 1 should be in Pareto group
      expect(result.paretoCategories.length).toBeGreaterThanOrEqual(1);
      expect(result.paretoCategories[0].categoryName).toBe('Alimentation');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty transactions array', () => {
      const result = calculateParetoAnalysis([], mockCategories);

      expect(result.totalSpending).toBe(0);
      expect(result.categories).toEqual([]);
      expect(result.paretoCategories).toEqual([]);
      expect(result.paretoThreshold).toBe(0);
    });

    it('should handle single transaction', () => {
      const transactions: Transaction[] = [
        { id: 1, date: new Date('2024-01-01'), description: 'Only one', amount: 100, categoryId: 1 },
      ];

      const result = calculateParetoAnalysis(transactions, mockCategories);

      expect(result.totalSpending).toBe(100);
      expect(result.categories.length).toBe(1);
      expect(result.paretoCategories.length).toBe(1);
      expect(result.categories[0].percentage).toBe(100);
    });

    it('should handle uncategorized transactions (null categoryId)', () => {
      const transactions: Transaction[] = [
        { id: 1, date: new Date('2024-01-01'), description: 'Uncategorized', amount: 100, categoryId: null },
        { id: 2, date: new Date('2024-01-02'), description: 'Categorized', amount: 50, categoryId: 1 },
      ];

      const result = calculateParetoAnalysis(transactions, mockCategories);

      expect(result.totalSpending).toBe(150);
      expect(result.categories.length).toBe(2);

      // Uncategorized should appear as "Non catégorisé"
      const uncategorized = result.categories.find(cat => cat.categoryName === 'Non catégorisé');
      expect(uncategorized).toBeDefined();
      expect(uncategorized?.totalAmount).toBe(100);
    });

    it('should handle negative amounts (treats as absolute values)', () => {
      const transactions: Transaction[] = [
        { id: 1, date: new Date('2024-01-01'), description: 'Expense', amount: -100, categoryId: 1 },
        { id: 2, date: new Date('2024-01-02'), description: 'Income', amount: 50, categoryId: 1 },
      ];

      const result = calculateParetoAnalysis(transactions, mockCategories);

      // Should use absolute values
      expect(result.totalSpending).toBe(150);
      expect(result.categories[0].totalAmount).toBe(150);
    });

    it('should handle all transactions in same category', () => {
      const transactions: Transaction[] = [
        { id: 1, date: new Date('2024-01-01'), description: 'Item 1', amount: 100, categoryId: 1 },
        { id: 2, date: new Date('2024-01-02'), description: 'Item 2', amount: 200, categoryId: 1 },
        { id: 3, date: new Date('2024-01-03'), description: 'Item 3', amount: 300, categoryId: 1 },
      ];

      const result = calculateParetoAnalysis(transactions, mockCategories);

      expect(result.categories.length).toBe(1);
      expect(result.categories[0].percentage).toBe(100);
      expect(result.paretoCategories.length).toBe(1);
    });

    it('should handle equal spending across categories', () => {
      const transactions: Transaction[] = [
        { id: 1, date: new Date('2024-01-01'), description: 'Cat 1', amount: 100, categoryId: 1 },
        { id: 2, date: new Date('2024-01-02'), description: 'Cat 2', amount: 100, categoryId: 2 },
        { id: 3, date: new Date('2024-01-03'), description: 'Cat 3', amount: 100, categoryId: 3 },
      ];

      const result = calculateParetoAnalysis(transactions, mockCategories);

      expect(result.totalSpending).toBe(300);
      expect(result.categories.length).toBe(3);

      // Each category should have 33.33% of spending
      result.categories.forEach(cat => {
        expect(cat.percentage).toBeCloseTo(33.33, 1);
      });
    });
  });

  describe('Data integrity', () => {
    it('should maintain transaction count accuracy', () => {
      const transactions: Transaction[] = [
        { id: 1, date: new Date('2024-01-01'), description: 'Item 1', amount: 50, categoryId: 1 },
        { id: 2, date: new Date('2024-01-02'), description: 'Item 2', amount: 50, categoryId: 1 },
        { id: 3, date: new Date('2024-01-03'), description: 'Item 3', amount: 100, categoryId: 2 },
      ];

      const result = calculateParetoAnalysis(transactions, mockCategories);

      expect(result.categories[0].transactionCount).toBe(2);
      expect(result.categories[1].transactionCount).toBe(1);
    });

    it('should sort categories by amount in descending order', () => {
      const transactions: Transaction[] = [
        { id: 1, date: new Date('2024-01-01'), description: 'Small', amount: 10, categoryId: 1 },
        { id: 2, date: new Date('2024-01-02'), description: 'Large', amount: 1000, categoryId: 2 },
        { id: 3, date: new Date('2024-01-03'), description: 'Medium', amount: 100, categoryId: 3 },
      ];

      const result = calculateParetoAnalysis(transactions, mockCategories);

      expect(result.categories[0].totalAmount).toBe(1000);
      expect(result.categories[1].totalAmount).toBe(100);
      expect(result.categories[2].totalAmount).toBe(10);
    });
  });
});

describe('getParetoCount', () => {
  it('should return the number of Pareto categories', () => {
    const mockAnalysis = {
      categories: [],
      paretoCategories: [
        { categoryId: 1, categoryName: 'Cat 1', totalAmount: 800, transactionCount: 10, percentage: 80, cumulativePercentage: 80 },
      ],
      totalSpending: 1000,
      paretoThreshold: 800,
    };

    expect(getParetoCount(mockAnalysis)).toBe(1);
  });

  it('should return 0 for empty Pareto categories', () => {
    const mockAnalysis = {
      categories: [],
      paretoCategories: [],
      totalSpending: 0,
      paretoThreshold: 0,
    };

    expect(getParetoCount(mockAnalysis)).toBe(0);
  });
});

describe('isParetoCategory', () => {
  const mockAnalysis = {
    categories: [],
    paretoCategories: [
      { categoryId: 1, categoryName: 'Cat 1', totalAmount: 800, transactionCount: 10, percentage: 80, cumulativePercentage: 80 },
      { categoryId: 2, categoryName: 'Cat 2', totalAmount: 150, transactionCount: 5, percentage: 15, cumulativePercentage: 95 },
    ],
    totalSpending: 1000,
    paretoThreshold: 800,
  };

  it('should return true for categories in Pareto group', () => {
    expect(isParetoCategory(1, mockAnalysis)).toBe(true);
    expect(isParetoCategory(2, mockAnalysis)).toBe(true);
  });

  it('should return false for categories not in Pareto group', () => {
    expect(isParetoCategory(3, mockAnalysis)).toBe(false);
    expect(isParetoCategory(999, mockAnalysis)).toBe(false);
  });
});
