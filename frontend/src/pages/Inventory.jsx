import React, { useState, useEffect } from 'react';
import { Search, Plus, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import ReceiveMedicineModal from '../components/ReceiveMedicineModal';

export default function Inventory() {
  const [medicines, setMedicines] = useState([]);
  const [batchesCount, setBatchesCount] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchInventory = async (query = '') => {
    try {
      setLoading(true);
      const res = await api.getMedicines({ search: query, include_batches: true });
      const meds = res.medicines || [];
      setMedicines(meds);

      // Total batches across all medicines
      const totalB = meds.reduce((acc, m) => acc + (m.batch_count || 0), 0);
      setBatchesCount(totalB);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch inventory from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventory(search);
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {medicines.length} medicines · {batchesCount} batches
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Receive Medicine</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search medicine..."
          className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 shadow-2xs"
        />
      </div>

      {/* Inventory Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            <p className="mt-2 text-xs text-slate-400">Loading inventory data...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 text-sm flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : medicines.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No medicines found matching "{search}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-white">
                  <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Medicine
                  </th>
                  <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Strength
                  </th>
                  <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Stock
                  </th>
                  <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Batches
                  </th>
                  <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Earliest Expiry
                  </th>
                  <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {medicines.map((med) => {
                  const isLowStock = med.status === 'Low Stock';
                  return (
                    <tr key={med.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6 font-semibold text-slate-900">
                        {med.brand_name ? (
                          <div>
                            <div>{med.brand_name}</div>
                            {med.generic_name && (
                              <div className="text-xs text-slate-400 font-normal">{med.generic_name}</div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div>{med.name}</div>
                            {med.generic_name && med.generic_name !== med.name && (
                              <div className="text-xs text-slate-400 font-normal">{med.generic_name}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        {med.strength}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        {med.total_stock} {med.unit}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600 font-medium">
                        {med.batch_count}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600">
                        {med.earliest_expiry || '—'}
                      </td>
                      <td className="py-3.5 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isLowStock
                              ? 'bg-amber-50 text-amber-600 border border-amber-200/50'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-200/50'
                          }`}
                        >
                          {med.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receive Medicine Modal */}
      <ReceiveMedicineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchInventory(search)}
        existingMedicines={medicines}
      />
    </div>
  );
}
