import { describe, it, expect } from 'vitest';
import {
  detectColumnHeaders,
  mapColumnsToTransaction,
  validateTransactionRow,
  parseCSVToTransactions,
  ColumnMapping,
} from './csv-import';

describe('CSV Import Logic', () => {
  describe('detectColumnHeaders', () => {
    it('should detect column headers from first row', () => {
      const firstRow = ['Date', 'Description', 'Amount', 'Category'];
      const result = detectColumnHeaders(firstRow);

      expect(result).toEqual(['Date', 'Description', 'Amount', 'Category']);
    });

    it('should handle empty headers', () => {
      const firstRow: string[] = [];
      const result = detectColumnHeaders(firstRow);

      expect(result).toEqual([]);
    });

    it('should trim whitespace from headers', () => {
      const firstRow = ['  Date  ', ' Description ', 'Amount'];
      const result = detectColumnHeaders(firstRow);

      expect(result).toEqual(['Date', 'Description', 'Amount']);
    });
  });

  describe('mapColumnsToTransaction', () => {
    describe('happy path', () => {
      it('should map columns to transaction fields correctly', () => {
        const row = ['2025-01-15', 'Groceries', '45.50'];
        const mapping: ColumnMapping = {
          dateColumn: 0,
          descriptionColumn: 1,
          amountColumn: 2,
        };

        const result = mapColumnsToTransaction(row, mapping);

        expect(result).toEqual({
          date: '2025-01-15',
          description: 'Groceries',
          amount: '45.50',
        });
      });

      it('should handle different column order', () => {
        const row = ['Transport', '2025-02-20', '-25.00'];
        const mapping: ColumnMapping = {
          dateColumn: 1,
          descriptionColumn: 0,
          amountColumn: 2,
        };

        const result = mapColumnsToTransaction(row, mapping);

        expect(result).toEqual({
          date: '2025-02-20',
          description: 'Transport',
          amount: '-25.00',
        });
      });

      it('should handle extra columns', () => {
        const row = ['2025-03-10', 'Shopping', '100.00', 'Extra1', 'Extra2'];
        const mapping: ColumnMapping = {
          dateColumn: 0,
          descriptionColumn: 1,
          amountColumn: 2,
        };

        const result = mapColumnsToTransaction(row, mapping);

        expect(result).toEqual({
          date: '2025-03-10',
          description: 'Shopping',
          amount: '100.00',
        });
      });
    });

    describe('edge cases', () => {
      it('should return null if row is too short', () => {
        const row = ['2025-01-15'];
        const mapping: ColumnMapping = {
          dateColumn: 0,
          descriptionColumn: 1,
          amountColumn: 2,
        };

        const result = mapColumnsToTransaction(row, mapping);

        expect(result).toBeNull();
      });

      it('should return null if date column index is out of bounds', () => {
        const row = ['2025-01-15', 'Description', '45.50'];
        const mapping: ColumnMapping = {
          dateColumn: 5,
          descriptionColumn: 1,
          amountColumn: 2,
        };

        const result = mapColumnsToTransaction(row, mapping);

        expect(result).toBeNull();
      });

      it('should return null if amount column index is out of bounds', () => {
        const row = ['2025-01-15', 'Description', '45.50'];
        const mapping: ColumnMapping = {
          dateColumn: 0,
          descriptionColumn: 1,
          amountColumn: 10,
        };

        const result = mapColumnsToTransaction(row, mapping);

        expect(result).toBeNull();
      });
    });
  });

  describe('validateTransactionRow', () => {
    describe('valid rows', () => {
      it('should validate a correct transaction', () => {
        const mapped = {
          date: '2025-01-15',
          description: 'Groceries',
          amount: '45.50',
        };

        const result = validateTransactionRow(mapped);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.date).toBeInstanceOf(Date);
          expect(result.data.description).toBe('Groceries');
          expect(result.data.amount).toBe(45.50);
        }
      });

      it('should handle negative amounts', () => {
        const mapped = {
          date: '2025-01-15',
          description: 'Refund',
          amount: '-20.00',
        };

        const result = validateTransactionRow(mapped);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.amount).toBe(-20.00);
        }
      });

      it('should handle different date formats (ISO)', () => {
        const mapped = {
          date: '2025-01-15T10:30:00Z',
          description: 'Test',
          amount: '10.00',
        };

        const result = validateTransactionRow(mapped);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.date).toBeInstanceOf(Date);
        }
      });

      it('should handle DD/MM/YYYY format', () => {
        const mapped = {
          date: '15/01/2025',
          description: 'Test',
          amount: '10.00',
        };

        const result = validateTransactionRow(mapped);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.date.getDate()).toBe(15);
          expect(result.data.date.getMonth()).toBe(0); // January
          expect(result.data.date.getFullYear()).toBe(2025);
        }
      });

      it('should trim whitespace from description', () => {
        const mapped = {
          date: '2025-01-15',
          description: '  Groceries  ',
          amount: '45.50',
        };

        const result = validateTransactionRow(mapped);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.description).toBe('Groceries');
        }
      });
    });

    describe('invalid rows', () => {
      it('should reject invalid date', () => {
        const mapped = {
          date: 'not-a-date',
          description: 'Test',
          amount: '10.00',
        };

        const result = validateTransactionRow(mapped);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('date');
        }
      });

      it('should reject empty description', () => {
        const mapped = {
          date: '2025-01-15',
          description: '',
          amount: '10.00',
        };

        const result = validateTransactionRow(mapped);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe('Description cannot be empty');
        }
      });

      it('should reject whitespace-only description', () => {
        const mapped = {
          date: '2025-01-15',
          description: '   ',
          amount: '10.00',
        };

        const result = validateTransactionRow(mapped);

        expect(result.success).toBe(false);
      });

      it('should reject invalid amount', () => {
        const mapped = {
          date: '2025-01-15',
          description: 'Test',
          amount: 'not-a-number',
        };

        const result = validateTransactionRow(mapped);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('amount');
        }
      });

      it('should reject empty amount', () => {
        const mapped = {
          date: '2025-01-15',
          description: 'Test',
          amount: '',
        };

        const result = validateTransactionRow(mapped);

        expect(result.success).toBe(false);
      });
    });
  });

  describe('parseCSVToTransactions', () => {
    describe('happy path', () => {
      it('should parse complete CSV data', () => {
        const rows = [
          ['2025-01-15', 'Groceries', '45.50'],
          ['2025-01-16', 'Transport', '12.00'],
          ['2025-01-17', 'Shopping', '100.00'],
        ];
        const mapping: ColumnMapping = {
          dateColumn: 0,
          descriptionColumn: 1,
          amountColumn: 2,
        };

        const result = parseCSVToTransactions(rows, mapping);

        expect(result.valid.length).toBe(3);
        expect(result.invalid.length).toBe(0);
        expect(result.valid[0].description).toBe('Groceries');
        expect(result.valid[1].amount).toBe(12.00);
      });

      it('should handle mixed valid and invalid rows', () => {
        const rows = [
          ['2025-01-15', 'Groceries', '45.50'],
          ['invalid-date', 'Transport', '12.00'],
          ['2025-01-17', '', '100.00'],
          ['2025-01-18', 'Valid', '50.00'],
        ];
        const mapping: ColumnMapping = {
          dateColumn: 0,
          descriptionColumn: 1,
          amountColumn: 2,
        };

        const result = parseCSVToTransactions(rows, mapping);

        expect(result.valid.length).toBe(2);
        expect(result.invalid.length).toBe(2);
        expect(result.valid[0].description).toBe('Groceries');
        expect(result.valid[1].description).toBe('Valid');
      });
    });

    describe('edge cases', () => {
      it('should handle empty rows array', () => {
        const rows: string[][] = [];
        const mapping: ColumnMapping = {
          dateColumn: 0,
          descriptionColumn: 1,
          amountColumn: 2,
        };

        const result = parseCSVToTransactions(rows, mapping);

        expect(result.valid.length).toBe(0);
        expect(result.invalid.length).toBe(0);
      });

      it('should skip rows that cannot be mapped', () => {
        const rows = [
          ['2025-01-15', 'Valid', '45.50'],
          ['short'],
          ['2025-01-17', 'Also Valid', '100.00'],
        ];
        const mapping: ColumnMapping = {
          dateColumn: 0,
          descriptionColumn: 1,
          amountColumn: 2,
        };

        const result = parseCSVToTransactions(rows, mapping);

        expect(result.valid.length).toBe(2);
        expect(result.invalid.length).toBe(1);
        expect(result.invalid[0].error).toContain('map');
      });

      it('should provide row numbers in error messages', () => {
        const rows = [
          ['invalid-date', 'Test', '45.50'],
          ['2025-01-15', '', '45.50'],
        ];
        const mapping: ColumnMapping = {
          dateColumn: 0,
          descriptionColumn: 1,
          amountColumn: 2,
        };

        const result = parseCSVToTransactions(rows, mapping);

        expect(result.invalid.length).toBe(2);
        expect(result.invalid[0].rowIndex).toBe(0);
        expect(result.invalid[1].rowIndex).toBe(1);
      });
    });
  });
});
