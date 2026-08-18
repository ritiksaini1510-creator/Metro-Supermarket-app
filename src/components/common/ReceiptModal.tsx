import React, { useRef } from 'react';
import { Modal } from './Modal';
import { SaleBill } from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { Printer, Download, CheckCircle, Share2, ArrowRight } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: SaleBill | null;
  onNewSale?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  bill,
  onNewSale,
}) => {
  const { settings } = useStore();
  const printRef = useRef<HTMLDivElement>(null);

  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadText = () => {
    const lines = [
      '========================================',
      `       ${settings.storeName.toUpperCase()}`,
      `   ${settings.tagline}`,
      `   ${settings.address}`,
      `   Phone: ${settings.phone}`,
      `   GSTIN/Tax ID: ${settings.gstinTaxId}`,
      '========================================',
      `Invoice #: ${bill.invoiceNumber}`,
      `Date/Time: ${formatDateTime(bill.createdAt)}`,
      `Cashier:   ${bill.cashierName}`,
      `Customer:  ${bill.customerName || 'Walk-in'}`,
      '----------------------------------------',
      'ITEM             QTY   RATE   TAX   TOTAL',
      '----------------------------------------',
      ...bill.items.map((item) => {
        const nameTrunc = item.product.name.padEnd(16, ' ').slice(0, 16);
        const qtyStr = String(item.quantity).padStart(4, ' ');
        const rateStr = formatCurrency(item.unitPrice, settings.currencySymbol).padStart(6, ' ');
        const taxStr = `${item.taxRate}%`.padStart(5, ' ');
        const totalStr = formatCurrency(item.total, settings.currencySymbol).padStart(7, ' ');
        return `${nameTrunc}${qtyStr}${rateStr}${taxStr}${totalStr}`;
      }),
      '----------------------------------------',
      `Subtotal:      ${formatCurrency(bill.subtotal, settings.currencySymbol)}`,
      `Tax Total:     ${formatCurrency(bill.taxTotal, settings.currencySymbol)}`,
      bill.discountTotal > 0 ? `Discounts:   -${formatCurrency(bill.discountTotal, settings.currencySymbol)}` : '',
      `GRAND TOTAL:   ${formatCurrency(bill.grandTotal, settings.currencySymbol)}`,
      '========================================',
      `Payment Method: ${bill.payment.method.toUpperCase()}`,
      bill.payment.cashTendered ? `Cash Tendered:  ${formatCurrency(bill.payment.cashTendered, settings.currencySymbol)}` : '',
      bill.payment.changeDue ? `Change Returned: ${formatCurrency(bill.payment.changeDue, settings.currencySymbol)}` : '',
      bill.payment.cardLast4 ? `Card Last 4:    **** ${bill.payment.cardLast4}` : '',
      bill.payment.upiRef ? `UPI Ref:        ${bill.payment.upiRef}` : '',
      '----------------------------------------',
      `   ${settings.receiptFooterMessage}`,
      '========================================',
    ].filter(Boolean).join('\n');

    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt_${bill.invoiceNumber}.txt`;
    link.click();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sale Invoice & Thermal Receipt"
      subtitle={`Invoice ${bill.invoiceNumber} • ${formatDateTime(bill.createdAt)}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Printable Thermal Receipt Canvas (80mm styling) */}
        <div
          ref={printRef}
          id="printable-receipt"
          className="bg-amber-50/40 p-6 rounded-2xl border border-dashed border-slate-300 font-mono text-xs text-slate-800 shadow-inner max-w-sm mx-auto select-all"
        >
          {/* Header */}
          <div className="text-center pb-3 border-b border-slate-300 space-y-1">
            <h2 className="text-base font-black tracking-tight text-slate-950 uppercase font-sans">
              {settings.storeName}
            </h2>
            <p className="text-[10px] text-slate-600 font-sans">{settings.tagline}</p>
            <p className="text-[10px] text-slate-600 font-sans">{settings.address}</p>
            <p className="text-[10px] text-slate-600">Tel: {settings.phone}</p>
            <p className="text-[10px] font-bold text-slate-700">Tax ID: {settings.gstinTaxId}</p>
          </div>

          {/* Meta Info */}
          <div className="py-2.5 border-b border-slate-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice No:</span>
              <span className="font-bold text-slate-900">{bill.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Date/Time:</span>
              <span>{formatDateTime(bill.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Cashier:</span>
              <span>{bill.cashierName}</span>
            </div>
            {bill.customerName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span>{bill.customerName} {bill.customerPhone ? `(${bill.customerPhone})` : ''}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="py-2.5 border-b border-slate-300">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 pb-1">
                  <th className="font-semibold pb-1">Item</th>
                  <th className="font-semibold text-center pb-1">Qty</th>
                  <th className="font-semibold text-right pb-1">Price</th>
                  <th className="font-semibold text-right pb-1">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60">
                {bill.items.map((item, idx) => (
                  <tr key={idx} className="py-1">
                    <td className="py-1 pr-1">
                      <div className="font-medium truncate max-w-[120px]">{item.product.name}</div>
                      {item.discountPercent > 0 && (
                        <span className="text-[9px] text-emerald-700 font-sans">
                          {item.discountPercent}% disc applied
                        </span>
                      )}
                    </td>
                    <td className="py-1 text-center font-sans">{item.quantity} {item.product.unit}</td>
                    <td className="py-1 text-right">{formatCurrency(item.unitPrice, settings.currencySymbol)}</td>
                    <td className="py-1 text-right font-bold">{formatCurrency(item.total, settings.currencySymbol)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="py-2.5 border-b border-slate-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Items Subtotal:</span>
              <span>{formatCurrency(bill.subtotal, settings.currencySymbol)}</span>
            </div>
            {bill.taxTotal > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Tax / GST:</span>
                <span>+{formatCurrency(bill.taxTotal, settings.currencySymbol)}</span>
              </div>
            )}
            {bill.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Total Discount:</span>
                <span>-{formatCurrency(bill.discountTotal, settings.currencySymbol)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-slate-950 pt-1 border-t border-slate-300 font-sans">
              <span>NET TOTAL:</span>
              <span>{formatCurrency(bill.grandTotal, settings.currencySymbol)}</span>
            </div>
          </div>

          {/* Payment Section */}
          <div className="py-2.5 border-b border-slate-300 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Mode:</span>
              <span className="font-bold uppercase">{bill.payment.method}</span>
            </div>
            {bill.payment.cashTendered !== undefined && (
              <div className="flex justify-between">
                <span className="text-slate-500">Cash Tendered:</span>
                <span>{formatCurrency(bill.payment.cashTendered, settings.currencySymbol)}</span>
              </div>
            )}
            {bill.payment.changeDue !== undefined && bill.payment.changeDue > 0 && (
              <div className="flex justify-between font-bold text-emerald-800">
                <span>Change Returned:</span>
                <span>{formatCurrency(bill.payment.changeDue, settings.currencySymbol)}</span>
              </div>
            )}
            {bill.payment.cardLast4 && (
              <div className="flex justify-between">
                <span className="text-slate-500">Card:</span>
                <span>**** {bill.payment.cardLast4}</span>
              </div>
            )}
            {bill.payment.upiRef && (
              <div className="flex justify-between">
                <span className="text-slate-500">UPI Ref:</span>
                <span className="truncate max-w-[120px]">{bill.payment.upiRef}</span>
              </div>
            )}
          </div>

          {/* Simulated Barcode Strips for Invoice Scanner */}
          <div className="py-3 text-center space-y-1">
            <div className="flex justify-center items-center h-8 gap-0.5 max-w-[180px] mx-auto overflow-hidden">
              {Array.from({ length: 32 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-full ${i % 3 === 0 ? 'w-1 bg-black' : i % 2 === 0 ? 'w-0.5 bg-black' : 'w-1.5 bg-black'}`}
                />
              ))}
            </div>
            <p className="text-[10px] tracking-widest text-slate-500 font-mono">*{bill.invoiceNumber}*</p>
          </div>

          {/* Footer message */}
          <div className="text-center pt-2 text-[10px] text-slate-500 font-sans leading-tight">
            <p>{settings.receiptFooterMessage}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={handleDownloadText}
              className="flex-1 sm:flex-initial px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-colors"
              title="Download TXT file"
            >
              <Download className="w-4 h-4" />
              <span>Text TXT</span>
            </button>
          </div>

          {onNewSale && (
            <button
              onClick={() => {
                onClose();
                onNewSale();
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition-colors shadow-xs"
            >
              <span>Next Customer</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
