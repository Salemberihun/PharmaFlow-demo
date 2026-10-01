import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Dispense from './pages/Dispense';
import History from './pages/History';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lowStockCount, setLowStockCount] = useState(1);

  // Periodically or initially check low stock count for sidebar badge
  const updateAlerts = async () => {
    try {
      const data = await api.getDashboard();
      if (data && typeof data.low_stock_count === 'number') {
        setLowStockCount(data.low_stock_count);
      }
    } catch {
      // Keep initial value
    }
  };

  useEffect(() => {
    updateAlerts();
  }, [activeTab]);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Fixed Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lowStockCount={lowStockCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto min-h-screen bg-slate-50/50">
        {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'dispense' && <Dispense onNavigate={setActiveTab} />}
        {activeTab === 'history' && <History />}
        {activeTab === 'reports' && <Reports />}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
}
