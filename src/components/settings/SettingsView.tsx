import React, { useState } from 'react';
import {
  Settings,
  Store,
  DollarSign,
  AlertTriangle,
  FileText,
  Database,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  Lock,
  Save,
  Printer
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { StoreSettings } from '../../types';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToSampleData,
    exportBackupJSON,
    importBackupJSON,
    currentShift,
    startNewShift,
    closeCurrentShift
  } = useStore();

  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [newShiftFloat, setNewShiftFloat] = useState<number>(100);
  const [actualDrawerCount, setActualDrawerCount] = useState<number>(currentShift.expectedCash);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSuccessMsg('Store settings updated successfully!');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleExport = () => {
    const json = exportBackupJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Supermarket_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importBackupJSON(content);
        if (ok) {
          setImportStatus('Backup restored successfully!');
          setTimeout(() => setImportStatus(null), 3000);
        } else {
          setImportStatus('Failed to import backup file. Invalid format.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Store Configuration & Controls</h1>
            <p className="text-xs text-slate-500">Billing parameters, tax details, cash drawer, and database backups</p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Profile & Taxes Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Store className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Store Details & Tax Identity</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Supermarket Store Name</label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tagline / Subheading</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tax / GSTIN Number</label>
              <input
                type="text"
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store Contact Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Store Street Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Operational Inventory & Threshold Rules */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-900">Inventory Alert Thresholds & Defaults</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Currency Symbol</label>
              <input
                type="text"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Default Low Stock Threshold</label>
              <input
                type="number"
                min="1"
                value={formData.lowStockGlobalThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, lowStockGlobalThreshold: parseInt(e.target.value) || 10 })
                }
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Warning Notice (Days)</label>
              <input
                type="number"
                min="1"
                value={formData.expiryWarningDays}
                onChange={(e) =>
                  setFormData({ ...formData, expiryWarningDays: parseInt(e.target.value) || 30 })
                }
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Receipt Header & Footer */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Printer className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-sm text-slate-900">Thermal Receipt Customization</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Header Note</label>
              <textarea
                rows={2}
                value={formData.receiptHeader}
                onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Footer Note</label>
              <textarea
                rows={2}
                value={formData.receiptFooter}
                onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      </form>

      {/* Cash Drawer & Shift Management */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Active Shift & Cash Drawer Control</h3>
          </div>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
              currentShift.status === 'open' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
            }`}
          >
            Shift: {currentShift.status}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px]">Opening Float</span>
            <span className="font-bold text-slate-900 text-sm">{formData.currencySymbol}{currentShift.openingFloat.toFixed(2)}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px]">Cash Sales</span>
            <span className="font-bold text-emerald-600 text-sm">{formData.currencySymbol}{currentShift.cashSales.toFixed(2)}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px]">Online / Digital Sales</span>
            <span className="font-bold text-blue-600 text-sm">{formData.currencySymbol}{currentShift.onlineSales.toFixed(2)}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px]">Expected Cash in Drawer</span>
            <span className="font-black text-slate-900 text-sm">{formData.currencySymbol}{currentShift.expectedCash.toFixed(2)}</span>
          </div>
        </div>

        {currentShift.status === 'open' ? (
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <input
              type="number"
              value={actualDrawerCount}
              onChange={(e) => setActualDrawerCount(parseFloat(e.target.value) || 0)}
              placeholder="Counted cash at close..."
              className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl w-full sm:w-56 focus:outline-none"
            />
            <button
              onClick={() => closeCurrentShift(actualDrawerCount)}
              className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Close Current Cashier Shift
            </button>
          </div>
        ) : (
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <input
              type="number"
              value={newShiftFloat}
              onChange={(e) => setNewShiftFloat(parseFloat(e.target.value) || 0)}
              placeholder="Opening cash float..."
              className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl w-full sm:w-56 focus:outline-none"
            />
            <button
              onClick={() => startNewShift(newShiftFloat)}
              className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Open New Shift
            </button>
          </div>
        )}
      </div>

      {/* Database Backup, Restore & Reset */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
          <Database className="w-4 h-4 text-indigo-600" />
          <h3 className="font-bold text-sm text-slate-900">Database Backup & Sample Data</h3>
        </div>

        {importStatus && (
          <div className="bg-indigo-50 text-indigo-900 border border-indigo-200 p-3 rounded-xl text-xs">
            {importStatus}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Export Database JSON</span>
          </button>

          <label className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer transition-colors">
            <Upload className="w-4 h-4" />
            <span>Import Database JSON</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={() => {
              if (window.confirm('Reset all supermarket inventory and transactions to standard sample dataset?')) {
                resetToSampleData();
              }
            }}
            className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center space-x-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Sample Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
