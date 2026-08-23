import React from 'react';
import {
  Receipt,
  PackagePlus,
  Boxes,
  Settings,
} from 'lucide-react';

export type MainNavTab = 'pos' | 'products' | 'inventory' | 'settings';

interface AppFooterProps {
  activeTab: MainNavTab;
  setActiveTab: (tab: MainNavTab) => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const navButtons = [
    {
      id: 'pos' as MainNavTab,
      label: '1. Create Billing',
      shortLabel: 'Create Billing',
      icon: Receipt,
    },
    {
      id: 'products' as MainNavTab,
      label: '2. Update Product',
      shortLabel: 'Update Product',
      icon: PackagePlus,
    },
    {
      id: 'inventory' as MainNavTab,
      label: '3. Inventory',
      shortLabel: 'Inventory',
      icon: Boxes,
    },
    {
      id: 'settings' as MainNavTab,
      label: '4. Setting',
      shortLabel: 'Setting',
      icon: Settings,
    },
  ];

  return (
    <footer 
      id="app-bottom-footer-nav"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 text-white shadow-2xl py-2 px-2 sm:px-6"
    >
      <div className="max-w-5xl mx-auto grid grid-cols-4 gap-1 sm:gap-3">
        {navButtons.map((btn) => {
          const Icon = btn.icon;
          const isActive = activeTab === btn.id;

          return (
            <button
              key={btn.id}
              id={`footer-tab-${btn.id}`}
              onClick={() => setActiveTab(btn.id)}
              className={`relative flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 py-2 px-2 sm:px-4 rounded-2xl font-bold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-[1.02]'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 active:scale-95'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              </div>

              <span className="text-[11px] sm:text-xs tracking-tight whitespace-nowrap">
                <span className="hidden sm:inline">{btn.label}</span>
                <span className="sm:hidden">{btn.shortLabel}</span>
              </span>

              {isActive && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-emerald-300 rounded-full sm:hidden" />
              )}
            </button>
          );
        })}
      </div>
    </footer>
  );
};
