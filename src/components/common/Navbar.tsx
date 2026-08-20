import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Package,
  Truck,
  Users,
  FileSpreadsheet,
  TrendingUp,
  Smartphone,
  Settings,
  Bell,
  Store,
  Clock,
  ChevronDown,
  Menu,
  X,
  AlertTriangle,
  Search,
  DollarSign,
  Calendar,
  Sparkles
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency } from '../../utils/helpers';
import { SalesPeriodModal } from './SalesPeriodModal';
import { GlobalSearchModal } from './GlobalSearchModal';

export type ActiveTab = 
  | 'pos'
  | 'inventory'
  | 'purchases'
  | 'suppliers'
  | 'reports'
  | 'analytics'
  | 'floor'
  | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAlerts: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAlerts,
}) => {
  const { settings, alerts, currentShift, cartTotals, salesSummary, stockNotification } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAlertMenu, setShowAlertMenu] = useState(false);
  const [showSalesMenu, setShowSalesMenu] = useState(false);
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [salesModalInitialPeriod, setSalesModalInitialPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Universal hotkey listener (Ctrl+K or Cmd+K or '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { id: 'pos', label: 'POS Billing', icon: ShoppingCart, badge: cartTotals.itemCount > 0 ? cartTotals.itemCount : undefined },
    { id: 'inventory', label: 'Stocks & Inventory', icon: Package, badge: (alerts.lowStockCount + alerts.outOfStockCount) > 0 ? (alerts.lowStockCount + alerts.outOfStockCount) : undefined },
    { id: 'purchases', label: 'Purchases / Inward', icon: Truck },
    { id: 'suppliers', label: 'Suppliers', icon: Users },
    { id: 'reports', label: 'Automated Reports', icon: FileSpreadsheet },
    { id: 'analytics', label: 'Sales Analytics', icon: TrendingUp },
    { id: 'floor', label: 'Floor Staff Mode', icon: Smartphone, highlight: true },
    { id: 'settings', label: 'Store Settings', icon: Settings },
  ];

  return (
    <>
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo & Name */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('pos')}>
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-bold shadow-sm shadow-emerald-500/20">
                <Store className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-base sm:text-lg tracking-tight text-white">{settings.storeName}</span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Supermarket ERP
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block truncate max-w-xs">{settings.tagline}</p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center space-x-1">
              {navItems.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-btn-${item.id}`}
                    onClick={() => setActiveTab(item.id as ActiveTab)}
                    className={`relative flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : item.highlight
                        ? 'bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 border border-indigo-500/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Action Widgets: Search, Sales of Day/Week/Month, Cashier Shift & Alerts */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              
              {/* Universal Search Button */}
              <button
                onClick={() => setIsGlobalSearchOpen(true)}
                className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700/90 text-slate-300 hover:text-white rounded-xl border border-slate-700/70 text-xs transition-colors shadow-2xs"
                title="Search products, check quantity & prices (⌘K)"
              >
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-medium">Search items...</span>
                <kbd className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-900 border border-slate-700 rounded text-slate-400">
                  ⌘K
                </kbd>
              </button>

              {/* Total Sales of Day / Week / Month Interactive Header Pill */}
              <div className="relative">
                <button
                  onClick={() => setShowSalesMenu(!showSalesMenu)}
                  className="flex items-center space-x-2 bg-emerald-950/70 hover:bg-emerald-900/80 px-3 py-1.5 rounded-xl border border-emerald-500/40 text-xs text-emerald-300 transition-colors shadow-2xs"
                  title="Click to check Total Sales of Day, Week & Month"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <div className="text-left leading-tight hidden sm:block">
                    <span className="text-[9px] text-emerald-400/90 font-bold block uppercase tracking-wider">
                      Today's Sales
                    </span>
                    <span className="font-black text-white text-xs">
                      {formatCurrency(salesSummary.today.revenue, settings.currencySymbol)}
                    </span>
                  </div>
                  <span className="sm:hidden font-bold text-white text-xs">
                    {formatCurrency(salesSummary.today.revenue, settings.currencySymbol)}
                  </span>
                  <ChevronDown className="w-3 h-3 text-emerald-400" />
                </button>

                {/* Quick Sales of Day / Week / Month Popover */}
                {showSalesMenu && (
                  <div 
                    className="absolute right-0 mt-2 w-80 bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-700 p-4 z-50 animate-in fade-in slide-in-from-top-2"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-sm text-white">Total Sales Summary</span>
                      </div>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/30">
                        Live ERP
                      </span>
                    </div>

                    <div className="py-3 space-y-2 text-xs">
                      {/* Day Sales */}
                      <div 
                        onClick={() => {
                          setShowSalesMenu(false);
                          setSalesModalInitialPeriod('today');
                          setIsSalesModalOpen(true);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 cursor-pointer transition-colors"
                      >
                        <div>
                          <span className="font-bold text-slate-200 block">Today's Sales (Day)</span>
                          <span className="text-[10px] text-slate-400">{salesSummary.today.ordersCount} orders • {salesSummary.today.itemsSoldCount} units</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-emerald-400 text-sm block">
                            {formatCurrency(salesSummary.today.revenue, settings.currencySymbol)}
                          </span>
                          <span className="text-[10px] text-emerald-500/80">+{formatCurrency(salesSummary.today.grossProfit, settings.currencySymbol)} profit</span>
                        </div>
                      </div>

                      {/* Week Sales */}
                      <div 
                        onClick={() => {
                          setShowSalesMenu(false);
                          setSalesModalInitialPeriod('week');
                          setIsSalesModalOpen(true);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 cursor-pointer transition-colors"
                      >
                        <div>
                          <span className="font-bold text-slate-200 block">This Week's Sales (7 Days)</span>
                          <span className="text-[10px] text-slate-400">{salesSummary.week.ordersCount} orders • {salesSummary.week.itemsSoldCount} units</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-emerald-400 text-sm block">
                            {formatCurrency(salesSummary.week.revenue, settings.currencySymbol)}
                          </span>
                          <span className="text-[10px] text-emerald-500/80">+{formatCurrency(salesSummary.week.grossProfit, settings.currencySymbol)} profit</span>
                        </div>
                      </div>

                      {/* Month Sales */}
                      <div 
                        onClick={() => {
                          setShowSalesMenu(false);
                          setSalesModalInitialPeriod('month');
                          setIsSalesModalOpen(true);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 cursor-pointer transition-colors"
                      >
                        <div>
                          <span className="font-bold text-slate-200 block">This Month's Sales (Month)</span>
                          <span className="text-[10px] text-slate-400">{salesSummary.month.ordersCount} orders • {salesSummary.month.itemsSoldCount} units</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-emerald-400 text-sm block">
                            {formatCurrency(salesSummary.month.revenue, settings.currencySymbol)}
                          </span>
                          <span className="text-[10px] text-emerald-500/80">+{formatCurrency(salesSummary.month.grossProfit, settings.currencySymbol)} profit</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowSalesMenu(false);
                        setIsSalesModalOpen(true);
                      }}
                      className="w-full py-2 text-center text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-xs"
                    >
                      Open Full Day, Week & Month Explorer
                    </button>
                  </div>
                )}
              </div>

              {/* Shift / Drawer Info Pill (Cashier) */}
              <div className="hidden lg:flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 text-xs">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 block leading-tight">Lane Active</span>
                  <span className="font-semibold text-white truncate max-w-[100px] block">{settings.cashierName}</span>
                </div>
              </div>

              {/* Inventory Alerts Bell */}
              <div className="relative">
                <button
                  id="alerts-bell-btn"
                  onClick={() => {
                    setShowAlertMenu(!showAlertMenu);
                    onOpenAlerts();
                  }}
                  className={`relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors ${
                    alerts.totalAlertsCount > 0 ? 'text-amber-400' : ''
                  }`}
                  title="Inventory & Stock Alerts"
                >
                  <Bell className="w-5 h-5" />
                  {alerts.totalAlertsCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse shadow-sm">
                      {alerts.totalAlertsCount}
                    </span>
                  )}
                </button>

                {/* Alert Quick Summary Popover */}
                {showAlertMenu && (
                  <div 
                    className="absolute right-0 mt-2 w-80 bg-slate-800 text-slate-100 rounded-2xl shadow-xl border border-slate-700 p-4 z-50 animate-in fade-in slide-in-from-top-2"
                    onClick={() => setShowAlertMenu(false)}
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-sm">Real-time Stock Alerts</span>
                      </div>
                      <span className="text-xs bg-slate-700 px-2 py-0.5 rounded-full font-mono">
                        {alerts.totalAlertsCount} issues
                      </span>
                    </div>

                    <div className="py-2 space-y-2 text-xs">
                      <div 
                        className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                        onClick={() => setActiveTab('inventory')}
                      >
                        <span>Out of Stock (Zero Units)</span>
                        <span className="font-bold bg-rose-500/30 px-2 py-0.5 rounded">{alerts.outOfStockCount} items</span>
                      </div>

                      <div 
                        className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 cursor-pointer"
                        onClick={() => setActiveTab('inventory')}
                      >
                        <span>Low Stock (Below Threshold)</span>
                        <span className="font-bold bg-amber-500/30 px-2 py-0.5 rounded">{alerts.lowStockCount} items</span>
                      </div>

                      <div 
                        className="flex items-center justify-between p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 cursor-pointer"
                        onClick={() => setActiveTab('inventory')}
                      >
                        <span>Expiring within {settings.expiryWarningDays} Days</span>
                        <span className="font-bold bg-purple-500/30 px-2 py-0.5 rounded">{alerts.nearExpiryCount} items</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowAlertMenu(false);
                        setActiveTab('inventory');
                      }}
                      className="w-full mt-2 py-1.5 text-center text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors"
                    >
                      View All in Inventory
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Menu Toggle Button */}
              <button
                id="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>

        {/* Global Live Stock Notification Banner */}
        {stockNotification && (
          <div className="bg-amber-500 text-slate-950 font-bold px-4 py-2 text-xs flex items-center justify-between border-t border-amber-600 animate-in slide-in-from-top-1">
            <div className="flex items-center space-x-2 max-w-4xl mx-auto w-full">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span className="truncate">{stockNotification}</span>
            </div>
          </div>
        )}

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-6 space-y-2">
            <button
              onClick={() => {
                setIsGlobalSearchOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-sm font-semibold mb-2"
            >
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-emerald-400" />
                <span>Search Products & Stock</span>
              </div>
              <kbd className="text-xs bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">⌘K</kbd>
            </button>

            <button
              onClick={() => {
                setIsSalesModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-emerald-950 text-emerald-300 text-sm font-semibold border border-emerald-500/30 mb-2"
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Check Total Sales (Day/Week/Month)</span>
              </div>
              <span className="font-black text-white">{formatCurrency(salesSummary.today.revenue, settings.currencySymbol)}</span>
            </button>

            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as ActiveTab);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-xs rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
            
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 px-2">
              <span>Cashier: {settings.cashierName}</span>
              <span>Shift Sales: {formatCurrency(currentShift.totalSales, settings.currencySymbol)}</span>
            </div>
          </div>
        )}
      </header>

      {/* Sales Period Modal (Day, Week, Month) */}
      <SalesPeriodModal
        isOpen={isSalesModalOpen}
        onClose={() => setIsSalesModalOpen(false)}
        initialPeriod={salesModalInitialPeriod}
      />

      {/* Global Instant Search Modal */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
      />
    </>
  );
};

