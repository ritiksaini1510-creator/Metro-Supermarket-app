import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useStore } from '../../context/StoreContext';
import { Product, StockAdjustment } from '../../types';
import { AlertTriangle, Plus, Minus, CheckCircle, Scale } from 'lucide-react';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { adjustStock, settings } = useStore();

  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove' | 'set'>('remove');
  const [amount, setAmount] = useState<number>(1);
  const [reason, setReason] = useState<StockAdjustment['reason']>('Damage');
  const [notes, setNotes] = useState('');

  if (!product) return null;

  const calculateNewStock = () => {
    if (adjustmentType === 'add') return product.stock + amount;
    if (adjustmentType === 'remove') return Math.max(0, product.stock - amount);
    return Math.max(0, amount);
  };

  const newStock = calculateNewStock();
  const quantityChange = newStock - product.stock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    adjustStock({
      productId: product.id,
      productName: product.name,
      quantityChange,
      previousStock: product.stock,
      newStock,
      reason,
      notes,
      performedBy: settings.cashierName,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Audit & Inventory Adjustment"
      subtitle={`Adjusting: ${product.name} (Current: ${product.stock} ${product.unit})`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Adjustment Mode Selector */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'remove', label: 'Write-off / Reduce', icon: Minus, color: 'rose' },
            { id: 'add', label: 'Restock / Increase', icon: Plus, color: 'emerald' },
            { id: 'set', label: 'Set Exact Count', icon: Scale, color: 'blue' },
          ].map((mode) => {
            const isSelected = adjustmentType === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setAdjustmentType(mode.id as 'add' | 'remove' | 'set')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {mode.label}
              </button>
            );
          })}
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {adjustmentType === 'set' ? 'New Physical Count Quantity' : 'Adjustment Units'} ({product.unit})
          </label>
          <input
            type="number"
            min="1"
            step="any"
            required
            value={amount}
            onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Reason Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Adjustment Reason *
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as StockAdjustment['reason'])}
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="Damage">Damage in Store / Transit</option>
            <option value="Expired Stock">Expired Stock Discard</option>
            <option value="Physical Audit Discrepancy">Physical Floor Audit Discrepancy</option>
            <option value="Theft / Shrinkage">Theft / Shrinkage Loss</option>
            <option value="Customer Return">Customer Return Restock</option>
            <option value="Other">Other Operational Adjustment</option>
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Audit Note / Remarks
          </label>
          <input
            type="text"
            placeholder="e.g. Found broken seal on shelf 2 during morning routine"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Calculation Preview */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 block">Stock Summary:</span>
            <span className="font-bold text-slate-800">
              {product.stock} {product.unit} &rarr;{' '}
              <span className={quantityChange < 0 ? 'text-rose-600 font-black' : 'text-emerald-600 font-black'}>
                {newStock} {product.unit}
              </span>
            </span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block">Delta:</span>
            <span className="font-mono font-bold">
              {quantityChange > 0 ? `+${quantityChange}` : quantityChange}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Apply Adjustment</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
