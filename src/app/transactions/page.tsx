'use client';

import { CSVImport } from '@/components/CSVImport';
import { useState } from 'react';

export default function TransactionsPage() {
  const [showImport, setShowImport] = useState(false);

  const handleImportComplete = () => {
    setShowImport(false);
    // TODO: Refresh transactions list
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-900">Gestion des dépenses</h1>
          <button
            onClick={() => setShowImport(!showImport)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {showImport ? 'Annuler' : 'Importer CSV'}
          </button>
        </div>
      </div>

      {showImport && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <CSVImport onComplete={handleImportComplete} />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Liste des transactions</h2>
        <p className="text-gray-600">(Liste des transactions à venir)</p>
      </div>
    </div>
  );
}
