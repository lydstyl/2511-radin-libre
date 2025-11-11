'use client';

import { useCSVImport } from '@/hooks/useCSVImport';
import { ColumnMapping } from '@/domain/csv-import';
import { useState } from 'react';

interface ColumnMappingFormProps {
  headers: string[];
  onSubmit: (mapping: ColumnMapping) => void;
  currentMapping: ColumnMapping | null;
}

function ColumnMappingForm({ headers, onSubmit, currentMapping }: ColumnMappingFormProps) {
  const [dateColumn, setDateColumn] = useState<number>(currentMapping?.dateColumn ?? 0);
  const [descriptionColumn, setDescriptionColumn] = useState<number>(
    currentMapping?.descriptionColumn ?? 1
  );
  const [amountColumn, setAmountColumn] = useState<number>(
    currentMapping?.amountColumn ?? 2
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ dateColumn, descriptionColumn, amountColumn });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Date Column */}
        <div>
          <label htmlFor="dateColumn" className="block text-sm font-medium mb-1">
            Colonne Date
          </label>
          <select
            id="dateColumn"
            value={dateColumn}
            onChange={(e) => setDateColumn(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {headers.map((header, index) => (
              <option key={index} value={index}>
                {header || `Colonne ${index + 1}`}
              </option>
            ))}
          </select>
        </div>

        {/* Description Column */}
        <div>
          <label htmlFor="descriptionColumn" className="block text-sm font-medium mb-1">
            Colonne Description
          </label>
          <select
            id="descriptionColumn"
            value={descriptionColumn}
            onChange={(e) => setDescriptionColumn(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {headers.map((header, index) => (
              <option key={index} value={index}>
                {header || `Colonne ${index + 1}`}
              </option>
            ))}
          </select>
        </div>

        {/* Amount Column */}
        <div>
          <label htmlFor="amountColumn" className="block text-sm font-medium mb-1">
            Colonne Montant
          </label>
          <select
            id="amountColumn"
            value={amountColumn}
            onChange={(e) => setAmountColumn(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {headers.map((header, index) => (
              <option key={index} value={index}>
                {header || `Colonne ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Continuer
      </button>
    </form>
  );
}

export function CSVImport({ onComplete }: { onComplete?: () => void }) {
  const [state, actions] = useCSVImport();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      actions.selectFile(file);
    }
  };

  const handleMappingSubmit = (mapping: ColumnMapping) => {
    actions.setColumnMapping(mapping);
    actions.parseData();
  };

  const handleConfirmImport = async () => {
    await actions.confirmImport();
    if (state.step === 'complete' && onComplete) {
      onComplete();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Importer des transactions</h2>
        <p className="text-gray-600">
          Importez vos transactions depuis un fichier CSV
        </p>
      </div>

      {/* Error Message */}
      {state.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800 text-sm">{state.error}</p>
        </div>
      )}

      {/* Step 1: Select File */}
      {state.step === 'select-file' && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-file-input"
          />
          <label
            htmlFor="csv-file-input"
            className="cursor-pointer inline-flex flex-col items-center"
          >
            <svg
              className="w-12 h-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <span className="text-sm text-gray-600">
              Cliquez pour sélectionner un fichier CSV
            </span>
            <span className="text-xs text-gray-400 mt-1">
              ou glissez-déposez le fichier ici
            </span>
          </label>
        </div>
      )}

      {/* Step 2: Map Columns */}
      {state.step === 'map-columns' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Mapper les colonnes</h3>
            <p className="text-sm text-gray-600 mb-4">
              Indiquez quelle colonne correspond à quelle information
            </p>
          </div>
          <ColumnMappingForm
            headers={state.headers}
            onSubmit={handleMappingSubmit}
            currentMapping={state.columnMapping}
          />
        </div>
      )}

      {/* Step 3: Preview */}
      {state.step === 'preview' && state.parseResult && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Aperçu des données</h3>
            <div className="flex gap-4 text-sm">
              <span className="text-green-600 font-medium">
                {state.parseResult.valid.length} transactions valides
              </span>
              {state.parseResult.invalid.length > 0 && (
                <span className="text-red-600 font-medium">
                  {state.parseResult.invalid.length} lignes invalides
                </span>
              )}
            </div>
          </div>

          {/* Valid Transactions Preview */}
          {state.parseResult.valid.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b">
                <h4 className="font-medium text-sm">
                  Transactions valides (aperçu des 5 premières)
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left">Date</th>
                      <th className="px-4 py-2 text-left">Description</th>
                      <th className="px-4 py-2 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {state.parseResult.valid.slice(0, 5).map((transaction, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {transaction.date.toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-2">{transaction.description}</td>
                        <td className="px-4 py-2 text-right">
                          {transaction.amount.toFixed(2)} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Invalid Rows */}
          {state.parseResult.invalid.length > 0 && (
            <details className="border rounded-lg overflow-hidden">
              <summary className="bg-red-50 px-4 py-2 cursor-pointer hover:bg-red-100">
                <span className="font-medium text-sm">
                  Lignes invalides ({state.parseResult.invalid.length})
                </span>
              </summary>
              <div className="p-4 space-y-2 text-sm">
                {state.parseResult.invalid.slice(0, 10).map((invalid) => (
                  <div key={invalid.rowIndex} className="text-red-600">
                    <span className="font-medium">Ligne {invalid.rowIndex + 1}:</span>{' '}
                    {invalid.error}
                  </div>
                ))}
                {state.parseResult.invalid.length > 10 && (
                  <p className="text-gray-500 italic">
                    ... et {state.parseResult.invalid.length - 10} autres
                  </p>
                )}
              </div>
            </details>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={actions.reset}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={state.parseResult.valid.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Importer {state.parseResult.valid.length} transaction(s)
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Importing */}
      {state.step === 'importing' && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Importation en cours...</p>
        </div>
      )}

      {/* Step 5: Complete */}
      {state.step === 'complete' && state.parseResult && (
        <div className="text-center py-8 space-y-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-600 mb-1">
              Import réussi !
            </h3>
            <p className="text-gray-600">
              {state.parseResult.valid.length} transaction(s) ont été importées
            </p>
          </div>
          <button
            onClick={actions.reset}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Importer un autre fichier
          </button>
        </div>
      )}
    </div>
  );
}
