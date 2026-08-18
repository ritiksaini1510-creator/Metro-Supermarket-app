import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useStore } from '../../context/StoreContext';
import { PaymentMethod, PaymentDetails, SaleBill } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import { DollarSign, CreditCard, QrCode, Split, User, Percent, ArrowRight, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (bill: SaleBill) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { cartTotals, settings, completeSale } = useStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [cardLast4, setCardLast4] = useState<string>('4242');
  const [upiRef, setUpiRef] = useState<string>('');
  const [splitCash, setSplitCash] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // Calculate final amounts with global discount
  const baseSubtotal = cartTotals.subtotal;
  const discountAmount = Number((baseSubtotal * (globalDiscount / 100)).toFixed(2));
  const discountedSubtotal = Math.max(0, baseSubtotal - discountAmount);
  const taxAmount = Number(((discountedSubtotal * settings.defaultTaxRate) / 100).toFixed(2));
  const finalPayable = Number((discountedSubtotal + taxAmount).toFixed(2));

  // Cash change math
  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - finalPayable);

  // Split calculations
  const splitCashNum = parseFloat(splitCash) || 0;
  const splitOnlineDue = Math.max(0, finalPayable - splitCashNum);

  useEffect(() => {
    if (isOpen) {
      setCashTendered(finalPayable.toString());
      setSplitCash((finalPayable / 2).toFixed(2));
      setUpiRef(`UPI-${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    }
  }, [isOpen, finalPayable]);

  const handleQuickCash = (amount: number) => {
    setCashTendered(amount.toString());
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let details: PaymentDetails;

    if (paymentMethod === 'cash') {
      details = {
        method: 'cash',
        cashTendered: tenderedNum,
        changeDue: Number(changeDue.toFixed(2)),
      };
    } else if (paymentMethod === 'card') {
      details = {
        method: 'card',
        cardLast4: cardLast4.slice(-4) || '9981',
      };
    } else if (paymentMethod === 'upi') {
      details = {
        method: 'upi',
        upiRef: upiRef || `UPI-${Date.now()}`,
      };
    } else if (paymentMethod === 'split') {
      details = {
        method: 'split',
        splitCash: splitCashNum,
        splitOnline: Number(splitOnlineDue.toFixed(2)),
      };
    } else {
      details = {
        method: 'credit',
      };
    }

    const bill = completeSale(
      details,
      customerName ? { name: customerName, phone: customerPhone } : undefined,
      globalDiscount,
      notes
    );

    if (bill) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // Safe fallback
      }
      onSuccess(bill);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="POS Settlement & Payment"
      subtitle={`Total Items: ${cartTotals.totalQuantity} • Total Due: ${formatCurrency(finalPayable, settings.currencySymbol)}`}
      maxWidth="2xl"
    >
      <form onSubmit={handleCheckoutSubmit} className="space-y-6">
        
        {/* Payable Summary Header */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider block">
              Net Payable Amount
            </span>
            <div className="text-3xl font-black tracking-tight text-white mt-0.5">
              {formatCurrency(finalPayable, settings.currencySymbol)}
            </div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>Subtotal: {formatCurrency(cartTotals.subtotal, settings.currencySymbol)}</span>
              {globalDiscount > 0 && (
                <span className="text-emerald-300 font-semibold">({globalDiscount}% off)</span>
              )}
              <span>Tax: {formatCurrency(taxAmount, settings.currencySymbol)}</span>
            </div>
          </div>

          {/* Discount Pill selector */}
          <div className="flex items-center space-x-1.5 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700">
            <span className="text-[11px] text-slate-400 pl-2 pr-1 font-semibold flex items-center">
              <Percent className="w-3 h-3 mr-1" /> Bill Off:
            </span>
            {[0, 5, 10, 15].map((disc) => (
              <button
                key={disc}
                type="button"
                onClick={() => setGlobalDiscount(disc)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  globalDiscount === disc
                    ? 'bg-emerald-500 text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                {disc}%
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method Selector Grid */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Payment Method
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'cash', label: 'Cash Tender', icon: DollarSign, color: 'emerald' },
              { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, color: 'blue' },
              { id: 'upi', label: 'UPI / QR Code', icon: QrCode, color: 'purple' },
              { id: 'split', label: 'Split (Cash + Online)', icon: Split, color: 'amber' },
            ].map((pm) => {
              const Icon = pm.icon;
              const isSelected = paymentMethod === pm.id;
              return (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                  className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mb-2 ${
                      isSelected ? 'text-emerald-600' : 'text-slate-500'
                    }`}
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block leading-tight">
                      {pm.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Method Specific Form Details */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
          
          {/* CASH MODE */}
          {paymentMethod === 'cash' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="w-full sm:w-1/2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cash Tendered by Customer ({settings.currencySymbol})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div className="w-full sm:w-1/2 bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block">Change to Return</span>
                    <span className={`text-xl font-black ${changeDue > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {formatCurrency(changeDue, settings.currencySymbol)}
                    </span>
                  </div>
                  {tenderedNum < finalPayable && (
                    <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded">
                      Short: {formatCurrency(finalPayable - tenderedNum, settings.currencySymbol)}
                    </span>
                  )}
                </div>
              </div>

              {/* Quick Cash Presets */}
              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1.5">
                  Quick Cash Fast Buttons:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(finalPayable)}
                    className="px-3 py-1.5 bg-white hover:bg-emerald-50 border border-slate-300 text-xs font-bold rounded-lg text-slate-800 transition-colors"
                  >
                    Exact ({formatCurrency(finalPayable, settings.currencySymbol)})
                  </button>
                  {[5, 10, 20, 50, 100].map((amt) => {
                    if (amt >= Math.floor(finalPayable)) {
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleQuickCash(amt)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold rounded-lg text-slate-800 transition-colors"
                        >
                          {settings.currencySymbol}{amt}
                        </button>
                      );
                    }
                    return null;
                  })}
                  <button
                    type="button"
                    onClick={() => handleQuickCash(Math.ceil(finalPayable / 10) * 10)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold rounded-lg text-slate-800 transition-colors"
                  >
                    Round up {settings.currencySymbol}{Math.ceil(finalPayable / 10) * 10}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CARD MODE */}
          {paymentMethod === 'card' && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-slate-200">
                <CreditCard className="w-8 h-8 text-blue-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800">Card POS Terminal Ready</p>
                  <p className="text-[11px] text-slate-500">Insert, swipe or tap chip/contactless card</p>
                </div>
                <div className="w-28">
                  <label className="text-[10px] text-slate-500 font-semibold block">Last 4 Digits</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={cardLast4}
                    onChange={(e) => setCardLast4(e.target.value)}
                    placeholder="4242"
                    className="w-full px-2 py-1 text-xs font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* UPI / QR MODE */}
          {paymentMethod === 'upi' && (
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
              <div className="w-28 h-28 bg-slate-900 rounded-xl p-2 flex flex-col items-center justify-center text-white shrink-0 shadow-inner">
                <QrCode className="w-16 h-16 text-white" />
                <span className="text-[9px] font-mono tracking-tighter text-emerald-400 mt-1">DYNAMIC QR</span>
              </div>
              <div className="flex-1 text-center sm:text-left space-y-1">
                <p className="text-xs font-bold text-slate-900">Scan QR Code from Customer Phone</p>
                <p className="text-[11px] text-slate-600">
                  Accepts Google Pay, Apple Pay, PhonePe, Paytm or Banking App
                </p>
                <div className="pt-1">
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                    Ref: {upiRef}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SPLIT PAYMENT MODE */}
          {paymentMethod === 'split' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cash Portion ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={finalPayable}
                  value={splitCash}
                  onChange={(e) => setSplitCash(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Online / Card Portion ({settings.currencySymbol})
                </label>
                <div className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-sm font-bold text-slate-900">
                  {formatCurrency(splitOnlineDue, settings.currencySymbol)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Customer Information (Optional for Loyalty & WhatsApp/SMS Bill) */}
        <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center space-x-2 mb-2">
            <User className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Customer Info (Optional for Loyalty / Receipts)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Customer Full Name (e.g. John Doe)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
            <input
              type="tel"
              placeholder="Customer Mobile (e.g. +1 555-0192)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center space-x-2 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01]"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Complete Sale & Print Receipt ({formatCurrency(finalPayable, settings.currencySymbol)})</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
