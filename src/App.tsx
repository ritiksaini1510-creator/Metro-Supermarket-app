import React, { useState } from 'react';
import { StoreProvider } from './context/StoreContext';
import { Navbar, ActiveTab } from './components/common/Navbar';
import { AlertsBanner } from './components/common/AlertsBanner';
import { PosView } from './components/pos/PosView';
import { InventoryView } from './components/inventory/InventoryView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { ReportsView } from './components/reports/ReportsView';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { FloorStaffView } from './components/floor/FloorStaffView';
import { SettingsView } from './components/settings/SettingsView';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col antialiased selection:bg-emerald-500 selection:text-white font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAlerts={() => setActiveTab('inventory')}
      />

      {/* Real-time Inventory Alert Bar */}
      <AlertsBanner onNavigate={(tab) => setActiveTab(tab)} />

      {/* Main Viewport Container */}
      <main className="flex-1 pb-12 overflow-x-hidden">
        {activeTab === 'pos' && <PosView />}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'purchases' && <PurchasesView />}
        {activeTab === 'suppliers' && <SuppliersView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
        {activeTab === 'floor' && <FloorStaffView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainLayout />
    </StoreProvider>
  );
}
