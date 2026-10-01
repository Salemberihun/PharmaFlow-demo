import React, { useState, useEffect } from 'react';
import { AlertCircle, Calendar } from 'lucide-react';
import { api } from '../services/api';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily', 'inventory', 'expiring'
  const [dailyData, setDailyData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [expiringData, setExpiringData] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeTab === 'daily') {
        const res = await api.getDailyReport(selectedDate);
        setDailyData(res);
      } else if (activeTab === 'inventory') {
        const res = await api.getInventoryReport();
        setInventoryData(res);
      } else if (activeTab === 'expiring') {
        const res = await api.getExpiringReport(180);
        setExpiringData(res);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load operational report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [activeTab, selectedDate]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports</h1>
        <p className="text-sm text-slate-500 mt-0.5">Operational summaries</p>
      </div>

      {/* Pill Tab Navigation matching reports.png */}
      <div className="inline-flex p-1 bg-slate-200/80 rounded-lg text-xs font-semibold text-slate-600">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-4 py-1.5 rounded-md transition-all ${
            activeTab === 'daily'
              ? 'bg-white text-teal-700 font-bold shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          Daily Dispensing
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-1.5 rounded-md transition-all ${
            activeTab === 'inventory'
              ? 'bg-white text-teal-700 font-bold shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          Current Inventory
        </button>
        <button
          onClick={() => setActiveTab('expiring')}
          className={`px-4 py-1.5 rounded-md transition-all ${
            activeTab === 'expiring'
              ? 'bg-white text-teal-700 font-bold shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          Expiring Medicines
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tab 1: Daily Dispensing Report (matches reports.png exactly) */}
      {activeTab === 'daily' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Card Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-slate-900">
                Today's Dispensing — {dailyData?.date_formatted || '29 September 2026'}
              </h2>
            </div>
            <div className="text-xs text-slate-500 font-medium">
              {dailyData?.total_transactions || 0} transactions · {dailyData?.total_boxes || 0} boxes
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              <p className="mt-2 text-xs text-slate-400">Loading daily summary...</p>
            </div>
          ) : !dailyData || dailyData.items.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No dispensing transactions recorded for this date.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-white">
                    <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Medicine
                    </th>
                    <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Batch
                    </th>
                    <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Pharmacist
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {dailyData.items.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-6 text-slate-500 font-medium text-xs">
                        {row.time}
                      </td>
                      <td className="py-3.5 px-6 font-semibold text-slate-900">
                        {row.medicine}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600 font-mono text-xs">
                        {row.batch}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        {row.qty}
                      </td>
                      <td className="py-3.5 px-6 text-slate-700 font-medium">
                        {row.pharmacist}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Current Inventory Report */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-slate-100 gap-2">
            <h2 className="text-sm font-bold text-slate-900">Current Inventory Valuation & Stock Summary</h2>
            <div className="text-xs text-slate-500 font-medium">
              {inventoryData?.total_medicines || 0} medicines · {inventoryData?.total_stock_boxes || 0} boxes
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : !inventoryData || inventoryData.items.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">No inventory records.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-white">
                    <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Medicine</th>
                    <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Strength</th>
                    <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Category</th>
                    <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock</th>
                    <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Batches</th>
                    <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {inventoryData.items.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-6 font-semibold text-slate-900">{m.name}</td>
                      <td className="py-3.5 px-6 text-slate-600">{m.strength}</td>
                      <td className="py-3.5 px-6 text-slate-600">{m.category}</td>
                      <td className="py-3.5 px-6 font-bold text-slate-900">{m.total_stock} {m.unit}</td>
                      <td className="py-3.5 px-6 text-slate-600">{m.batches_count}</td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.status === 'Low Stock' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Expiring Medicines Report */}
      {activeTab === 'expiring' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-slate-100 gap-2">
            <h2 className="text-sm font-bold text-slate-900">Batches Expiring (Within 180 Days)</h2>
            <div className="text-xs text-slate-500 font-medium">
              {expiringData?.total_batches || 0} batches expiring
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
            </div>
          ) : !expiringData || expiringData.batches.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              No batches expiring within the specified 6-month window.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-white">
                    <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Medicine</th>
                    <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Batch</th>
                    <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quantity</th>
                    <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Expiry Date</th>
                    <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Days Left</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {expiringData.batches.map((b) => (
                    <tr key={b.batch_id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-6 font-semibold text-slate-900">{b.medicine_name}</td>
                      <td className="py-3.5 px-6 font-mono text-xs">{b.batch_number}</td>
                      <td className="py-3.5 px-6 font-bold">{b.quantity} {b.unit}</td>
                      <td className="py-3.5 px-6 text-red-600 font-medium">{b.expiry_date}</td>
                      <td className="py-3.5 px-6 font-bold text-red-500">{b.days_remaining} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
