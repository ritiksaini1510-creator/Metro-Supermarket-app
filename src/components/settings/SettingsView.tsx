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
  Printer,
  UserCheck,
  Phone,
  MapPin,
  LogIn,
  LogOut,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet,
  Truck,
  Users,
  Smartphone,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { StoreSettings } from '../../types';
import { ReportsView } from '../reports/ReportsView';
import { AnalyticsDashboard } from '../analytics/AnalyticsDashboard';
import { PurchasesView } from '../purchases/PurchasesView';
import { SuppliersView } from '../suppliers/SuppliersView';
import { FloorStaffView } from '../floor/FloorStaffView';

type SettingsSection = 
  | 'profile'
  | 'reports'
  | 'analytics'
  | 'purchases'
  | 'suppliers'
  | 'floor'
  | 'shift'
  | 'config'
  | 'backup';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetToSampleData,
    exportBackupJSON,
    importBackupJSON,
    currentShift,
    startNewShift,
    closeCurrentShift,
    authSession,
    setIsLoginModalOpen,
    logoutStore
  } = useStore();

  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [formData, setFormData] = useState<StoreSettings>({ ...settings });
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [newShiftFloat, setNewShiftFloat] = useState<number>(100);
  const [actualDrawerCount, setActualDrawerCount] = useState<number>(currentShift.expectedCash);

  const handleSaveConfig = (e: React.FormEvent) => {
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

  const navSections = [
    { id: 'profile' as SettingsSection, label: 'Store Login & Profile', icon: Store },
    { id: 'reports' as SettingsSection, label: 'Sales Reports & Invoices', icon: FileSpreadsheet },
    { id: 'analytics' as SettingsSection, label: 'Business Analytics', icon: TrendingUp },
    { id: 'purchases' as SettingsSection, label: 'Purchases & Inward', icon: Truck },
    { id: 'suppliers' as SettingsSection, label: 'Suppliers Directory', icon: Users },
    { id: 'floor' as SettingsSection, label: 'Floor Staff Mode', icon: Smartphone },
    { id: 'shift' as SettingsSection, label: 'Cash Drawer & Shifts', icon: DollarSign },
    { id: 'config' as SettingsSection, label: 'Tax & Parameters', icon: SlidersHorizontal },
    { id: 'backup' as SettingsSection, label: 'Backup & Database', icon: Database },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Top Banner Header */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20 shrink-0">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Store Settings & Operations</h1>
              <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Hub
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage store profile, reports, analytics, vendor purchases, suppliers, shifts, and system config
            </p>
          </div>
        </div>

        {/* Quick Account Pill */}
        <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700 px-3.5 py-2 rounded-2xl text-xs self-start sm:self-auto">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
            ₹
          </div>
          <div className="text-left">
            <span className="text-[10px] text-slate-400 block">{authSession.storeName}</span>
            <span className="font-bold text-white block">{authSession.ownerName || 'Terminal Active'}</span>
          </div>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="ml-2 p-1.5 hover:bg-slate-700 rounded-lg text-emerald-400 transition-colors"
            title="Edit Store Profile / Switch Login"
          >
            <LogIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Navigation Tabs Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <div className="flex items-center space-x-1 min-w-max">
          {navSections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                id={`settings-sec-${sec.id}`}
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 1: Store Login & Profile */}
      {activeSection === 'profile' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Current Store Identity & Login Session</h3>
                  <p className="text-xs text-slate-500">Details printed on invoices, receipts, and reports</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Edit / Switch Store Profile</span>
                </button>
                <button
                  onClick={logoutStore}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors flex items-center space-x-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Store / Business Name</span>
                <span className="font-black text-sm text-slate-900">{authSession.storeName}</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Owner / Cashier Name</span>
                <span className="font-black text-sm text-slate-900">{authSession.ownerName}</span>
                <span className="text-[10px] font-bold text-emerald-600 block mt-0.5 uppercase tracking-wider">
                  Role: {authSession.role}
                </span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Contact Mobile</span>
                <span className="font-bold text-sm text-slate-900">{authSession.phone}</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 md:col-span-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Store Street Address</span>
                <span className="font-medium text-slate-800">{authSession.address}</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">GSTIN / Tax ID</span>
                <span className="font-mono font-bold text-slate-900">{authSession.gstin || 'Not configured'}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Currency: INR (₹)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Sales Reports & Invoices */}
      {activeSection === 'reports' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <ReportsView />
        </div>
      )}

      {/* Section 3: Analytics */}
      {activeSection === 'analytics' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <AnalyticsDashboard />
        </div>
      )}

      {/* Section 4: Purchases */}
      {activeSection === 'purchases' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <PurchasesView />
        </div>
      )}

      {/* Section 5: Suppliers */}
      {activeSection === 'suppliers' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <SuppliersView />
        </div>
      )}

      {/* Section 6: Floor Staff */}
      {activeSection === 'floor' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <FloorStaffView />
        </div>
      )}

      {/* Section 7: Cash Drawer & Shifts */}
      {activeSection === 'shift' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">Active Shift & Cash Drawer Control</h3>
                <p className="text-xs text-slate-500">Track drawer balance, cash inflows, and shift settlements</p>
              </div>
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
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Opening Float</span>
              <span className="font-black text-slate-900 text-base">{settings.currencySymbol}{currentShift.openingFloat.toFixed(2)}</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Cash Sales</span>
              <span className="font-black text-emerald-600 text-base">{settings.currencySymbol}{currentShift.cashSales.toFixed(2)}</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Digital / UPI Sales</span>
              <span className="font-black text-blue-600 text-base">{settings.currencySymbol}{currentShift.onlineSales.toFixed(2)}</span>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Expected in Drawer</span>
              <span className="font-black text-slate-900 text-base">{settings.currencySymbol}{currentShift.expectedCash.toFixed(2)}</span>
            </div>
          </div>

          {currentShift.status === 'open' ? (
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <input
                type="number"
                value={actualDrawerCount}
                onChange={(e) => setActualDrawerCount(parseFloat(e.target.value) || 0)}
                placeholder="Counted cash at close..."
                className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl w-full sm:w-56 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={() => closeCurrentShift(actualDrawerCount)}
                className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
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
                className="text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl w-full sm:w-56 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={() => startNewShift(newShiftFloat)}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                Open New Shift
              </button>
            </div>
          )}
        </div>
      )}

      {/* Section 8: Tax & Config Parameters */}
      {activeSection === 'config' && (
        <form onSubmit={handleSaveConfig} className="space-y-6 animate-in fade-in duration-200">
          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

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
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono font-bold"
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
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
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
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Thermal Receipt Notes */}
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
                  value={formData.receiptHeader || ''}
                  onChange={(e) => setFormData({ ...formData, receiptHeader: e.target.value })}
                  placeholder="Welcome to our supermarket!"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Footer Note</label>
                <textarea
                  rows={2}
                  value={formData.receiptFooter || ''}
                  onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
                  placeholder="Thank you for shopping with us! Please retain bill for returns."
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden resize-none"
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
      )}

      {/* Section 9: Backup & Database */}
      {activeSection === 'backup' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Database className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Database Backup & Sample Data</h3>
              <p className="text-xs text-slate-500">Export offline JSON snapshots, restore files, or reset data</p>
            </div>
          </div>

          {importStatus && (
            <div className="bg-indigo-50 text-indigo-900 border border-indigo-200 p-3 rounded-xl text-xs font-medium">
              {importStatus}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
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
                if (window.confirm('Reset all supermarket inventory, suppliers, and billing transactions to standard sample dataset?')) {
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
      )}

    </div>
  );
};
