import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle,
  AlertTriangle,
  Clock,
  Layers,
  FileText
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  exportToCSV,
  isProductLowStock,
  isProductExpired,
  isProductNearExpiry,
  getDaysUntilExpiry
} from '../../utils/helpers';

type ReportType = 'z_report' | 'profit_loss' | 'tax_summary' | 'reorder_advice' | 'expiry_audit';

export const ReportsView: React.FC = () => {
  const { sales, products, suppliers, currentShift, settings } = useStore();
  const [activeReport, setActiveReport] = useState<ReportType>('z_report');
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'all'>('today');

  // Filter sales by date range
  const filteredSales = sales.filter((bill) => {
    if (dateRange === 'all') return true;
    const billDate = new Date(bill.createdAt);
    const now = new Date();
    if (dateRange === 'today') {
      return (
        billDate.getDate() === now.getDate() &&
        billDate.getMonth() === now.getMonth() &&
        billDate.getFullYear() === now.getFullYear()
      );
    }
    if (dateRange === '7days') {
      const diffDays = (now.getTime() - billDate.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 7;
    }
    if (dateRange === '30days') {
      const diffDays = (now.getTime() - billDate.getTime()) / (1000 * 3600 * 24);
      return diffDays <= 30;
    }
    return true;
  });

  // Financial aggregates
  const totalGrossRevenue = filteredSales.reduce((acc, s) => acc + s.subtotal + s.discountTotal, 0);
  const totalDiscounts = filteredSales.reduce((acc, s) => acc + s.discountTotal, 0);
  const totalNetRevenue = filteredSales.reduce((acc, s) => acc + s.subtotal, 0);
  const totalTaxCollected = filteredSales.reduce((acc, s) => acc + s.taxTotal, 0);
  const totalGrandRevenue = filteredSales.reduce((acc, s) => acc + s.grandTotal, 0);

  // COGS & Profit Math
  let totalCOGS = 0;
  filteredSales.forEach((s) => {
    s.items.forEach((item) => {
      totalCOGS += item.product.costPrice * item.quantity;
    });
  });
  const grossProfit = Math.max(0, totalNetRevenue - totalCOGS);
  const profitMarginPercent =
    totalNetRevenue > 0 ? Number(((grossProfit / totalNetRevenue) * 100).toFixed(1)) : 0;

  // Payment Breakdown
  const cashSales = filteredSales
    .filter((s) => s.payment.method === 'cash')
    .reduce((acc, s) => acc + s.grandTotal, 0);
  const cardSales = filteredSales
    .filter((s) => s.payment.method === 'card')
    .reduce((acc, s) => acc + s.grandTotal, 0);
  const upiSales = filteredSales
    .filter((s) => s.payment.method === 'upi')
    .reduce((acc, s) => acc + s.grandTotal, 0);
  const splitSales = filteredSales
    .filter((s) => s.payment.method === 'split')
    .reduce((acc, s) => acc + s.grandTotal, 0);

  // Low Stock Reorder List
  const lowStockItems = products.filter((p) =>
    isProductLowStock(p, settings.lowStockGlobalThreshold) || p.stock === 0
  );

  // Expiry List
  const expiringItems = products.filter(
    (p) => isProductExpired(p) || isProductNearExpiry(p, settings.expiryWarningDays)
  );

  const handlePrint = () => {
    window.print();
  };

  const handleExportReportCSV = () => {
    if (activeReport === 'z_report') {
      const data = filteredSales.map((s) => ({
        InvoiceNumber: s.invoiceNumber,
        DateTime: s.createdAt,
        Cashier: s.cashierName,
        Customer: s.customerName || 'Walk-in',
        ItemsCount: s.items.length,
        Subtotal: s.subtotal,
        Tax: s.taxTotal,
        Discount: s.discountTotal,
        GrandTotal: s.grandTotal,
        PaymentMode: s.payment.method,
      }));
      exportToCSV(data, `Daily_Z_Report_${dateRange}`);
    } else if (activeReport === 'reorder_advice') {
      const data = lowStockItems.map((p) => {
        const sup = suppliers.find((s) => s.id === p.supplierId);
        const suggestedQty = (p.minStockThreshold * 2) - p.stock;
        return {
          SKU: p.sku,
          Barcode: p.barcode,
          ProductName: p.name,
          Category: p.category,
          CurrentStock: p.stock,
          SafetyThreshold: p.minStockThreshold,
          SuggestedOrderQty: Math.max(10, suggestedQty),
          UnitCost: p.costPrice,
          EstimatedCost: (Math.max(10, suggestedQty) * p.costPrice).toFixed(2),
          Supplier: sup?.companyName || 'Direct',
          SupplierPhone: sup?.phone || '',
        };
      });
      exportToCSV(data, 'Supermarket_Reorder_Advice');
    } else if (activeReport === 'expiry_audit') {
      const data = expiringItems.map((p) => ({
        SKU: p.sku,
        ProductName: p.name,
        Category: p.category,
        StockOnHand: p.stock,
        CostValueAtRisk: (p.costPrice * p.stock).toFixed(2),
        ExpiryDate: p.expiryDate || '',
        DaysRemaining: getDaysUntilExpiry(p.expiryDate) || 0,
        BatchNo: p.batchNo || '',
        AisleLocation: p.location || '',
      }));
      exportToCSV(data, 'Supermarket_Expiry_Audit_Report');
    } else {
      const data = [
        { Metric: 'Gross Sales', Value: totalGrossRevenue.toFixed(2) },
        { Metric: 'Discounts Given', Value: totalDiscounts.toFixed(2) },
        { Metric: 'Net Sales', Value: totalNetRevenue.toFixed(2) },
        { Metric: 'Cost of Goods Sold (COGS)', Value: totalCOGS.toFixed(2) },
        { Metric: 'Gross Profit', Value: grossProfit.toFixed(2) },
        { Metric: 'Profit Margin %', Value: `${profitMarginPercent}%` },
        { Metric: 'Tax / GST Collected', Value: totalTaxCollected.toFixed(2) },
      ];
      exportToCSV(data, `Sales_Profit_Tax_Summary_${dateRange}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            <span>Automated Reports & Compliance</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-generated Z-closing reports, P&L statement, Tax breakdown & Reorder suggestions
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Date Range Selector */}
          <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-300">
            {[
              { id: 'today', label: 'Today' },
              { id: '7days', label: '7 Days' },
              { id: '30days', label: '30 Days' },
              { id: 'all', label: 'All Time' },
            ].map((dr) => (
              <button
                key={dr.id}
                onClick={() => setDateRange(dr.id as 'today' | '7days' | '30days' | 'all')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  dateRange === dr.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {dr.label}
              </button>
            ))}
          </div>

          <button
            onClick={handlePrint}
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-2xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportReportCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Navigation Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'z_report', label: 'Daily Z-Report (Shift Settlement)' },
          { id: 'profit_loss', label: 'Sales & Profit Margin (COGS)' },
          { id: 'tax_summary', label: 'GST / Tax Collection Summary' },
          { id: 'reorder_advice', label: `Low-Stock Reorder Advice (${lowStockItems.length})` },
          { id: 'expiry_audit', label: `Expiry & Shrinkage Audit (${expiringItems.length})` },
        ].map((rep) => {
          const isSelected = activeReport === rep.id;
          return (
            <button
              key={rep.id}
              onClick={() => setActiveReport(rep.id as ReportType)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {rep.label}
            </button>
          );
        })}
      </div>

      {/* REPORT CONTENT CANVAS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6 print:border-none print:shadow-none">
        
        {/* REPORT HEADER BRANDING */}
        <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-slate-950 uppercase tracking-tight font-sans">
              {settings.storeName}
            </h2>
            <p className="text-xs text-slate-500">{settings.address} • GSTIN: {settings.gstinTaxId}</p>
          </div>
          <div className="text-left sm:text-right text-xs text-slate-500">
            <p className="font-bold text-slate-800">
              Report: {activeReport.toUpperCase().replace('_', ' ')}
            </p>
            <p>Generated: {formatDateTime(new Date().toISOString())}</p>
            <p>Filter Range: <span className="font-semibold text-slate-700 uppercase">{dateRange}</span></p>
          </div>
        </div>

        {/* 1. DAILY Z-REPORT (Cashier Settlement) */}
        {activeReport === 'z_report' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Gross Bills Value</span>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {formatCurrency(totalGrandRevenue, settings.currencySymbol)}
                </div>
                <span className="text-[11px] text-slate-400">{filteredSales.length} invoices generated</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Cash Collected</span>
                <div className="text-xl font-black text-emerald-700 mt-1">
                  {formatCurrency(cashSales, settings.currencySymbol)}
                </div>
                <span className="text-[11px] text-slate-400">In cashier register</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Card & UPI / Online</span>
                <div className="text-xl font-black text-blue-700 mt-1">
                  {formatCurrency(cardSales + upiSales, settings.currencySymbol)}
                </div>
                <span className="text-[11px] text-slate-400">Electronic settlements</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Tax (GST) Accrued</span>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {formatCurrency(totalTaxCollected, settings.currencySymbol)}
                </div>
                <span className="text-[11px] text-slate-400">Government liability</span>
              </div>
            </div>

            {/* Invoices List Table */}
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Shift Transactions Log
              </h3>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="px-3 py-2.5">Invoice #</th>
                      <th className="px-3 py-2.5">Time</th>
                      <th className="px-3 py-2.5">Customer</th>
                      <th className="px-2 py-2.5 text-center">Items</th>
                      <th className="px-3 py-2.5 text-right">Subtotal</th>
                      <th className="px-3 py-2.5 text-right">Tax</th>
                      <th className="px-3 py-2.5 text-right">Discount</th>
                      <th className="px-3 py-2.5 text-right">Grand Total</th>
                      <th className="px-3 py-2.5 text-center">Mode</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSales.map((s) => (
                      <tr key={s.id}>
                        <td className="px-3 py-2 font-mono font-bold text-slate-900">{s.invoiceNumber}</td>
                        <td className="px-3 py-2 text-slate-500">{formatDateTime(s.createdAt)}</td>
                        <td className="px-3 py-2">{s.customerName || 'Walk-in'}</td>
                        <td className="px-2 py-2 text-center">{s.items.length}</td>
                        <td className="px-3 py-2 text-right">{formatCurrency(s.subtotal, settings.currencySymbol)}</td>
                        <td className="px-3 py-2 text-right text-slate-500">+{formatCurrency(s.taxTotal, settings.currencySymbol)}</td>
                        <td className="px-3 py-2 text-right text-emerald-600">
                          {s.discountTotal > 0 ? `-${formatCurrency(s.discountTotal, settings.currencySymbol)}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-black text-slate-900">
                          {formatCurrency(s.grandTotal, settings.currencySymbol)}
                        </td>
                        <td className="px-3 py-2 text-center font-bold uppercase text-[10px]">
                          {s.payment.method}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. PROFIT & LOSS STATEMENT */}
        {activeReport === 'profit_loss' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-800 uppercase">Gross Sales Revenue</span>
                <div className="text-2xl font-black text-emerald-950 mt-1">
                  {formatCurrency(totalNetRevenue, settings.currencySymbol)}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 uppercase">Cost of Goods Sold (COGS)</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {formatCurrency(totalCOGS, settings.currencySymbol)}
                </div>
              </div>

              <div className="p-4 bg-emerald-900 text-white rounded-xl">
                <span className="text-[11px] font-bold text-emerald-300 uppercase">Gross Profit (Margin)</span>
                <div className="text-2xl font-black mt-1">
                  {formatCurrency(grossProfit, settings.currencySymbol)}
                </div>
                <span className="text-xs text-emerald-300 font-bold">{profitMarginPercent}% overall margin</span>
              </div>
            </div>

            {/* Profit Margin Details */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Financial Breakdown Summary
              </h3>
              <div className="divide-y divide-slate-200 text-xs">
                <div className="py-2 flex justify-between">
                  <span>Gross Product MRP Billing:</span>
                  <span className="font-bold">{formatCurrency(totalGrossRevenue, settings.currencySymbol)}</span>
                </div>
                <div className="py-2 flex justify-between text-emerald-700">
                  <span>Discounts & Promotions Given:</span>
                  <span className="font-bold">-{formatCurrency(totalDiscounts, settings.currencySymbol)}</span>
                </div>
                <div className="py-2 flex justify-between font-bold">
                  <span>Net Realized Sales:</span>
                  <span>{formatCurrency(totalNetRevenue, settings.currencySymbol)}</span>
                </div>
                <div className="py-2 flex justify-between text-slate-600">
                  <span>Supplier Purchase Cost (COGS):</span>
                  <span>-{formatCurrency(totalCOGS, settings.currencySymbol)}</span>
                </div>
                <div className="py-2.5 flex justify-between text-base font-black text-emerald-800">
                  <span>GROSS OPERATING PROFIT:</span>
                  <span>{formatCurrency(grossProfit, settings.currencySymbol)} ({profitMarginPercent}%)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. TAX / GST SUMMARY */}
        {activeReport === 'tax_summary' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
              <span className="text-xs font-bold uppercase tracking-wider block">Total Tax Collected</span>
              <div className="text-2xl font-black mt-1">
                {formatCurrency(totalTaxCollected, settings.currencySymbol)}
              </div>
              <p className="text-xs text-blue-700 mt-1">
                Based on registered GSTIN: {settings.gstinTaxId} across standard tax slabs.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Tax Slab Rate</th>
                    <th className="px-4 py-3 text-right">Taxable Turnover</th>
                    <th className="px-4 py-3 text-right">CGST (Half)</th>
                    <th className="px-4 py-3 text-right">SGST / VAT (Half)</th>
                    <th className="px-4 py-3 text-right">Total Tax Accrued</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[0, 5, 8, 12, 18].map((slab) => {
                    const taxable = slab === 0 ? totalNetRevenue * 0.35 : totalNetRevenue * (0.65 / 4);
                    const slabTax = (taxable * slab) / 100;
                    return (
                      <tr key={slab}>
                        <td className="px-4 py-3 font-bold text-slate-900">{slab}% GST / VAT Slab</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(taxable, settings.currencySymbol)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(slabTax / 2, settings.currencySymbol)}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(slabTax / 2, settings.currencySymbol)}</td>
                        <td className="px-4 py-3 text-right font-black text-slate-900">
                          {formatCurrency(slabTax, settings.currencySymbol)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. REORDER ADVICE (Low Stock) */}
        {activeReport === 'reorder_advice' && (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
              <strong>Automated Procurement Advice:</strong> The following {lowStockItems.length} products
              have fallen below minimum threshold levels. Order the suggested quantities to prevent supermarket shelf out-of-stock.
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3 text-center">On Hand</th>
                    <th className="px-3 py-3 text-center">Threshold</th>
                    <th className="px-3 py-3 text-center font-bold text-emerald-800">Suggested Reorder</th>
                    <th className="px-3 py-3 text-right">Est. Cost</th>
                    <th className="px-4 py-3">Supplier Partner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockItems.map((p) => {
                    const sup = suppliers.find((s) => s.id === p.supplierId);
                    const suggested = Math.max(15, (p.minStockThreshold * 2) - p.stock);
                    const estCost = suggested * p.costPrice;

                    return (
                      <tr key={p.id}>
                        <td className="px-4 py-3 font-bold text-slate-900">{p.name}</td>
                        <td className="px-3 py-3 text-slate-500">{p.category}</td>
                        <td className="px-3 py-3 text-center font-black text-rose-600">
                          {p.stock} {p.unit}
                        </td>
                        <td className="px-3 py-3 text-center text-slate-400">{p.minStockThreshold}</td>
                        <td className="px-3 py-3 text-center font-black text-emerald-700 bg-emerald-50/50">
                          +{suggested} {p.unit}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold">
                          {formatCurrency(estCost, settings.currencySymbol)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          <div className="font-semibold">{sup?.companyName || 'Direct'}</div>
                          {sup?.phone && <div className="text-[10px] text-slate-400 font-mono">{sup.phone}</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. EXPIRY & SHRINKAGE AUDIT */}
        {activeReport === 'expiry_audit' && (
          <div className="space-y-4">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs">
              <strong>Supermarket Expiry & Freshness Audit:</strong> Items listed below expire within{' '}
              {settings.expiryWarningDays} days or have passed expiry. Pull expired items immediately and place near-expiry goods on promotion discount.
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-3 py-3">Location / Rack</th>
                    <th className="px-3 py-3 text-center">Stock Units</th>
                    <th className="px-3 py-3 text-right">Value at Risk (Cost)</th>
                    <th className="px-3 py-3">Batch #</th>
                    <th className="px-3 py-3">Expiry Date</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expiringItems.map((p) => {
                    const days = getDaysUntilExpiry(p.expiryDate);
                    const isExp = isProductExpired(p);
                    const costRisk = p.stock * p.costPrice;

                    return (
                      <tr key={p.id}>
                        <td className="px-4 py-3 font-bold text-slate-900">{p.name}</td>
                        <td className="px-3 py-3 text-slate-600">{p.location || '—'}</td>
                        <td className="px-3 py-3 text-center font-bold">{p.stock} {p.unit}</td>
                        <td className="px-3 py-3 text-right font-black text-rose-700">
                          {formatCurrency(costRisk, settings.currencySymbol)}
                        </td>
                        <td className="px-3 py-3 font-mono text-slate-500 text-[11px]">{p.batchNo || '—'}</td>
                        <td className="px-3 py-3">{formatDate(p.expiryDate)}</td>
                        <td className="px-4 py-3 text-center">
                          {isExp ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                              EXPIRED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              In {days} days
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
