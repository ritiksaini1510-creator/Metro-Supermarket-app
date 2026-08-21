import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, ChevronRight, X, Sparkles, RefreshCw } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { MainNavTab } from './AppFooter';

interface AlertsBannerProps {
  onNavigate: (tab: MainNavTab, filter?: string) => void;
}

export const AlertsBanner: React.FC<AlertsBannerProps> = ({ onNavigate }) => {
  const { alerts, settings } = useStore();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || alerts.totalAlertsCount === 0 || !settings.enableLowStockAlerts) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 border-b border-amber-500/30 px-4 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center space-x-2.5">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
          </span>
          <div className="text-xs sm:text-sm font-semibold text-slate-800 flex items-center flex-wrap gap-2">
            <span className="font-bold text-amber-900">Inventory Watch:</span>
            {alerts.outOfStockCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                {alerts.outOfStockCount} Out of Stock
              </span>
            )}
            {alerts.lowStockCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                {alerts.lowStockCount} Low Stock (&lt;{settings.lowStockGlobalThreshold})
              </span>
            )}
            {alerts.nearExpiryCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                {alerts.nearExpiryCount} Near Expiry (&lt;{settings.expiryWarningDays}d)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 self-end sm:self-auto">
          <button
            onClick={() => onNavigate('inventory')}
            className="text-xs font-bold text-slate-800 bg-white/90 hover:bg-white px-3 py-1 rounded-lg border border-slate-300/80 shadow-xs flex items-center space-x-1 transition-all hover:translate-x-0.5"
          >
            <span>Review & Reorder</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-black/5"
            title="Dismiss until next reload"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
