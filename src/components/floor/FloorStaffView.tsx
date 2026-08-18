import React, { useState, useRef } from 'react';
import {
  Smartphone,
  Search,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  DollarSign,
  Plus,
  Minus,
  RefreshCw
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import {
  formatCurrency,
  formatDate,
  isProductLowStock,
  isProductOutOfStock,
  isProductNearExpiry,
  isProductExpired,
  getDaysUntilExpiry
} from '../../utils/helpers';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';

export const FloorStaffView: React.FC = () => {
  const { products, adjustStock, updateProduct, settings } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [quickCount, setQuickCount] = useState<number>(0);
  const [reason, setReason] = useState<string>('Floor audit');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Quick search
  const filteredProducts = products.filter((p) => {
    if (!searchQuery.trim()) return false;
    const clean = searchQuery.toLowerCase().trim();
    return (
      p.name.toLowerCase().includes(clean) ||
      p.barcode.includes(clean) ||
      p.sku.toLowerCase().includes(clean) ||
      (p.location && p.location.toLowerCase().includes(clean))
    );
  });

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setQuickCount(prod.stock);
    setSearchQuery('');
    setFeedbackMsg(null);
  };

  const handleScanProduct = (prod: Product) => {
    setSelectedProduct(prod);
    setQuickCount(prod.stock);
    setFeedbackMsg(null);
  };

  const handleSaveStockCount = () => {
    if (!selectedProduct) return;
    const diff = quickCount - selectedProduct.stock;
    adjustStock({
      productId: selectedProduct.id,
      previousStock: selectedProduct.stock,
      adjustmentQuantity: diff,
      newStock: quickCount,
      type: diff >= 0 ? 'audit_gain' : 'audit_loss',
      reason: reason || 'Floor shelf audit verification',
    });

    setFeedbackMsg(`Updated stock for ${selectedProduct.name} to ${quickCount} ${selectedProduct.unit}`);
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-5 space-y-4">
      {/* Mobile Floor Banner */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-white">Floor Staff Mobile Mode</h1>
            <p className="text-xs text-slate-400">Shelf price checker & instant stock audit</p>
          </div>
        </div>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs"
        >
          <ScanLine className="w-4 h-4" />
          <span>Scan Shelf</span>
        </button>
      </div>

      {/* Instant Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs relative">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type barcode, SKU, aisle or item name..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>

        {/* Dropdown Suggestions */}
        {searchQuery.trim() && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 z-30 max-h-60 overflow-y-auto divide-y divide-slate-100">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">No matching items found</div>
            ) : (
              filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectProduct(p)}
                  className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {p.barcode} • {p.location || 'No Aisle'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900">
                      {formatCurrency(p.sellingPrice, settings.currencySymbol)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Stock: {p.stock}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Success Feedback Notification */}
      {feedbackMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Active Product Inspect & Count Card */}
      {selectedProduct ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                {selectedProduct.category}
              </span>
              <h2 className="text-base font-bold text-slate-900 mt-1">{selectedProduct.name}</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">Barcode: {selectedProduct.barcode}</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-black text-slate-900">
                {formatCurrency(selectedProduct.sellingPrice, settings.currencySymbol)}
              </div>
              <span className="text-[11px] text-slate-400">MRP / Unit</span>
            </div>
          </div>

          {/* Location & Details Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-indigo-500" />
              <div>
                <span className="text-[10px] text-slate-400 block">Shelf Aisle</span>
                <span className="font-bold text-slate-800">{selectedProduct.location || 'Not Assigned'}</span>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-500" />
              <div>
                <span className="text-[10px] text-slate-400 block">Expiry Date</span>
                <span className="font-bold text-slate-800">{selectedProduct.expiryDate || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Quick Stock Count Adjustment Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">Floor Physical Count</span>
              <span className="text-slate-400">System count: {selectedProduct.stock} {selectedProduct.unit}</span>
            </div>

            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setQuickCount(Math.max(0, quickCount - 1))}
                className="w-12 h-12 bg-white border border-slate-200 rounded-xl font-bold text-lg text-slate-700 hover:bg-slate-100 flex items-center justify-center shadow-xs"
              >
                <Minus className="w-5 h-5" />
              </button>

              <div className="w-24 text-center">
                <input
                  type="number"
                  min="0"
                  value={quickCount}
                  onChange={(e) => setQuickCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-center text-2xl font-black text-slate-900 bg-white border border-slate-200 rounded-xl py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 font-semibold">{selectedProduct.unit}</span>
              </div>

              <button
                onClick={() => setQuickCount(quickCount + 1)}
                className="w-12 h-12 bg-white border border-slate-200 rounded-xl font-bold text-lg text-slate-700 hover:bg-slate-100 flex items-center justify-center shadow-xs"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleSaveStockCount}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Stock Count</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <ScanLine className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Product Inspected</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Scan a barcode on the shelf or search for an item above to check pricing, location, or audit shelf inventory.
          </p>
          <button
            onClick={() => setIsScannerOpen(true)}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl inline-flex items-center space-x-2"
          >
            <ScanLine className="w-4 h-4 text-emerald-400" />
            <span>Launch Camera Scanner</span>
          </button>
        </div>
      )}

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanComplete={handleScanProduct}
      />
    </div>
  );
};
