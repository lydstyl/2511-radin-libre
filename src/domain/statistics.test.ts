/**
 * Tests for Statistical Analysis Functions
 */

import { describe, it, expect } from 'vitest';
import {
  calculateSpendingStats,
  calculateStatsByCategory,
  calculateDailyAverage,
  calculateMonthlyAverage,
  calculateStandardDeviation,
  findOutliers,
} from './statistics';
import { Transaction } from './types';

describe('calculateSpendingStats', () => {
  describe('Happy path', () => {
    it('should calculate correct statistics for typical data', () => {
      const transactions: Transaction[] = [
        { id: 1, date: new Date('2024-01-01'), description: 'Item 1', amount: 100, categoryId: 1 },
        { id: 2, date: new Date('2024-01-02'), description: 'Item 2', amount: 200, categoryId: 1 },
        { id: 3, date: new Date('2024-01-03'), description: 'Item 3', amount: 300, categoryId: 1 },
      ];

      const stats = calculateSpendingStats(transactions);

      expect(stats.total).toBe(600);
      expect(stats.average).toBe(200);
      expect(stats.median).toBe(200);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(300);
      expect(stats.count).toBe(3);
    });

    it('should calculate median correctly for even number of transactions', () => {
      const transactions: Transaction[] = [
        { id: 1, date: new Date('2024-01-01'), description: 'Item 1', amount: 100, categoryId: 1 },
        { id: 2, date: new Date('2024-01-02'), description: 'Item 2', amount: 200, categoryId: 1 },
        { id: 3, date: new Date('2024-01-03'), description: 'Item 3', amount: 300, categoryId: 1 },
        { id: 4, date: new Date('2024-01-04'), description: 'Item 4', amount: 400, categoryId: 1 },
      ];

      const stats = calculateSpendingStats(transactions);

      // Median of [100, 200, 300, 400] = (200 + 300) / 2 = 250
      expect(stats.median).toBe(250);
    });

    it('should calculate median correctly for odd number of transactions', () => {
      const transactions: Transaction[] = [
        { id: 1, date: new Date('2024-01-01'), description: 'Item 1', amount: 100, categoryId: 1 },
        { id: 2, date: new Date('2024-01-02'), description: 'Item 2', amount: 200, categoryId: 1 },
        { id: 3, date: new Date('2024-01-03'), description: 'Item 3', amount: 300, categoryId: 1 },
      ];

      const stats = calculateSpendingStats(transactions);

      // Median of [100, 200, 300] = 200
      expect(stats.median).toBe(200);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty transactions array', () => {
      const stats = calculateSpendingStats([]);

      expect(stats.total).toBe(0);
      expect(stats.average).toBe(0);
      expect(stats.median).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
      expect(stats.count).toBe(0);
    });

    it('should handle single transaction', () => {
      const transactions: Transaction[] = [
        { id: 1, date: new Date('2024-01-01'), description: 'Only one', amount: 150, categoryId: 1 },
      ];

      const stats = calculateSpendingStats(transactions);

      expect(stats.total).toBe(150);
      expect(stats.average).toBe(150);
      expect(stats.median).toBe(150);
      expect(stats.min).toBe(150);
      expect(stats.max).toBe(150);
      expect(stats.count).toBe(1);
    });

    it('should handle negative amounts (treats as absolute)', () => {
      const transactions: Transaction[] = [
        { id: 1, date: new Date('2024-01-01'), description: 'Negative', amount: -100, categoryId: 1 },
        { id: 2, date: new Date('2024-01-02'), description: 'Positive', amount: 200, categoryId: 1 },
      ];

      const stats = calculateSpendingStats(transactions);

      expect(stats.total).toBe(300);
      expect(stats.average).toBe(150);
    });

    it('should handle all identical amounts', () => {
      const transactions: Transaction[] = [
        { id: 1, date: new Date('2024-01-01'), description: 'Item 1', amount: 100, categoryId: 1 },
        { id: 2, date: new Date('2024-01-02'), description: 'Item 2', amount: 100, categoryId: 1 },
        { id: 3, date: new Date('2024-01-03'), description: 'Item 3', amount: 100, categoryId: 1 },
      ];

      const stats = calculateSpendingStats(transactions);

      expect(stats.total).toBe(300);
      expect(stats.average).toBe(100);
      expect(stats.median).toBe(100);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(100);
    });
  });
});

