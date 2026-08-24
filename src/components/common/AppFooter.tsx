import React from 'react';
import {
  Receipt,
  PackagePlus,
  Boxes,
  Settings,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export type MainNavTab = 'pos' | 'products' | 'inventory' | 'settings';

interface AppFooterProps {
  activeTab: MainNavTab;
  setActiveTab: (tab: MainNavTab) => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { cartTotals, products, alerts } = useStore();

  const navButtons = [
    {
      id: 'pos' as MainNavTab,
      label: 'Create Billing',
      shortLabel: 'Billing',
      icon: Receipt,
      badge: cartTotals.itemCount > 0 ? cartTotals.itemCount : null,
      badgeColor: 'bg-emerald-500 text-slate-950',
    },
    {
      id: 'products' as MainNavTab,
      label: 'Update Product',
      shortLabel: 'Products',
      icon: PackagePlus,
      badge: products.length > 0 ? products.length : null,
      badgeColor: 'bg-slate-700 text-slate-200 border border-slate-600',
    },
    {
      id: 'inventory' as MainNavTab,
      label: 'Inventory',
      shortLabel: 'Inventory',
      icon: Boxes,
      badge: (alerts.lowStockCount + alerts.outOfStockCount) > 0 
        ? (alerts.lowStockCount + alerts.outOfStockCount) 
        : null,
      badgeColor: 'bg-amber-500 text-slate-950',
    },
    {
      id: 'settings' as MainNavTab,
      label: 'Setting',
      shortLabel: 'Setting',
      icon: Settings,
      badge: null,
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
                {btn.badge !== null && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 min-w-[17px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center shadow-xs ${
                      btn.badgeColor || 'bg-emerald-500 text-slate-950'
                    }`}
                  >
                    {btn.badge}
                  </span>
                )}
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
