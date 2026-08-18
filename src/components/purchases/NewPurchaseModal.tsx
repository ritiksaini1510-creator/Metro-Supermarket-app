import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useStore } from '../../context/StoreContext';
import { PurchaseItem, Product } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import { Plus, Trash2, CheckCircle2, Truck, Calendar } from 'lucide-react';

interface NewPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewPurchaseModal: React.FC<NewPurchaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { suppliers, products, addPurchaseOrder, settings } = useStore();

  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Selected item to add to purchase order
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [itemQty, setItemQty] = useState(10);
  const [itemCost, setItemCost] = useState(products[0]?.costPrice || 0);
  const [itemBatch, setItemBatch] = useState(`BTH-${Math.floor(100 + Math.random() * 900)}`);
  const [itemExpiry, setItemExpiry] = useState('');

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setItemCost(prod.costPrice);
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || itemQty <= 0) return;

    const subtotal = Number((itemCost * itemQty).toFixed(2));
    const total = subtotal;

    const newItem: PurchaseItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      sku: selectedProduct.sku,
      unit: selectedProduct.unit,
      quantity: itemQty,
      costPrice: itemCost,
      taxRate: selectedProduct.taxRate,
      subtotal,
      total,
      batchNo: itemBatch,
      expiryDate: itemExpiry || selectedProduct.expiryDate,
    };

    setItems([...items, newItem]);
    setItemQty(10);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const grandTotal = items.reduce((acc, i) => acc + i.total, 0);
  const balanceDue = Math.max(0, grandTotal - amountPaid);
  const paymentStatus = balanceDue === 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid';

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    const supplier = suppliers.find((s) => s.id === supplierId);

    addPurchaseOrder({
      supplierId,
      supplierName: supplier?.companyName || 'Direct Supplier',
      orderDate,
      receivedDate: orderDate,
      items,
      subtotal: grandTotal,
      taxTotal: 0,
      grandTotal,
      amountPaid: Math.min(amountPaid, grandTotal),
      balanceDue,
      paymentStatus,
      status: 'received',
      notes,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Purchase Order & Inward Stock"
      subtitle="Restock supermarket inventory from suppliers & update accounts payable"
      maxWidth="3xl"
    >
      <div className="space-y-5">
        
        {/* Supplier & Date Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Supplier *
            </label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.companyName} ({s.paymentTerms})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Invoice / Delivery Date
            </label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              PO / Challan Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Dock delivery #4"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Add Items Builder Bar */}
        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-3">
          <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
            Add Inward Goods to PO
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Product</label>
              <select
                value={selectedProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Current: {p.stock} {p.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                Qty ({selectedProduct?.unit})
              </label>
              <input
                type="number"
                min="1"
                step="any"
                value={itemQty}
                onChange={(e) => setItemQty(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                Cost Rate ({settings.currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={itemCost}
                onChange={(e) => setItemCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-0.5">Expiry Date</label>
              <input
                type="date"
                value={itemExpiry}
                onChange={(e) => setItemExpiry(e.target.value)}
                className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>
          </div>
        </div>

        {/* Inward Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-3 py-2">Item</th>
                <th className="px-2 py-2 text-center">Qty</th>
                <th className="px-2 py-2 text-right">Cost Rate</th>
                <th className="px-2 py-2 text-right">Total</th>
                <th className="px-2 py-2">Batch / Expiry</th>
                <th className="px-2 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No items added to this purchase invoice yet. Use the selector above.
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2 font-bold text-slate-900">{item.productName}</td>
                    <td className="px-2 py-2 text-center font-bold">{item.quantity} {item.unit}</td>
                    <td className="px-2 py-2 text-right">{formatCurrency(item.costPrice, settings.currencySymbol)}</td>
                    <td className="px-2 py-2 text-right font-black">{formatCurrency(item.total, settings.currencySymbol)}</td>
                    <td className="px-2 py-2 text-[11px] text-slate-500">
                      {item.batchNo || '—'} {item.expiryDate ? `(${item.expiryDate})` : ''}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Financial Settlement & Balance Dues */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-500 font-semibold block">Total Purchase Invoice:</span>
            <span className="text-2xl font-black text-slate-950">
              {formatCurrency(grandTotal, settings.currencySymbol)}
            </span>
          </div>

          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Amount Paid to Supplier Now
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={grandTotal}
                value={amountPaid}
                onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold w-36"
              />
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-500 font-semibold block">Supplier Balance Due</span>
              <span className={`text-sm font-black ${balanceDue > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {formatCurrency(balanceDue, settings.currencySymbol)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={items.length === 0}
            onClick={handleSavePurchase}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-all ${
              items.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Receive Goods & Update Inventory</span>
          </button>
        </div>

      </div>
    </Modal>
  );
};