describe('calculateStatsByCategory', () => {
  it('should calculate statistics grouped by category', () => {
    const transactions: Transaction[] = [
      { id: 1, date: new Date('2024-01-01'), description: 'Food 1', amount: 100, categoryId: 1 },
      { id: 2, date: new Date('2024-01-02'), description: 'Food 2', amount: 200, categoryId: 1 },
      { id: 3, date: new Date('2024-01-03'), description: 'Transport', amount: 50, categoryId: 2 },
    ];

    const statsByCategory = calculateStatsByCategory(transactions);

    expect(statsByCategory.size).toBe(2);

    const category1Stats = statsByCategory.get(1);
    expect(category1Stats?.total).toBe(300);
    expect(category1Stats?.count).toBe(2);

    const category2Stats = statsByCategory.get(2);
    expect(category2Stats?.total).toBe(50);
    expect(category2Stats?.count).toBe(1);
  });

  it('should handle uncategorized transactions', () => {
    const transactions: Transaction[] = [
      { id: 1, date: new Date('2024-01-01'), description: 'Uncategorized', amount: 100, categoryId: null },
      { id: 2, date: new Date('2024-01-02'), description: 'Categorized', amount: 200, categoryId: 1 },
    ];

    const statsByCategory = calculateStatsByCategory(transactions);

    // Uncategorized transactions should be under category 0
    expect(statsByCategory.has(0)).toBe(true);
    expect(statsByCategory.get(0)?.total).toBe(100);
  });

  it('should return empty map for empty transactions', () => {
    const statsByCategory = calculateStatsByCategory([]);
    expect(statsByCategory.size).toBe(0);
  });
});

describe('calculateDailyAverage', () => {
  it('should calculate correct daily average', () => {
    const transactions: Transaction[] = [
      { id: 1, date: new Date('2024-01-01'), description: 'Day 1', amount: 100, categoryId: 1 },
      { id: 2, date: new Date('2024-01-02'), description: 'Day 2', amount: 200, categoryId: 1 },
    ];

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-10'); // 10 days total

    const dailyAvg = calculateDailyAverage(transactions, startDate, endDate);

    // Total: 300, Days: 10, Average: 30
    expect(dailyAvg).toBe(30);
  });

  it('should handle single day period', () => {
    const transactions: Transaction[] = [
      { id: 1, date: new Date('2024-01-01'), description: 'Day 1', amount: 100, categoryId: 1 },
    ];

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-01');

    const dailyAvg = calculateDailyAverage(transactions, startDate, endDate);

    // Should treat as at least 1 day
    expect(dailyAvg).toBe(100);
  });

  it('should return 0 for empty transactions', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-10');

    const dailyAvg = calculateDailyAverage([], startDate, endDate);
    expect(dailyAvg).toBe(0);
  });
});

describe('calculateMonthlyAverage', () => {
  it('should calculate correct monthly average', () => {
    const transactions: Transaction[] = [
      { id: 1, date: new Date('2024-01-01'), description: 'Month 1', amount: 300, categoryId: 1 },
      { id: 2, date: new Date('2024-02-01'), description: 'Month 2', amount: 600, categoryId: 1 },
    ];

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-03-01'); // 3 months: Jan, Feb, Mar

    const monthlyAvg = calculateMonthlyAverage(transactions, startDate, endDate);

    // Total: 900, Months: 3, Average: 300
    expect(monthlyAvg).toBe(300);
  });

  it('should handle single month period', () => {
    const transactions: Transaction[] = [
      { id: 1, date: new Date('2024-01-15'), description: 'Mid month', amount: 500, categoryId: 1 },
    ];

    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-01-31');

    const monthlyAvg = calculateMonthlyAverage(transactions, startDate, endDate);

    // Should treat as 1 month
    expect(monthlyAvg).toBe(500);
  });

  it('should handle year boundary', () => {
    const transactions: Transaction[] = [
      { id: 1, date: new Date('2023-12-01'), description: 'Dec', amount: 1200, categoryId: 1 },
    ];

    const startDate = new Date('2023-12-01');
    const endDate = new Date('2024-02-01'); // Dec 2023, Jan 2024, Feb 2024 = 3 months

    const monthlyAvg = calculateMonthlyAverage(transactions, startDate, endDate);

    expect(monthlyAvg).toBe(400);
  });

  it('should return 0 for empty transactions', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    const monthlyAvg = calculateMonthlyAverage([], startDate, endDate);
    expect(monthlyAvg).toBe(0);
  });
});

