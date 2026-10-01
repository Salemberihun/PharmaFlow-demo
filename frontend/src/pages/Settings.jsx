import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, UserCheck, Bell, Server } from 'lucide-react';
import { api } from '../services/api';

export default function Settings() {
  const [health, setHealth] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getHealth(), api.getUsers()])
      .then(([healthRes, usersRes]) => {
        setHealth(healthRes);
        setUsers(usersRes.users || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">System preferences, staff profiles, and database configuration</p>
      </div>

      {/* Database Connection Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">PostgreSQL Database Connection</h2>
            <p className="text-xs text-slate-500">Live connection monitor to database instance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500 block">Connection Status</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-sm font-semibold text-slate-800 capitalize">
                {health?.database || 'Connected'}
              </span>
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500 block">Database Engine</span>
            <span className="text-sm font-semibold text-slate-800 mt-1 block">PostgreSQL / Flask-SQLAlchemy</span>
          </div>
        </div>
      </div>

      {/* Staff & Pharmacists */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Active Pharmacists & Staff</h2>
            <p className="text-xs text-slate-500">Authorized personnel for dispensing medicines</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                  {u.initials || 'RX'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.email || 'pharmacy.staff@pharmaflow.local'}</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full">
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory & Alert Thresholds */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Inventory Alert Thresholds</h2>
            <p className="text-xs text-slate-500">Configured safety boundaries for alerts and reordering</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500 block">Default Minimum Stock</span>
            <span className="text-sm font-semibold text-slate-800 mt-1 block">25 boxes</span>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500 block">Expiry Alert Window</span>
            <span className="text-sm font-semibold text-slate-800 mt-1 block">6 Months (180 Days)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
