import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Download,
  Calendar,
  DollarSign,
  FileCheck,
  CreditCard,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, formatDate, exportToCSV } from '../../utils/helpers';
import { NewPurchaseModal } from './NewPurchaseModal';
import { Modal } from '../common/Modal';

export const PurchasesView: React.FC = () => {
  const { purchases, recordPurchasePayment, settings, suppliers } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isNewPurchaseOpen, setIsNewPurchaseOpen] = useState(false);
  const [selectedPOForPayment, setSelectedPOForPayment] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);

  // Financial aggregates
  const totalPurchasesAmount = purchases.reduce((acc, p) => acc + p.grandTotal, 0);
  const totalAmountPaid = purchases.reduce((acc, p) => acc + p.amountPaid, 0);
  const totalBalanceDue = purchases.reduce((acc, p) => acc + p.balanceDue, 0);

  const filteredPurchases = purchases.filter((po) => {
    const clean = searchQuery.toLowerCase().trim();
    return (
      !clean ||
      po.invoiceNumber.toLowerCase().includes(clean) ||
      po.supplierName.toLowerCase().includes(clean) ||
      po.items.some((i) => i.productName.toLowerCase().includes(clean))
    );
  });

  const handleExportCSV = () => {
    const data = filteredPurchases.map((po) => ({
      InvoiceNumber: po.invoiceNumber,
      Supplier: po.supplierName,
      OrderDate: po.orderDate,
      ReceivedDate: po.receivedDate || '',
      ItemCount: po.items.length,
      GrandTotal: po.grandTotal,
      AmountPaid: po.amountPaid,
      BalanceDue: po.balanceDue,
      PaymentStatus: po.paymentStatus,
      Notes: po.notes || '',
    }));
    exportToCSV(data, 'Supermarket_Purchases_Log');
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPOForPayment && paymentAmount > 0) {
      recordPurchasePayment(selectedPOForPayment, paymentAmount);
      setSelectedPOForPayment(null);
      setPaymentAmount(0);
    }
  };

  const activePayingPO = purchases.find((p) => p.id === selectedPOForPayment);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Truck className="w-6 h-6 text-emerald-600" />
            <span>Purchases & Stock Inward</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage vendor shipments, stock replenishment and supplier purchase invoices
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            id="record-purchase-btn"
            onClick={() => setIsNewPurchaseOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Purchase Entry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Inward Purchases
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(totalPurchasesAmount, settings.currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400">{purchases.length} supplier invoices</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            Total Settle Paid
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {formatCurrency(totalAmountPaid, settings.currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400">Paid to suppliers</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
            Accounts Payable Balance
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {formatCurrency(totalBalanceDue, settings.currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400">Outstanding credit dues</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search by PO invoice #, supplier name, or item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Purchases Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3.5">Invoice #</th>
                <th className="px-3 py-3.5">Supplier</th>
                <th className="px-3 py-3.5">Date</th>
                <th className="px-3 py-3.5">Goods Received</th>
                <th className="px-3 py-3.5 text-right">Grand Total</th>
                <th className="px-3 py-3.5 text-right">Paid</th>
                <th className="px-3 py-3.5 text-right">Balance Due</th>
                <th className="px-3 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No purchase orders recorded yet. Click "New Purchase Entry" to restock.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{po.invoiceNumber}</td>
                    <td className="px-3 py-3 font-semibold text-slate-800">{po.supplierName}</td>
                    <td className="px-3 py-3 text-slate-500">{formatDate(po.orderDate)}</td>
                    <td className="px-3 py-3 text-slate-600">
                      <div className="truncate max-w-[200px]" title={po.items.map((i) => i.productName).join(', ')}>
                        {po.items.length} items ({po.items.map((i) => `${i.quantity} ${i.unit}`).join(', ')})
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-black text-slate-900">
                      {formatCurrency(po.grandTotal, settings.currencySymbol)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-emerald-700">
                      {formatCurrency(po.amountPaid, settings.currencySymbol)}
                    </td>
                    <td className="px-3 py-3 text-right font-black">
                      <span className={po.balanceDue > 0 ? 'text-amber-700' : 'text-slate-400'}>
                        {formatCurrency(po.balanceDue, settings.currencySymbol)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          po.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : po.paymentStatus === 'partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {po.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {po.balanceDue > 0 && (
                        <button
                          onClick={() => {
                            setSelectedPOForPayment(po.id);
                            setPaymentAmount(po.balanceDue);
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-[10px] transition-colors"
                        >
                          Pay Dues
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      <NewPurchaseModal
        isOpen={isNewPurchaseOpen}
        onClose={() => setIsNewPurchaseOpen(false)}
      />

      {/* Pay Supplier Balance Modal */}
      {selectedPOForPayment && activePayingPO && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPOForPayment(null)}
          title={`Pay Supplier Balance (${activePayingPO.supplierName})`}
          subtitle={`Invoice: ${activePayingPO.invoiceNumber} • Remaining Balance: ${formatCurrency(activePayingPO.balanceDue, settings.currencySymbol)}`}
          maxWidth="sm"
        >
          <form onSubmit={handlePaySubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Amount ({settings.currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={activePayingPO.balanceDue}
                required
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedPOForPayment(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Confirm Payment
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  );
};
