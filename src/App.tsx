import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { AppFooter, MainNavTab } from './components/common/AppFooter';
import { AlertsBanner } from './components/common/AlertsBanner';
import { PosView } from './components/pos/PosView';
import { UpdateProductView } from './components/products/UpdateProductView';
import { InventoryView } from './components/inventory/InventoryView';
import { SettingsView } from './components/settings/SettingsView';
import { StoreLoginModal } from './components/auth/StoreLoginModal';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainNavTab>('pos');
  const { isLoginModalOpen, setIsLoginModalOpen } = useStore();

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col antialiased selection:bg-emerald-500 selection:text-white font-sans">
      {/* Real-time Inventory Alert Bar */}
      <AlertsBanner onNavigate={(tab) => setActiveTab(tab)} />

      {/* Main Viewport Container */}
      <main className="flex-1 pb-24 overflow-x-hidden">
        {activeTab === 'pos' && <PosView />}
        {activeTab === 'products' && <UpdateProductView />}
        {activeTab === 'inventory' && <InventoryView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Fixed Bottom Navigation Footer */}
      <AppFooter
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Store Login & Terminal Access Modal */}
      <StoreLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
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

