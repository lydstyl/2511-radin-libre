'use client';

import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import {
  detectColumnHeaders,
  parseCSVToTransactions,
  ColumnMapping,
  ParseResult,
} from '@/domain/csv-import';

type ImportStep = 'select-file' | 'map-columns' | 'preview' | 'importing' | 'complete';

export interface CSVImportState {
  step: ImportStep;
  file: File | null;
  headers: string[];
  rawData: string[][];
  columnMapping: ColumnMapping | null;
  parseResult: ParseResult | null;
  error: string | null;
}

export interface CSVImportActions {
  selectFile: (file: File) => void;
  setColumnMapping: (mapping: ColumnMapping) => void;
  parseData: () => void;
  confirmImport: () => Promise<void>;
  reset: () => void;
}

const initialState: CSVImportState = {
  step: 'select-file',
  file: null,
  headers: [],
  rawData: [],
  columnMapping: null,
  parseResult: null,
  error: null,
};

export function useCSVImport(): [CSVImportState, CSVImportActions] {
  const [state, setState] = useState<CSVImportState>(initialState);

  const selectFile = useCallback((file: File) => {
    setState({ ...initialState, file, step: 'select-file' });

    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          setState((prev) => ({
            ...prev,
            error: 'Le fichier CSV est vide',
            step: 'select-file',
          }));
          return;
        }

        const [firstRow, ...dataRows] = results.data;
        const headers = detectColumnHeaders(firstRow);

        setState((prev) => ({
          ...prev,
          headers,
          rawData: dataRows,
          step: 'map-columns',
          error: null,
        }));
      },
      error: (error) => {
        setState((prev) => ({
          ...prev,
          error: `Erreur lors de la lecture du fichier: ${error.message}`,
          step: 'select-file',
        }));
      },
    });
  }, []);

  const setColumnMapping = useCallback((mapping: ColumnMapping) => {
    setState((prev) => ({
      ...prev,
      columnMapping: mapping,
    }));
  }, []);

  const parseData = useCallback(() => {
    setState((prev) => {
      if (!prev.columnMapping) {
        return {
          ...prev,
          error: 'Veuillez définir le mapping des colonnes',
        };
      }

      const parseResult = parseCSVToTransactions(prev.rawData, prev.columnMapping);

      return {
        ...prev,
        parseResult,
        step: 'preview',
        error: null,
      };
    });
  }, []);

  const confirmImport = useCallback(async () => {
    setState((prev) => ({ ...prev, step: 'importing' }));

    try {
      if (!state.parseResult || state.parseResult.valid.length === 0) {
        throw new Error('Aucune transaction valide à importer');
      }

      // Call API to import transactions
      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: state.parseResult.valid,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de l\'importation');
      }

      setState((prev) => ({
        ...prev,
        step: 'complete',
        error: null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        step: 'preview',
      }));
    }
  }, [state.parseResult]);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return [
    state,
    {
      selectFile,
      setColumnMapping,
      parseData,
      confirmImport,
      reset,
    },
  ];
}
