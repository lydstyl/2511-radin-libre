/**
 * CSV Import Domain Logic
 *
 * Pure functions for parsing CSV files and mapping columns to transactions.
 */

export interface ColumnMapping {
  dateColumn: number;
  descriptionColumn: number;
  amountColumn: number;
}

export interface MappedRow {
  date: string;
  description: string;
  amount: string;
}

export interface ValidatedTransaction {
  date: Date;
  description: string;
  amount: number;
}

export interface ValidationResult {
  success: boolean;
  data?: ValidatedTransaction;
  error?: string;
}

export interface InvalidRow {
  rowIndex: number;
  row: string[];
  error: string;
}

export interface ParseResult {
  valid: ValidatedTransaction[];
  invalid: InvalidRow[];
}

/**
 * Detects column headers from the first row of CSV
 */
export function detectColumnHeaders(firstRow: string[]): string[] {
  return firstRow.map(header => header.trim());
}

/**
 * Maps a CSV row to transaction fields based on column mapping
 * Returns null if the row cannot be mapped (e.g., too short)
 */
export function mapColumnsToTransaction(
  row: string[],
  mapping: ColumnMapping
): MappedRow | null {
  const { dateColumn, descriptionColumn, amountColumn } = mapping;

  // Check if all required columns exist in the row
  const maxIndex = Math.max(dateColumn, descriptionColumn, amountColumn);
  if (row.length <= maxIndex) {
    return null;
  }

  return {
    date: row[dateColumn],
    description: row[descriptionColumn],
    amount: row[amountColumn],
  };
}

/**
 * Parses a date string supporting multiple formats
 */
function parseDate(dateString: string): Date | null {
  const trimmed = dateString.trim();

  // Try ISO format first (YYYY-MM-DD or full ISO)
  let date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return date;
  }

  // Try DD/MM/YYYY format
  const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const match = trimmed.match(ddmmyyyyRegex);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1; // Months are 0-indexed
    const year = parseInt(match[3], 10);
    date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

/**
 * Validates and transforms a mapped row into a transaction
 */
export function validateTransactionRow(mapped: MappedRow): ValidationResult {
  // Validate date
  const date = parseDate(mapped.date);
  if (!date) {
    return {
      success: false,
      error: 'Invalid date format',
    };
  }

  // Validate description
  const description = mapped.description.trim();
  if (description.length === 0) {
    return {
      success: false,
      error: 'Description cannot be empty',
    };
  }

  // Validate amount
  const amount = parseFloat(mapped.amount);
  if (isNaN(amount)) {
    return {
      success: false,
      error: 'Invalid amount format',
    };
  }

  return {
    success: true,
    data: {
      date,
      description,
      amount,
    },
  };
}

/**
 * Parses CSV rows into valid and invalid transactions
 */
export function parseCSVToTransactions(
  rows: string[][],
  mapping: ColumnMapping
): ParseResult {
  const valid: ValidatedTransaction[] = [];
  const invalid: InvalidRow[] = [];

  rows.forEach((row, index) => {
    // Try to map the row
    const mapped = mapColumnsToTransaction(row, mapping);
    if (!mapped) {
      invalid.push({
        rowIndex: index,
        row,
        error: 'Could not map columns (row too short)',
      });
      return;
    }

    // Validate the mapped row
    const validation = validateTransactionRow(mapped);
    if (validation.success && validation.data) {
      valid.push(validation.data);
    } else {
      invalid.push({
        rowIndex: index,
        row,
        error: validation.error || 'Validation failed',
      });
    }
  });

  return { valid, invalid };
}
