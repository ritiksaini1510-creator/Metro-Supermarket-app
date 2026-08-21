import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  ScanLine,
  Plus,
  Minus,
  Trash2,
  PauseCircle,
  PlayCircle,
  CreditCard,
  Percent,
  Sparkles,
  ShoppingBag,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
  Printer
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ProductCategory, Product, SaleBill } from '../../types';
import { formatCurrency, isProductLowStock, isProductOutOfStock } from '../../utils/helpers';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import { PaymentModal } from './PaymentModal';
import { HoldCartsModal } from './HoldCartsModal';
import { ReceiptModal } from '../common/ReceiptModal';
import { QuickRestockModal } from '../inventory/QuickRestockModal';
import { PackagePlus, CheckCircle2, Hand } from 'lucide-react';

const CATEGORIES: ('All' | ProductCategory)[] = [
  'All',
  'Fresh Produce',
  'Dairy & Eggs',
  'Bakery & Snacks',
  'Beverages',
  'Grains & Staples',
  'Packaged Foods',
  'Personal Care',
  'Household & Cleaning',
  'Frozen & Meat',
  'Spices & Condiments',
];

export const PosView: React.FC = () => {
  const {
    products,
    cart,
    cartTotals,
    addToCart,
    updateCartQuantity,
    updateItemDiscount,
    removeFromCart,
    clearCart,
    parkCurrentCart,
    parkedCarts,
    settings,
  } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<'All' | ProductCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [completedBill, setCompletedBill] = useState<SaleBill | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState({ name: '', phone: '' });
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [selectedCartProductId, setSelectedCartProductId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Active selected item in checkout order cart
  const selectedCartItem =
    cart.find((item) => item.product.id === selectedCartProductId) ||
    (cart.length > 0 ? cart[cart.length - 1] : null);

  const handleSelectProduct = (product: Product) => {
    if (isProductOutOfStock(product)) {
      setRestockProduct(product);
      return;
    }
    const added = addToCart(product, 1);
    if (added) {
      setSelectedCartProductId(product.id);
    }
  };

  // Keyboard shortcut listener for high-speed cashiers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2: Open Barcode Scanner
      if (e.key === 'F2') {
        e.preventDefault();
        setIsScannerOpen(true);
      }
      // F4: Pay if cart is not empty
      if (e.key === 'F4' && cart.length > 0) {
        e.preventDefault();
        setIsPaymentOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart]);

  // Filter products by category and search
  const filteredProducts = products.filter((p) => {
    if (!p.isActive) return false;
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const cleanSearch = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !cleanSearch ||
      p.name.toLowerCase().includes(cleanSearch) ||
      p.barcode.toLowerCase().includes(cleanSearch) ||
      p.sku.toLowerCase().includes(cleanSearch) ||
      p.brand.toLowerCase().includes(cleanSearch);
    return matchesCategory && matchesSearch;
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Exact barcode / SKU match -> Instant add to cart
    const clean = searchQuery.trim().toLowerCase();
    const exactMatch = products.find(
      (p) => p.barcode.toLowerCase() === clean || p.sku.toLowerCase() === clean
    );

    if (exactMatch) {
      const ok = addToCart(exactMatch);
      if (ok) setSelectedCartProductId(exactMatch.id);
      setSearchQuery('');
    } else if (filteredProducts.length === 1) {
      const ok = addToCart(filteredProducts[0]);
      if (ok) setSelectedCartProductId(filteredProducts[0].id);
      setSearchQuery('');
    }
  };

  const handleParkCart = () => {
    if (cart.length === 0) return;
    const name = activeCustomer.name ? `Cart (${activeCustomer.name})` : undefined;
    parkCurrentCart(name, activeCustomer.phone ? activeCustomer : undefined);
    setActiveCustomer({ name: '', phone: '' });
    setSelectedCartProductId(null);
  };

  const handlePaymentSuccess = (bill: SaleBill) => {
    setIsPaymentOpen(false);
    setCompletedBill(bill);
    setIsReceiptOpen(true);
    setActiveCustomer({ name: '', phone: '' });
    setSelectedCartProductId(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-5 space-y-4">
      {/* Main POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: Product Catalog & Fast Search (8 cols on desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-4">
          
          {/* Search Bar & Scanner Trigger */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Scan barcode, type SKU or search grocery item..."
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 absolute right-3 top-3 text-xs"
                >
                  Clear
                </button>
              )}
            </form>

            {/* Optical Scanner Button */}
            <button
              id="pos-open-scanner-btn"
              onClick={() => setIsScannerOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-2 shrink-0 transition-colors shadow-xs"
              title="Open Optical & Barcode Gun Scanner (F2)"
            >
              <ScanLine className="w-4 h-4 text-emerald-400" />
              <span>Barcode Scanner (F2)</span>
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs scale-[1.02]'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Products Grid with Stock Indicators and Quick Restock */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold">No items match your search or filter</p>
                <p className="text-xs text-slate-400 mt-1">Try another category or scan product barcode directly.</p>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const isOut = isProductOutOfStock(product);
                const isLow = isProductLowStock(product, settings.lowStockGlobalThreshold);
                const inCartItem = cart.find((i) => i.product.id === product.id);
                const isSelected = selectedCartItem?.product.id === product.id;

                return (
                  <div
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className={`bg-white rounded-2xl p-3 border transition-all flex flex-col justify-between relative group select-none cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 ring-2 ring-emerald-500/40 bg-emerald-50/20 shadow-md scale-[1.01]'
                        : inCartItem
                        ? 'border-emerald-300 bg-emerald-50/10'
                        : isOut
                        ? 'border-slate-200 bg-slate-50/70'
                        : 'border-slate-200/80 hover:border-emerald-400 hover:shadow-md'
                    }`}
                  >
                    {/* Status Badge */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                        {product.category}
                      </span>
                      {isSelected ? (
                        <span className="text-[9px] font-black uppercase bg-emerald-600 text-white px-1.5 py-0.5 rounded shadow-xs">
                          Active ({inCartItem?.quantity || 1})
                        </span>
                      ) : inCartItem ? (
                        <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded">
                          In Bill: {inCartItem.quantity}
                        </span>
                      ) : isOut ? (
                        <span className="text-[9px] font-black uppercase bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                          0 Left
                        </span>
                      ) : isLow ? (
                        <span className="text-[9px] font-black uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          Low: {product.stock} {product.unit}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {product.stock} {product.unit}
                        </span>
                      )}
                    </div>

                    {/* Product Name & Brand */}
                    <div className="mb-2">
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors">
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{product.barcode}</p>
                    </div>

                    {/* Price & Add Action */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-1.5">
                      <div className="min-w-0">
                        <span className="text-sm font-black text-slate-900 truncate block">
                          {formatCurrency(product.sellingPrice, settings.currencySymbol)}
                        </span>
                        <span className="text-[10px] text-slate-400">/{product.unit}</span>
                      </div>

                      {inCartItem ? (
                        <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                          {/* Quick Restock / Check Stock Quantity */}
                          <button
                            onClick={() => setRestockProduct(product)}
                            className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Check & Add Product Inventory"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                          </button>

                          {/* Direct Inline Add/Remove Quantity Stepper directly at the place of product */}
                          <div className="flex items-center bg-emerald-600 text-white rounded-xl shadow-xs overflow-hidden border border-emerald-700">
                            <button
                              onClick={() => {
                                const newQty = inCartItem.quantity - 1;
                                updateCartQuantity(product.id, newQty);
                                if (newQty <= 0 && selectedCartProductId === product.id) {
                                  setSelectedCartProductId(null);
                                }
                              }}
                              className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-emerald-700 hover:bg-emerald-800 text-white active:scale-90 transition-all font-black"
                              title="Decrease quantity (-1)"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setSelectedCartProductId(product.id)}
                              className="px-1.5 sm:px-2 font-black text-xs min-w-[24px] text-center select-none hover:bg-emerald-700/50 transition-colors"
                              title="Click to focus in editor"
                            >
                              {inCartItem.quantity}
                            </button>

                            <button
                              onClick={() => {
                                if (inCartItem.quantity < product.stock) {
                                  updateCartQuantity(product.id, inCartItem.quantity + 1);
                                  setSelectedCartProductId(product.id);
                                }
                              }}
                              disabled={inCartItem.quantity >= product.stock}
                              className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-white active:scale-90 transition-all font-black ${
                                inCartItem.quantity >= product.stock
                                  ? 'bg-emerald-900/60 opacity-60 cursor-not-allowed'
                                  : 'bg-emerald-700 hover:bg-emerald-800'
                              }`}
                              title={inCartItem.quantity >= product.stock ? 'Maximum stock reached' : 'Increase quantity (+1)'}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          {/* Quick Restock / Add Quantity Action */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRestockProduct(product);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Check & Add Product Stock Quantity"
                          >
                            <PackagePlus className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectProduct(product);
                            }}
                            disabled={isOut}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition-all ${
                              isSelected
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : isOut
                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                : 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white shadow-2xs hover:scale-105'
                            }`}
                            title="Add item to bill"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active POS Cart & Settlement Tray (5 cols on desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
            
            {/* Cart Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Checkout Cart</h3>
                <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-2 py-0.5 rounded-full">
                  {cartTotals.totalQuantity} items
                </span>
              </div>

              {/* Parked Carts Tray Trigger */}
              <div className="flex items-center space-x-1.5">
                {parkedCarts.length > 0 && (
                  <button
                    onClick={() => setIsHoldModalOpen(true)}
                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold rounded-lg flex items-center space-x-1 transition-colors"
                  >
                    <PauseCircle className="w-3.5 h-3.5" />
                    <span>On Hold ({parkedCarts.length})</span>
                  </button>
                )}

                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Clear Cart"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Customer Lookup (Optional) */}
            <div className="px-4 py-2 bg-slate-50/40 border-b border-slate-100 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Customer Name or Mobile..."
                value={activeCustomer.name}
                onChange={(e) => setActiveCustomer({ ...activeCustomer, name: e.target.value })}
                className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {cart.length > 0 && (
                <button
                  onClick={handleParkCart}
                  className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg shrink-0 flex items-center space-x-1"
                  title="Park cart for later"
                >
                  <PauseCircle className="w-3 h-3" />
                  <span>Hold</span>
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="flex-1 p-3 overflow-y-auto max-h-[380px] sm:max-h-[440px] divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                    <ScanLine className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-bold text-slate-600">Active bill is empty</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] mx-auto">
                    Select any item from the catalog to see it here and instantly adjust quantity.
                  </p>
                </div>
              ) : (
                cart.map((item) => {
                  const maxStock = item.product.stock;
                  const isAtMaxStock = item.quantity >= maxStock;
                  const isSelected = selectedCartItem?.product.id === item.product.id;

                  return (
                    <div
                      key={item.product.id}
                      onClick={() => setSelectedCartProductId(item.product.id)}
                      className={`py-2 px-2 rounded-xl transition-all flex items-start justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/80 border border-emerald-300 ring-2 ring-emerald-400/40 shadow-xs'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      {/* Item Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <h5 className="text-xs font-bold text-slate-900 truncate">
                            {item.product.name}
                          </h5>
                          {isSelected && (
                            <span className="bg-emerald-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-0.5">
                          <span>{formatCurrency(item.unitPrice, settings.currencySymbol)}/{item.product.unit}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Stock: {maxStock}</span>
                          {item.taxRate > 0 && (
                            <span className="text-[10px] text-slate-400 font-mono">+{item.taxRate}% Tax</span>
                          )}
                          {item.discountPercent > 0 && (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">
                              {item.discountPercent}% Off
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quantity Adjuster & Total */}
                      <div
                        className="flex items-center space-x-2 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="px-1.5 py-1 text-slate-500 hover:bg-slate-100 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <input
                            type="number"
                            step="any"
                            min="1"
                            max={maxStock}
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val)) updateCartQuantity(item.product.id, val);
                            }}
                            className="w-10 text-center text-xs font-bold border-none focus:outline-none p-0"
                          />
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            disabled={isAtMaxStock}
                            className="px-1.5 py-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-colors"
                            title={isAtMaxStock ? 'Max available stock reached' : 'Increase quantity'}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right min-w-[55px]">
                          <span className="text-xs font-black text-slate-900 block">
                            {formatCurrency(item.total, settings.currencySymbol)}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            removeFromCart(item.product.id);
                            if (selectedCartProductId === item.product.id) setSelectedCartProductId(null);
                          }}
                          className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Financial Totals & Checkout Panel */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
              
              {/* Breakdown */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal ({cartTotals.totalQuantity} items):</span>
                  <span className="font-semibold text-slate-800">
                    {formatCurrency(cartTotals.subtotal, settings.currencySymbol)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax Total (GST/VAT):</span>
                  <span className="font-semibold text-slate-800">
                    +{formatCurrency(cartTotals.taxTotal, settings.currencySymbol)}
                  </span>
                </div>
                {cartTotals.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Savings / Item Discounts:</span>
                    <span className="font-bold">
                      -{formatCurrency(cartTotals.discountTotal, settings.currencySymbol)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t border-slate-200">
                  <span>GRAND TOTAL:</span>
                  <span className="text-emerald-700 text-lg">
                    {formatCurrency(cartTotals.grandTotal, settings.currencySymbol)}
                  </span>
                </div>
              </div>

              {/* Settlement Button */}
              <button
                id="pos-pay-btn"
                disabled={cart.length === 0}
                onClick={() => setIsPaymentOpen(true)}
                className={`w-full py-3.5 px-4 rounded-xl font-black text-sm flex items-center justify-center space-x-2 transition-all shadow-md ${
                  cart.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 hover:scale-[1.01]'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>PAY & PRINT INVOICE (F4)</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanComplete={(product) => {
          addToCart(product);
          setSelectedCartProductId(product.id);
        }}
      />

      {/* Quick Check & Add Product Quantity Modal */}
      <QuickRestockModal
        isOpen={!!restockProduct}
        onClose={() => setRestockProduct(null)}
        product={restockProduct}
      />

      {/* Payment Settlement Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Parked Carts Modal */}
      <HoldCartsModal
        isOpen={isHoldModalOpen}
        onClose={() => setIsHoldModalOpen(false)}
      />

      {/* Thermal Invoice Print Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        bill={completedBill}
        onNewSale={() => {
          if (searchInputRef.current) searchInputRef.current.focus();
        }}
      />
    </div>
  );
};
