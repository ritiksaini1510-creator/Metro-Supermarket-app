import React, { useState } from 'react';
import {
  Calendar,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Receipt,
  Download,
  CreditCard,
  Banknote,
  Smartphone,
  Layers,
  ArrowUpRight,
  Printer,
  ChevronRight,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { Modal } from './Modal';
import { useStore } from '../../context/StoreContext';
import { SaleBill } from '../../types';
import { formatCurrency, formatDateTime, exportToCSV } from '../../utils/helpers';
import { ReceiptModal } from './ReceiptModal';

interface SalesPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPeriod?: 'today' | 'week' | 'month' | 'all';
}

export const SalesPeriodModal: React.FC<SalesPeriodModalProps> = ({
  isOpen,
  onClose,
  initialPeriod = 'today',
}) => {
  const { salesSummary, settings } = useStore();
  const [activePeriod, setActivePeriod] = useState<'today' | 'week' | 'month' | 'all'>(initialPeriod);
  const [selectedBillForReceipt, setSelectedBillForReceipt] = useState<SaleBill | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'card' | 'upi' | 'split'>('all');
  const [searchInvoice, setSearchInvoice] = useState('');

  const currentSummary = salesSummary[activePeriod];

  // Top Selling items in this period
  const itemMap = new Map<string, { name: string; qty: number; revenue: number; unit: string }>();
  currentSummary.bills.forEach((bill) => {
    bill.items.forEach((item) => {
      const existing = itemMap.get(item.product.id) || {
        name: item.product.name,
        qty: 0,
        revenue: 0,
        unit: item.product.unit,
      };
      existing.qty += item.quantity;
      existing.revenue += item.total;
      itemMap.set(item.product.id, existing);
    });
  });

  const topSellingItems = Array.from(itemMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  // Payment Breakdown
  const paymentBreakdown = {
    cash: { count: 0, amount: 0 },
    card: { count: 0, amount: 0 },
    upi: { count: 0, amount: 0 },
    split: { count: 0, amount: 0 },
  };

  currentSummary.bills.forEach((bill) => {
    const method = bill.payment.method;
    if (paymentBreakdown[method]) {
      paymentBreakdown[method].count += 1;
      paymentBreakdown[method].amount += bill.grandTotal;
    }
  });

  // Filtered bills list
  const filteredBills = currentSummary.bills.filter((b) => {
    const matchPayment = paymentFilter === 'all' || b.payment.method === paymentFilter;
    const matchSearch =
      !searchInvoice.trim() ||
      b.invoiceNumber.toLowerCase().includes(searchInvoice.toLowerCase()) ||
      b.customerName?.toLowerCase().includes(searchInvoice.toLowerCase()) ||
      b.cashierName?.toLowerCase().includes(searchInvoice.toLowerCase());
    return matchPayment && matchSearch;
  });

  const handleExportPeriodSales = () => {
    const data = filteredBills.map((b) => ({
      InvoiceNumber: b.invoiceNumber,
      DateTime: formatDateTime(b.createdAt),
      Customer: b.customerName || 'Walk-in',
      Cashier: b.cashierName || settings.cashierName,
      ItemsCount: b.items.length,
      TotalUnits: b.items.reduce((acc, i) => acc + i.quantity, 0),
      Subtotal: b.subtotal,
      TaxTotal: b.taxTotal,
      Discount: b.discountTotal,
      GrandTotal: b.grandTotal,
      PaymentMethod: b.payment.method.toUpperCase(),
      Status: b.status,
    }));
    exportToCSV(data, `Sales_Report_${activePeriod.toUpperCase()}`);
  };

  const periodLabels = {
    today: { title: "Today's Sales (Day)", subtitle: 'Real-time sales for current date', badge: 'Day' },
    week: { title: "This Week's Sales (7 Days)", subtitle: 'Rolling past 7 days performance', badge: 'Week' },
    month: { title: "This Month's Sales (Month)", subtitle: 'Monthly revenue & volume metrics', badge: 'Month' },
    all: { title: 'All-Time Sales History', subtitle: 'Lifetime sales summary', badge: 'All' },
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Supermarket Total Sales Overview"
        subtitle="Track and audit live revenue across Day, Week and Month"
        maxWidth="4xl"
      >
        <div className="space-y-5">
          
          {/* Period Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-2xl">
            {(['today', 'week', 'month', 'all'] as const).map((period) => {
              const isSelected = activePeriod === period;
              const summary = salesSummary[period];
              return (
                <button
                  key={period}
                  onClick={() => setActivePeriod(period)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-left flex flex-col justify-between ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="capitalize">{period === 'today' ? 'Today (Day)' : period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                      isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {summary.ordersCount} bills
                    </span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-emerald-700 mt-1">
                    {formatCurrency(summary.revenue, settings.currencySymbol)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Primary Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-2xl">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                Gross Total Revenue
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-950 mt-1">
                {formatCurrency(currentSummary.revenue, settings.currencySymbol)}
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">
                Across {currentSummary.ordersCount} finalized sales
              </span>
            </div>

            <div className="bg-indigo-50/70 border border-indigo-200/80 p-3.5 rounded-2xl">
              <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider block">
                Gross Profit & Margin
              </span>
              <div className="text-xl sm:text-2xl font-black text-indigo-950 mt-1">
                {formatCurrency(currentSummary.grossProfit, settings.currencySymbol)}
              </div>
              <span className="text-[10px] text-indigo-700 font-semibold mt-0.5 block">
                {currentSummary.grossMarginPercent}% profit margin
              </span>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-2xl">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                Items / Units Sold
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-950 mt-1">
                {currentSummary.itemsSoldCount}
              </div>
              <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">
                Avg Basket: {formatCurrency(currentSummary.avgOrderValue, settings.currencySymbol)}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Tax & Discounts
              </span>
              <div className="text-sm font-bold text-slate-900 mt-1">
                Tax: <span className="font-mono text-emerald-700">+{formatCurrency(currentSummary.taxTotal, settings.currencySymbol)}</span>
              </div>
              <div className="text-xs font-bold text-slate-700 mt-0.5">
                Saved: <span className="font-mono text-amber-700">-{formatCurrency(currentSummary.discountTotal, settings.currencySymbol)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Breakdown & Top Sellers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Payment Method Cards */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Tender Breakdown</span>
                <span className="text-[10px] text-slate-400 font-normal">{periodLabels[activePeriod].badge}</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold text-slate-700">Cash</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">
                      {formatCurrency(paymentBreakdown.cash.amount, settings.currencySymbol)}
                    </span>
                    <span className="text-[10px] text-slate-400">{paymentBreakdown.cash.count} bills</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-slate-700">Card / POS</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">
                      {formatCurrency(paymentBreakdown.card.amount, settings.currencySymbol)}
                    </span>
                    <span className="text-[10px] text-slate-400">{paymentBreakdown.card.count} bills</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-slate-700">UPI / QR</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">
                      {formatCurrency(paymentBreakdown.upi.amount, settings.currencySymbol)}
                    </span>
                    <span className="text-[10px] text-slate-400">{paymentBreakdown.upi.count} bills</span>
                  </div>
                </div>

                {paymentBreakdown.split.count > 0 && (
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold text-slate-700">Split Pay</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 block">
                        {formatCurrency(paymentBreakdown.split.amount, settings.currencySymbol)}
                      </span>
                      <span className="text-[10px] text-slate-400">{paymentBreakdown.split.count} bills</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Top Items Sold in this period */}
            <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center justify-between">
                <span>Top Selling Items ({periodLabels[activePeriod].badge})</span>
                <span className="text-[10px] text-emerald-700 font-semibold">{topSellingItems.length} Products</span>
              </h4>

              {topSellingItems.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No products sold in this period.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {topSellingItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-slate-900 truncate block">{item.name}</span>
                        <span className="text-[10px] text-slate-500">
                          Sold: <strong className="text-slate-800">{item.qty} {item.unit}</strong>
                        </span>
                      </div>
                      <span className="font-black text-emerald-700 font-mono shrink-0">
                        {formatCurrency(item.revenue, settings.currencySymbol)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Transactions List with Search, Filter & Export */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Invoices for {periodLabels[activePeriod].title} ({filteredBills.length})
                </h4>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="Search invoice or customer..."
                  value={searchInvoice}
                  onChange={(e) => setSearchInvoice(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />

                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                >
                  <option value="all">All Tenders</option>
                  <option value="cash">Cash Only</option>
                  <option value="card">Card Only</option>
                  <option value="upi">UPI Only</option>
                  <option value="split">Split Only</option>
                </select>

                <button
                  onClick={handleExportPeriodSales}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
              {filteredBills.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No invoices found for the selected period and filters.
                </div>
              ) : (
                filteredBills.map((bill) => (
                  <div
                    key={bill.id}
                    className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-slate-900">{bill.invoiceNumber}</span>
                        <span className="text-[10px] text-slate-400">{formatDateTime(bill.createdAt)}</span>
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {bill.payment.method}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        <span>{bill.customerName}</span>
                        <span className="mx-1.5">•</span>
                        <span>{bill.items.length} items ({bill.items.reduce((a, b) => a + b.quantity, 0)} units)</span>
                        <span className="mx-1.5">•</span>
                        <span>Cashier: {bill.cashierName}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="font-black text-sm text-slate-900">
                        {formatCurrency(bill.grandTotal, settings.currencySymbol)}
                      </span>
                      <button
                        onClick={() => setSelectedBillForReceipt(bill)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-lg flex items-center space-x-1 transition-colors"
                        title="View & Print Invoice Receipt"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Receipt</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </Modal>

      {/* Embedded Thermal Receipt Preview Modal */}
      {selectedBillForReceipt && (
        <ReceiptModal
          isOpen={true}
          onClose={() => setSelectedBillForReceipt(null)}
          bill={selectedBillForReceipt}
        />
      )}
    </>
  );
};
