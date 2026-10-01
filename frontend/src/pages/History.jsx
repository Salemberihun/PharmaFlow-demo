import React, { useState, useEffect } from 'react';
import { Search, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async (query = '') => {
    try {
      setLoading(true);
      const res = await api.getDispensingHistory({ search: query });
      setTransactions(res.transactions || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to load dispensing history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHistory(filterText);
    }, 200);
    return () => clearTimeout(timer);
  }, [filterText]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header with Title and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dispensing History</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {transactions.length} total transactions
          </p>
        </div>

        {/* Filter Input matching top-right in Figma */}
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-2xs"
          />
        </div>
      </div>

      {/* History Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            <p className="mt-2 text-xs text-slate-400">Loading transactions...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 text-sm flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No transactions found matching "{filterText}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-white">
                  <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Medicine
                  </th>
                  <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Batch
                  </th>
                  <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Pharmacist
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="font-medium text-slate-900 leading-tight">
                        {tx.formatted_date || '—'}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {tx.formatted_time || '—'}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900">
                      {tx.medicine_name}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 font-mono text-xs">
                      {tx.batch_number}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-900">
                      {tx.quantity} {tx.unit}
                    </td>
                    <td className="py-3.5 px-6 text-slate-700 font-medium">
                      {tx.pharmacist_name}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
