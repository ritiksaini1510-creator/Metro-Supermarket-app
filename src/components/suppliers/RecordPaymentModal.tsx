import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useStore } from '../../context/StoreContext';
import { Supplier } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import { DollarSign, CheckCircle2 } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  supplier,
}) => {
  const { recordSupplierPayment, settings } = useStore();
  const [amount, setAmount] = useState<number>(supplier?.balanceDue || 0);
  const [paymentMode, setPaymentMode] = useState('Bank Transfer / NEFT');
  const [reference, setReference] = useState('');

  if (!supplier) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    recordSupplierPayment(
      supplier.id,
      amount,
      `Settlement via ${paymentMode} (Ref: ${reference || 'N/A'})`
    );
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Payment to ${supplier.companyName}`}
      subtitle={`Outstanding Balance Due: ${formatCurrency(supplier.balanceDue, settings.currencySymbol)}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Payment Amount ({settings.currencySymbol}) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={supplier.balanceDue}
            required
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Payment Mode
          </label>
          <select
            value={paymentMode}
            onChange={(e) => setPaymentMode(e.target.value)}
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="Bank Transfer / NEFT">Bank Wire / ACH / NEFT</option>
            <option value="Corporate Cheque">Company Cheque</option>
            <option value="Cash at Dock">Cash at Receiving Dock</option>
            <option value="UPI / Online">UPI / Corporate Card</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Transaction Reference / Cheque No.
          </label>
          <input
            type="text"
            placeholder="e.g. TXN-881920"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm Settlement</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