describe('calculateStandardDeviation', () => {
  it('should calculate correct standard deviation', () => {
    const transactions: Transaction[] = [
      { id: 1, date: new Date('2024-01-01'), description: 'Item 1', amount: 100, categoryId: 1 },
      { id: 2, date: new Date('2024-01-02'), description: 'Item 2', amount: 200, categoryId: 1 },
      { id: 3, date: new Date('2024-01-03'), description: 'Item 3', amount: 300, categoryId: 1 },
    ];

    const stdDev = calculateStandardDeviation(transactions);

    // Mean = 200
    // Variance = ((100-200)² + (200-200)² + (300-200)²) / 3 = (10000 + 0 + 10000) / 3 = 6666.67
    // StdDev = sqrt(6666.67) ≈ 81.65
    expect(stdDev).toBeCloseTo(81.65, 1);
  });

  it('should return 0 for identical amounts', () => {
    const transactions: Transaction[] = [
      { id: 1, date: new Date('2024-01-01'), description: 'Item 1', amount: 100, categoryId: 1 },
      { id: 2, date: new Date('2024-01-02'), description: 'Item 2', amount: 100, categoryId: 1 },
      { id: 3, date: new Date('2024-01-03'), description: 'Item 3', amount: 100, categoryId: 1 },
    ];

    const stdDev = calculateStandardDeviation(transactions);
    expect(stdDev).toBe(0);
  });

  it('should return 0 for empty transactions', () => {
    const stdDev = calculateStandardDeviation([]);
    expect(stdDev).toBe(0);
  });

  it('should return 0 for single transaction', () => {
    const transactions: Transaction[] = [
      { id: 1, date: new Date('2024-01-01'), description: 'Only one', amount: 100, categoryId: 1 },
    ];

    const stdDev = calculateStandardDeviation(transactions);
    expect(stdDev).toBe(0);
  });
});

describe('findOutliers', () => {
  it('should identify high spending outliers', () => {
    const transactions: Transaction[] = [
      { id: 1, date: new Date('2024-01-01'), description: 'Normal 1', amount: 100, categoryId: 1 },
      { id: 2, date: new Date('2024-01-02'), description: 'Normal 2', amount: 110, categoryId: 1 },
      { id: 3, date: new Date('2024-01-03'), description: 'Normal 3', amount: 120, categoryId: 1 },
      { id: 4, date: new Date('2024-01-04'), description: 'Normal 4', amount: 130, categoryId: 1 },
      { id: 5, date: new Date('2024-01-05'), description: 'Outlier!', amount: 1000, categoryId: 1 },
    ];

    const outliers = findOutliers(transactions);

    expect(outliers.length).toBe(1);
    expect(outliers[0].amount).toBe(1000);
    expect(outliers[0].description).toBe('Outlier!');
  });

  it('should return empty array when no outliers exist', () => {
    const transactions: Transaction[] = [
      { id: 1, date: new Date('2024-01-01'), description: 'Item 1', amount: 100, categoryId: 1 },
      { id: 2, date: new Date('2024-01-02'), description: 'Item 2', amount: 110, categoryId: 1 },
      { id: 3, date: new Date('2024-01-03'), description: 'Item 3', amount: 120, categoryId: 1 },
      { id: 4, date: new Date('2024-01-04'), description: 'Item 4', amount: 130, categoryId: 1 },
    ];

    const outliers = findOutliers(transactions);
    expect(outliers.length).toBe(0);
  });

  it('should return empty array for fewer than 4 transactions', () => {
    const transactions: Transaction[] = [
      { id: 1, date: new Date('2024-01-01'), description: 'Item 1', amount: 100, categoryId: 1 },
      { id: 2, date: new Date('2024-01-02'), description: 'Item 2', amount: 1000, categoryId: 1 },
    ];

    const outliers = findOutliers(transactions);
    expect(outliers.length).toBe(0);
  });

  it('should respect custom threshold parameter', () => {
    const transactions: Transaction[] = [
      { id: 1, date: new Date('2024-01-01'), description: 'Normal 1', amount: 100, categoryId: 1 },
      { id: 2, date: new Date('2024-01-02'), description: 'Normal 2', amount: 110, categoryId: 1 },
      { id: 3, date: new Date('2024-01-03'), description: 'Normal 3', amount: 120, categoryId: 1 },
      { id: 4, date: new Date('2024-01-04'), description: 'Normal 4', amount: 130, categoryId: 1 },
      { id: 5, date: new Date('2024-01-05'), description: 'High', amount: 200, categoryId: 1 },
    ];

    // With stricter threshold (1.0 instead of default 1.5)
    const outliers = findOutliers(transactions, 1.0);

    expect(outliers.length).toBeGreaterThan(0);
  });
});
