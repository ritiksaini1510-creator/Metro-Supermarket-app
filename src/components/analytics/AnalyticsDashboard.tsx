import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  BarChart3,
  Sparkles,
  Layers,
  Percent,
  Award
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency } from '../../utils/helpers';

export const AnalyticsDashboard: React.FC = () => {
  const { sales, products, purchases, settings, alerts } = useStore();
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days' | 'all'>('7days');

  // Filter sales based on time range
  const now = new Date();
  const filteredSales = sales.filter((sale) => {
    if (timeRange === 'all') return true;
    const saleDate = new Date(sale.createdAt);
    const diffMs = now.getTime() - saleDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (timeRange === 'today') {
      return saleDate.toDateString() === now.toDateString();
    }
    if (timeRange === '7days') return diffDays <= 7;
    if (timeRange === '30days') return diffDays <= 30;
    return true;
  });

  // Key KPI calculations
  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.grandTotal, 0);
  const totalTax = filteredSales.reduce((acc, s) => acc + s.taxTotal, 0);
  const totalDiscounts = filteredSales.reduce((acc, s) => acc + s.discountTotal, 0);
  const totalBills = filteredSales.length;
  const avgBasketValue = totalBills > 0 ? totalRevenue / totalBills : 0;

  // Calculate estimated Cost of Goods Sold (COGS) & Gross Profit
  let totalCOGS = 0;
  filteredSales.forEach((sale) => {
    sale.items.forEach((item) => {
      totalCOGS += (item.product.costPrice || 0) * item.quantity;
    });
  });
  const grossProfit = totalRevenue - totalCOGS;
  const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Inventory value
  const totalInventoryCost = products.reduce((acc, p) => acc + p.costPrice * p.stock, 0);
  const totalInventoryRetail = products.reduce((acc, p) => acc + p.sellingPrice * p.stock, 0);

  // Category sales breakdown
  const categorySalesMap: Record<string, { revenue: number; quantity: number }> = {};
  filteredSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const cat = item.product.category;
      if (!categorySalesMap[cat]) {
        categorySalesMap[cat] = { revenue: 0, quantity: 0 };
      }
      categorySalesMap[cat].revenue += item.total;
      categorySalesMap[cat].quantity += item.quantity;
    });
  });

  const categoryBreakdown = Object.entries(categorySalesMap)
    .map(([category, data]) => ({
      category,
      revenue: data.revenue,
      quantity: data.quantity,
      percent: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Top Selling Products
  const productSalesMap: Record<string, { product: any; revenue: number; quantity: number }> = {};
  filteredSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const pId = item.product.id;
      if (!productSalesMap[pId]) {
        productSalesMap[pId] = { product: item.product, revenue: 0, quantity: 0 };
      }
      productSalesMap[pId].revenue += item.total;
      productSalesMap[pId].quantity += item.quantity;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 6);

  // Hourly sales distribution (0-23)
  const hourlyData = Array.from({ length: 12 }, (_, i) => {
    const hour = i + 8; // 8 AM to 7 PM
    const hourSales = filteredSales.filter((s) => {
      const h = new Date(s.createdAt).getHours();
      return h === hour;
    });
    const rev = hourSales.reduce((acc, s) => acc + s.grandTotal, 0);
    return {
      hourLabel: `${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`,
      revenue: rev,
      orders: hourSales.length,
    };
  });

  const maxHourlyRev = Math.max(...hourlyData.map((d) => d.revenue), 100);

  // Payment methods breakdown
  const paymentBreakdown: Record<string, number> = {
    cash: 0,
    card: 0,
    upi: 0,
    split: 0,
  };
  filteredSales.forEach((s) => {
    const m = s.payment.method;
    paymentBreakdown[m] = (paymentBreakdown[m] || 0) + s.grandTotal;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Supermarket Analytics & BI</h1>
              <p className="text-xs text-slate-500">Live profit margin tracking, item turnover, & financial KPIs</p>
            </div>
          </div>
        </div>

        {/* Time Filter Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
              { id: 'all', label: 'All Time' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeRange(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeRange === tab.id
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {formatCurrency(totalRevenue, settings.currencySymbol)}
            </div>
            <div className="flex items-center text-xs text-emerald-600 font-semibold mt-1 space-x-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{totalBills} total checkout transactions</span>
            </div>
          </div>
        </div>

        {/* Estimated Gross Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Estimated Profit</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-indigo-900">
              {formatCurrency(grossProfit, settings.currencySymbol)}
            </div>
            <div className="flex items-center text-xs text-indigo-600 font-semibold mt-1 space-x-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{grossMarginPercent.toFixed(1)}% Gross Margin</span>
            </div>
          </div>
        </div>

        {/* Average Basket Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Avg Basket Size</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {formatCurrency(avgBasketValue, settings.currencySymbol)}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              Discounts granted: {formatCurrency(totalDiscounts, settings.currencySymbol)}
            </div>
          </div>
        </div>

        {/* Inventory Total Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs hover:border-amber-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Inventory Assets</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {formatCurrency(totalInventoryRetail, settings.currencySymbol)}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              Cost: {formatCurrency(totalInventoryCost, settings.currencySymbol)} ({products.length} SKUs)
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Visual Balance Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Hourly Sales Bar Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">Peak Store Hours & Sales Volume</h3>
            </div>
            <span className="text-xs text-slate-400 font-medium">Customer rush distribution</span>
          </div>

          <div className="pt-6 flex-1 flex flex-col justify-end">
            <div className="grid grid-cols-12 gap-2 h-48 items-end">
              {hourlyData.map((slot, idx) => {
                const heightPercent = Math.max(8, (slot.revenue / maxHourlyRev) * 100);
                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 bg-slate-900 text-white text-[10px] rounded-lg py-1 px-2 pointer-events-none whitespace-nowrap z-20 shadow-md">
                      <div className="font-bold">{formatCurrency(slot.revenue, settings.currencySymbol)}</div>
                      <div className="text-slate-400">{slot.orders} transactions</div>
                    </div>

                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        slot.revenue > 0
                          ? 'bg-emerald-500 group-hover:bg-emerald-600 shadow-xs'
                          : 'bg-slate-100'
                      }`}
                    />
                    <span className="text-[9px] font-semibold text-slate-500 mt-2 truncate w-full text-center">
                      {slot.hourLabel.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Payment Modes Split (4 cols) */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <PieIcon className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">Tender Methods</h3>
            </div>
          </div>

          <div className="py-4 space-y-3">
            {[
              { id: 'cash', label: 'Cash Tendered', amount: paymentBreakdown.cash, color: 'bg-emerald-500' },
              { id: 'card', label: 'Debit / Credit Card', amount: paymentBreakdown.card, color: 'bg-blue-500' },
              { id: 'upi', label: 'UPI / Digital QR', amount: paymentBreakdown.upi, color: 'bg-purple-500' },
              { id: 'split', label: 'Split Payments', amount: paymentBreakdown.split, color: 'bg-amber-500' },
            ].map((method) => {
              const share = totalRevenue > 0 ? (method.amount / totalRevenue) * 100 : 0;
              return (
                <div key={method.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{method.label}</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {formatCurrency(method.amount, settings.currencySymbol)} ({share.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${method.color} rounded-full`}
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Collected Taxes (GST/VAT):</span>
            <span className="font-bold text-slate-800">{formatCurrency(totalTax, settings.currencySymbol)}</span>
          </div>
        </div>
      </div>

      {/* Category Performance & Top Selling SKUs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Product Movers */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900">Fastest Selling Products</h3>
            </div>
            <span className="text-xs text-slate-400">By quantity sold</span>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No sales recorded yet</div>
            ) : (
              topProducts.map(({ product, revenue, quantity }, idx) => (
                <div key={product.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-slate-100 font-black text-xs text-slate-600 flex items-center justify-center">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{product.name}</h4>
                      <p className="text-[10px] text-slate-400">{product.category} • SKU: {product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block">
                      {quantity} {product.unit} sold
                    </span>
                    <span className="text-[11px] text-emerald-600 font-semibold font-mono">
                      {formatCurrency(revenue, settings.currencySymbol)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Category Contribution Share */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-sm text-slate-900">Sales Contribution by Category</h3>
            </div>
            <span className="text-xs text-slate-400">Share of revenue</span>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {categoryBreakdown.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">No category data available</div>
            ) : (
              categoryBreakdown.slice(0, 6).map((item) => (
                <div key={item.category} className="py-2.5">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-800">{item.category}</span>
                    <span className="font-mono text-slate-900 font-semibold">
                      {formatCurrency(item.revenue, settings.currencySymbol)} ({item.percent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
