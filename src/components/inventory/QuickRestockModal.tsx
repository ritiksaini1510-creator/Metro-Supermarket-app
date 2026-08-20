import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { PackagePlus, Plus, Check, ArrowRight, AlertTriangle } from 'lucide-react';
import { formatCurrency, isProductLowStock, isProductOutOfStock } from '../../utils/helpers';

interface QuickRestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const QuickRestockModal: React.FC<QuickRestockModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { quickAddStock, settings } = useStore();
  const [quantityToAdd, setQuantityToAdd] = useState<number>(10);
  const [reason, setReason] = useState<string>('Supplier Delivery Inward');

  if (!product) return null;

  const handleQuickAdd = (amount: number) => {
    setQuantityToAdd(amount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantityToAdd <= 0) return;

    quickAddStock(product.id, quantityToAdd, reason);
    onClose();
  };

  const isOut = isProductOutOfStock(product);
  const isLow = isProductLowStock(product, settings.lowStockGlobalThreshold);
  const newProjectedStock = product.stock + (quantityToAdd || 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Check & Add Product Stock Quantity"
      subtitle={`SKU: ${product.sku} | Barcode: ${product.barcode}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Product Overview Card */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
              {product.category}
            </span>
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-full ${
                isOut
                  ? 'bg-rose-100 text-rose-800'
                  : isLow
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              Current Stock: {product.stock} {product.unit}
            </span>
          </div>

          <h3 className="text-base font-black text-slate-900">{product.name}</h3>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block text-[10px]">Cost Price:</span>
              <span className="font-bold text-slate-800 font-mono">
                {formatCurrency(product.costPrice, settings.currencySymbol)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Selling MRP:</span>
              <span className="font-bold text-emerald-800 font-mono">
                {formatCurrency(product.sellingPrice, settings.currencySymbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Add Presets */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Quick Add Quantity Presets ({product.unit})
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[5, 10, 25, 50, 100].map((num) => (
              <button
                type="button"
                key={num}
                onClick={() => handleQuickAdd(num)}
                className={`py-2 rounded-xl text-xs font-black transition-all ${
                  quantityToAdd === num
                    ? 'bg-emerald-600 text-white shadow-xs scale-[1.02]'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                +{num}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Quantity Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Units to Add to Stock *
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              step="any"
              required
              value={quantityToAdd}
              onChange={(e) => setQuantityToAdd(parseFloat(e.target.value) || 0)}
              className="w-full pl-3.5 pr-14 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <span className="absolute right-3 top-3 text-xs font-bold text-slate-400 uppercase">
              {product.unit}
            </span>
          </div>
        </div>

        {/* Projected Stock Level Preview */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
          <div>
            <span className="text-emerald-800 font-semibold block">New Projected Stock:</span>
            <span className="text-slate-500 text-[11px]">
              {product.stock} + {quantityToAdd} =
            </span>
          </div>
          <span className="text-base font-black text-emerald-950">
            {newProjectedStock} {product.unit}
          </span>
        </div>

        {/* Reason / Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Restock Reason / Note
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="Supplier Delivery Inward">Supplier Delivery Inward</option>
            <option value="Direct Purchase / Market Buy">Direct Purchase / Market Buy</option>
            <option value="Warehouse Transfer">Warehouse Transfer</option>
            <option value="Physical Stock Audit Adjustment">Physical Stock Audit Adjustment</option>
            <option value="Customer Return Restock">Customer Return Restock</option>
          </select>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={quantityToAdd <= 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs transition-transform active:scale-95 disabled:opacity-50"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Confirm & Add Quantity</span>
          </button>
        </div>

      </form>
    </Modal>
  );
};
