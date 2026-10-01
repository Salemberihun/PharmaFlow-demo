import React, { useEffect, useState } from 'react';
import { Pill, AlertTriangle, AlertCircle, Clock } from 'lucide-react';
import { api } from '../services/api';

export default function Dashboard({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboard();
      setData(res);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Failed to connect to backend API. Please ensure Flask server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      </div>
    );
  }

  const {
    date_display = 'Tuesday, 29 September 2026',
    total_medicines = 0,
    total_boxes = 0,
    low_stock_count = 0,
    low_stock_items = [],
    expiring_soon_count = 0,
    expiring_soon_items = [],
    dispensed_today_count = 0,
    dispensed_today_transactions = 0,
    recent_dispensing = []
  } = data || {};

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">{date_display}</p>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Medicines */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-xs relative">
          <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center absolute top-5 right-5 text-slate-400">
            <Pill className="w-3.5 h-3.5 transform -rotate-45" />
          </div>
          <div className="text-3xl font-bold text-teal-600">{total_medicines}</div>
          <div className="mt-2 text-xs font-semibold text-slate-800">Total Medicines</div>
          <div className="text-xs text-slate-400 mt-0.5">{total_boxes} boxes in stock</div>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-xs relative">
          <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center absolute top-5 right-5 text-slate-400">
            <Pill className="w-3.5 h-3.5 transform -rotate-45" />
          </div>
          <div className="text-3xl font-bold text-amber-500">{low_stock_count}</div>
          <div className="mt-2 text-xs font-semibold text-slate-800">Low Stock</div>
          <div className="text-xs text-slate-400 mt-0.5">Need restocking</div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-xs relative">
          <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center absolute top-5 right-5 text-slate-400">
            <Pill className="w-3.5 h-3.5 transform -rotate-45" />
          </div>
          <div className="text-3xl font-bold text-red-500">{expiring_soon_count}</div>
          <div className="mt-2 text-xs font-semibold text-slate-800">Expiring Soon</div>
          <div className="text-xs text-slate-400 mt-0.5">Within 6 months</div>
        </div>

        {/* Dispensed Today */}
        <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-xs relative">
          <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center absolute top-5 right-5 text-slate-400">
            <Pill className="w-3.5 h-3.5 transform -rotate-45" />
          </div>
          <div className="text-3xl font-bold text-blue-600">{dispensed_today_count}</div>
          <div className="mt-2 text-xs font-semibold text-slate-800">Dispensed Today</div>
          <div className="text-xs text-slate-400 mt-0.5">{dispensed_today_transactions} transactions</div>
        </div>
      </div>

      {/* Lower Row - 3 Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Card */}
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-xs min-h-[220px]">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-800">Low Stock</h2>
          </div>

          {low_stock_items.length === 0 ? (
            <p className="text-xs text-slate-400">All medicines have adequate stock levels.</p>
          ) : (
            <div className="space-y-4">
              {low_stock_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
                    <p className="text-xs text-slate-400">{item.strength}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-amber-500">
                      {item.current_stock} {item.unit}
                    </p>
                    <p className="text-xs text-slate-400">min {item.min_stock}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expiring Soon Card */}
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-xs min-h-[220px]">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-800">Expiring Soon</h2>
          </div>

          {expiring_soon_items.length === 0 ? (
            <p className="text-xs text-slate-400">No batches expiring within 6 months.</p>
          ) : (
            <div className="space-y-3">
              {expiring_soon_items.map((b) => (
                <div key={b.id} className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">{b.medicine_name}</span>
                    <span className="text-slate-400 ml-2">Batch {b.batch_number}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-red-500">{b.quantity} boxes</span>
                    <span className="text-slate-400 ml-1">({b.expiry_date})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Dispensing Card */}
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-xs min-h-[220px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-teal-600" />
              <h2 className="text-sm font-semibold text-slate-800">Recent Dispensing</h2>
            </div>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 hover:underline"
            >
              View all
            </button>
          </div>

          {recent_dispensing.length === 0 ? (
            <p className="text-xs text-slate-400">No dispensing activity yet.</p>
          ) : (
            <div className="space-y-3.5">
              {recent_dispensing.slice(0, 4).map((d) => (
                <div key={d.id} className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">{d.medicine_name}</p>
                    <p className="text-[11px] text-slate-400">{d.batch_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">
                      {d.quantity} {d.unit}
                    </p>
                    <p className="text-[11px] text-slate-400">{d.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
