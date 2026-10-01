import React from 'react';
import {
  LayoutDashboard,
  Package,
  Pill,
  Clock,
  BarChart3,
  Settings,
  Grid
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, lowStockCount = 0 }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: lowStockCount > 0 ? lowStockCount : null },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'dispense', label: 'Dispense', icon: Pill },
    { id: 'history', label: 'History', icon: Clock },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col justify-between select-none">
      <div>
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="w-9 h-9 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-sm">
            {/* Custom Pharmacy Grid Icon */}
            <Grid className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">PharmaFlow</h1>
            <p className="text-xs text-slate-400">Pharmacy System</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 mt-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-50/80 text-teal-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[11px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Pharmacist Profile Footer */}
      <div className="p-4 border-t border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-white font-semibold text-xs shadow-xs">
          SC
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-900 truncate">Dr. Sarah Chen</p>
          <p className="text-[11px] text-slate-400 truncate">Pharmacist</p>
        </div>
      </div>
    </aside>
  );
}
