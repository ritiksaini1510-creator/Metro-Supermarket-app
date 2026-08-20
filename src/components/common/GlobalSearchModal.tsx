import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Package,
  Plus,
  Minus,
  Barcode,
  Tag,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  X
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductCategory } from '../../types';
import { formatCurrency, isProductLowStock, isProductOutOfStock } from '../../utils/helpers';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct?: (product: Product) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const { products, addToCart, quickAddStock, checkProductStock, settings } = useStore();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [quickRestockId, setQuickRestockId] = useState<string | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Filter products based on search
  const filteredProducts = products.filter((p) => {
    if (!p.isActive) return false;
    const clean = query.toLowerCase().trim();
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchQuery =
      !clean ||
      p.name.toLowerCase().includes(clean) ||
      p.barcode.toLowerCase().includes(clean) ||
      p.sku.toLowerCase().includes(clean) ||
      (p.brand && p.brand.toLowerCase().includes(clean)) ||
      (p.location && p.location.toLowerCase().includes(clean)) ||
      (p.category && p.category.toLowerCase().includes(clean));

    return matchCategory && matchQuery;
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredProducts.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredProducts[selectedIndex];
      if (target && target.stock > 0) {
        const qty = quantities[target.id] || 1;
        addToCart(target, qty);
        if (onSelectProduct) onSelectProduct(target);
      }
    }
  };

  const handleQuantityChange = (productId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[productId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleAddAndClose = (product: Product) => {
    const qty = quantities[product.id] || 1;
    addToCart(product, qty);
    if (onSelectProduct) onSelectProduct(product);
  };

  const handlePerformRestock = (productId: string) => {
    if (restockAmount > 0) {
      quickAddStock(productId, restockAmount, 'Quick Search Restock');
      setQuickRestockId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 pt-12 sm:pt-20">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Bar */}
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center space-x-3">
          <Search className="w-5 h-5 text-emerald-600 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search by Product Name, Barcode, SKU, Brand, Category or Aisle..."
            className="flex-1 bg-transparent border-none text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-200/70 hover:bg-slate-200 rounded-lg transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Category Pills Strip */}
        <div className="px-4 py-2 bg-white border-b border-slate-100 flex items-center space-x-1.5 overflow-x-auto scrollbar-none text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100">
          {filteredProducts.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No matching products found</p>
              <p className="text-xs text-slate-400 mt-1">Try another keyword, barcode or category.</p>
            </div>
          ) : (
            filteredProducts.map((p, idx) => {
              const isSelected = idx === selectedIndex;
              const isOut = isProductOutOfStock(p);
              const isLow = isProductLowStock(p, settings.lowStockGlobalThreshold);
              const stockInfo = checkProductStock(p.id, quantities[p.id] || 1);
              const itemQty = quantities[p.id] || 1;

              return (
                <div
                  key={p.id}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-3 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected ? 'bg-emerald-50/70 border border-emerald-200/80 shadow-xs' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* Product Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {p.category}
                      </span>
                      {p.brand && (
                        <span className="text-[11px] font-semibold text-indigo-700">
                          {p.brand}
                        </span>
                      )}
                      {p.location && (
                        <span className="text-[10px] text-slate-400 flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{p.location}</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-black text-slate-900 mt-1 truncate">
                      {p.name}
                    </h4>

                    <div className="flex items-center space-x-3 text-xs text-slate-500 font-mono mt-1">
                      <span>SKU: {p.sku}</span>
                      <span>•</span>
                      <span>Barcode: {p.barcode}</span>
                    </div>
                  </div>

                  {/* Stock Quantity Status Badge */}
                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <span className="text-xs font-bold text-slate-400">Stock:</span>
                        <span
                          className={`text-xs font-black px-2 py-0.5 rounded-full ${
                            isOut
                              ? 'bg-rose-100 text-rose-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.stock} {p.unit} {isOut ? '(Out)' : isLow ? '(Low)' : ''}
                        </span>
                      </div>
                      <div className="text-sm font-black text-slate-900 mt-0.5">
                        {formatCurrency(p.sellingPrice, settings.currencySymbol)}
                        <span className="text-[10px] font-normal text-slate-400">/{p.unit}</span>
                      </div>
                    </div>

                    {/* Quantity Stepper & Add Action */}
                    {!isOut ? (
                      <div className="flex items-center space-x-1.5">
                        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                          <button
                            onClick={() => handleQuantityChange(p.id, -1)}
                            className="p-1.5 text-slate-500 hover:bg-slate-100"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-black text-slate-900">
                            {itemQty}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(p.id, 1)}
                            disabled={itemQty >= p.stock}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleAddAndClose(p)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-xs transition-transform active:scale-95"
                          title="Add to Cart"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1.5">
                        {quickRestockId === p.id ? (
                          <div className="flex items-center space-x-1 bg-white p-1 border border-slate-300 rounded-xl">
                            <input
                              type="number"
                              min="1"
                              value={restockAmount}
                              onChange={(e) => setRestockAmount(parseInt(e.target.value) || 1)}
                              className="w-12 text-xs text-center font-bold border rounded p-1"
                            />
                            <button
                              onClick={() => handlePerformRestock(p.id)}
                              className="px-2 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded-lg"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setQuickRestockId(null)}
                              className="p-1 text-slate-400"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setQuickRestockId(p.id);
                              setRestockAmount(20);
                            }}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-2xs"
                          >
                            + Quick Restock
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono">↓</kbd> to navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono">↵</kbd> to add to cart</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-[10px] font-mono">ESC</kbd> to dismiss</span>
          </div>
          <span className="font-semibold text-slate-700">
            {filteredProducts.length} items found
          </span>
        </div>
      </div>
    </div>
  );
};
