import React, { useState } from 'react';
import {
  PackagePlus,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Barcode,
  Printer,
  Download,
  Save,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Tag,
  Boxes,
  MapPin,
  Layers,
  Percent,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductCategory } from '../../types';
import { formatCurrency, exportToCSV } from '../../utils/helpers';
import { ProductModal } from '../inventory/ProductModal';
import { BarcodeLabelSheet } from '../inventory/BarcodeLabelSheet';
import { QuickRestockModal } from '../inventory/QuickRestockModal';

export const UpdateProductView: React.FC = () => {
  const {
    products,
    updateProduct,
    deleteProduct,
    settings,
    alerts
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [barcodePrintProduct, setBarcodePrintProduct] = useState<Product | null>(null);
  const [isLabelsOpen, setIsLabelsOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);

  // Quick inline edits state: { [productId]: { sellingPrice, costPrice, stock, minStockThreshold } }
  const [inlineEdits, setInlineEdits] = useState<Record<string, {
    sellingPrice: number;
    costPrice: number;
    stock: number;
    minStockThreshold: number;
  }>>({});

  const [saveSuccessMap, setSaveSuccessMap] = useState<Record<string, boolean>>({});

  // Categories list
  const categories: string[] = ['All', ...Array.from(new Set<string>(products.map(p => p.category)))];

  // Filter products
  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.barcode.includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      (p.location && p.location.toLowerCase().includes(q));

    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'out') matchesStock = p.stock <= 0;
    else if (stockFilter === 'low') matchesStock = p.stock > 0 && p.stock <= (p.minStockThreshold || settings.lowStockGlobalThreshold);

    return matchesSearch && matchesCat && matchesStock;
  });

  // Metric summaries
  const totalProductsCount = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const avgMargin = products.length > 0
    ? (products.reduce((acc, p) => {
        const margin = p.sellingPrice > 0 ? ((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100 : 0;
        return acc + margin;
      }, 0) / products.length).toFixed(1)
    : '0';

  const handleInlineChange = (
    productId: string,
    field: 'sellingPrice' | 'costPrice' | 'stock' | 'minStockThreshold',
    value: number
  ) => {
    const original = products.find(p => p.id === productId);
    if (!original) return;

    setInlineEdits(prev => {
      const current = prev[productId] || {
        sellingPrice: original.sellingPrice,
        costPrice: original.costPrice,
        stock: original.stock,
        minStockThreshold: original.minStockThreshold || 10,
      };
      return {
        ...prev,
        [productId]: {
          ...current,
          [field]: value >= 0 ? value : 0,
        }
      };
    });
  };

  const handleSaveInline = (productId: string) => {
    const edit = inlineEdits[productId];
    if (!edit) return;

    updateProduct(productId, {
      sellingPrice: Number(edit.sellingPrice),
      costPrice: Number(edit.costPrice),
      stock: Number(edit.stock),
      minStockThreshold: Number(edit.minStockThreshold),
    });

    // Clear edit state for this product
    setInlineEdits(prev => {
      const updated = { ...prev };
      delete updated[productId];
      return updated;
    });

    // Flash success
    setSaveSuccessMap(prev => ({ ...prev, [productId]: true }));
    setTimeout(() => {
      setSaveSuccessMap(prev => ({ ...prev, [productId]: false }));
    }, 2000);
  };

  const handleExportCSV = () => {
    const data = filteredProducts.map(p => ({
      SKU: p.sku,
      Barcode: p.barcode,
      ProductName: p.name,
      Brand: p.brand || '',
      Category: p.category,
      Unit: p.unit,
      CostPrice_INR: p.costPrice,
      SellingPrice_INR: p.sellingPrice,
      Margin_Percent: p.sellingPrice > 0 ? (((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100).toFixed(1) + '%' : '0%',
      CurrentStock: p.stock,
      LowStockThreshold: p.minStockThreshold,
      Location: p.location || '',
      ExpiryDate: p.expiryDate || 'N/A',
      BatchNo: p.batchNo || '',
    }));
    exportToCSV(data, `Product_Catalog_Update_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Top Banner & Quick Metrics */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20">
              <PackagePlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center space-x-2">
                <span>Update & Manage Products</span>
                <span className="text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  Catalog Manager
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Add new items, update selling prices, cost prices, stock counts & barcode data in real time
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats Chips */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="bg-slate-800/90 border border-slate-700/80 px-3.5 py-2 rounded-2xl text-left">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Items</span>
            <span className="text-base font-black text-white">{totalProductsCount}</span>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 px-3.5 py-2 rounded-2xl text-left">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Stock</span>
            <span className="text-base font-black text-emerald-400">{totalStockUnits.toLocaleString()} units</span>
          </div>

          <div className="bg-slate-800/90 border border-slate-700/80 px-3.5 py-2 rounded-2xl text-left">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Avg. Margin</span>
            <span className="text-base font-black text-amber-400">{avgMargin}%</span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Action Controls & Filters */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Product Name, Barcode, SKU, Brand, or Rack location..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setIsLabelsOpen(true)}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
              title="Generate printable barcode sticker sheets"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print Barcodes</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
              title="Download full catalog CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Category Pills & Stock Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Categories */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
              Category:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Stock Condition */}
          <div className="flex items-center space-x-1.5 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                stockFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                stockFilter === 'low' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              Low Stock ({alerts.lowStockCount})
            </button>
            <button
              onClick={() => setStockFilter('out')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-colors ${
                stockFilter === 'out' ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              Out of Stock ({alerts.outOfStockCount})
            </button>
          </div>
        </div>
      </div>

      {/* Products Table with Inline Updates */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Boxes className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">
              Product List ({filteredProducts.length} items found)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Edit Price & Stock directly in the fields below, then click <strong className="text-emerald-700">Save</strong>.
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <PackagePlus className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">No products match your search or filter</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setStockFilter('all');
              }}
              className="mt-3 text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4">Product Details</th>
                  <th className="py-3 px-3">Category & Rack</th>
                  <th className="py-3 px-3">Cost Price (₹)</th>
                  <th className="py-3 px-3">Selling Price (₹)</th>
                  <th className="py-3 px-3">Stock Units</th>
                  <th className="py-3 px-3">Min Alert</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const inline = inlineEdits[p.id];
                  const currentSelling = inline !== undefined ? inline.sellingPrice : p.sellingPrice;
                  const currentCost = inline !== undefined ? inline.costPrice : p.costPrice;
                  const currentStock = inline !== undefined ? inline.stock : p.stock;
                  const currentThreshold = inline !== undefined ? inline.minStockThreshold : (p.minStockThreshold || 10);
                  
                  const isDirty = inline !== undefined && (
                    inline.sellingPrice !== p.sellingPrice ||
                    inline.costPrice !== p.costPrice ||
                    inline.stock !== p.stock ||
                    inline.minStockThreshold !== (p.minStockThreshold || 10)
                  );

                  const marginPct = currentSelling > 0
                    ? (((currentSelling - currentCost) / currentSelling) * 100).toFixed(1)
                    : '0';

                  const isLow = p.stock > 0 && p.stock <= (p.minStockThreshold || settings.lowStockGlobalThreshold);
                  const isOut = p.stock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Name & Barcode */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="font-bold text-slate-900 text-sm truncate">{p.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                          {p.brand && <span className="font-semibold text-slate-700">{p.brand} •</span>}
                          <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-[10px] text-slate-600 border border-slate-200">
                            {p.barcode}
                          </span>
                        </div>
                      </td>

                      {/* Category & Location */}
                      <td className="py-3.5 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {p.category}
                        </span>
                        {p.location ? (
                          <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-1 truncate">
                            <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span>{p.location}</span>
                          </div>
                        ) : null}
                      </td>

                      {/* Cost Price Quick Edit */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center space-x-1">
                          <span className="text-slate-400 text-xs">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={currentCost}
                            onChange={(e) => handleInlineChange(p.id, 'costPrice', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded-lg text-xs font-semibold text-slate-900 focus:outline-hidden"
                          />
                        </div>
                      </td>

                      {/* Selling Price Quick Edit + Margin */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center space-x-1">
                          <span className="text-emerald-600 font-bold text-xs">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={currentSelling}
                            onChange={(e) => handleInlineChange(p.id, 'sellingPrice', parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded-lg text-xs font-black text-emerald-800 focus:outline-hidden"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Margin: <span className="font-bold text-amber-700">{marginPct}%</span>
                        </span>
                      </td>

                      {/* Stock Steppers & Quick Edit */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center space-x-1">
                          <input
                            type="number"
                            min="0"
                            value={currentStock}
                            onChange={(e) => handleInlineChange(p.id, 'stock', parseInt(e.target.value) || 0)}
                            className={`w-16 px-2 py-1 border rounded-lg text-xs font-black text-center focus:bg-white focus:outline-hidden ${
                              isOut
                                ? 'bg-rose-50 border-rose-300 text-rose-700'
                                : isLow
                                ? 'bg-amber-50 border-amber-300 text-amber-800'
                                : 'bg-slate-50 border-slate-200 text-slate-900'
                            }`}
                          />
                          <span className="text-[10px] text-slate-400">{p.unit}</span>
                        </div>
                        {isOut ? (
                          <span className="text-[9px] font-bold text-rose-600 uppercase tracking-wider block mt-0.5">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wider block mt-0.5">
                            Low Stock
                          </span>
                        ) : null}
                      </td>

                      {/* Min Stock Alert Threshold */}
                      <td className="py-3.5 px-3">
                        <input
                          type="number"
                          min="1"
                          value={currentThreshold}
                          onChange={(e) => handleInlineChange(p.id, 'minStockThreshold', parseInt(e.target.value) || 1)}
                          className="w-14 px-2 py-1 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-xs text-center font-medium text-slate-700 focus:outline-hidden"
                        />
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Save Inline Button */}
                          {isDirty ? (
                            <button
                              onClick={() => handleSaveInline(p.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-xs animate-pulse"
                              title="Save modified price and stock"
                            >
                              <Save className="w-3 h-3" />
                              <span>Save</span>
                            </button>
                          ) : saveSuccessMap[p.id] ? (
                            <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center space-x-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Saved</span>
                            </span>
                          ) : null}

                          {/* Quick Restock */}
                          <button
                            onClick={() => setRestockProduct(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="Add Quantity / Restock"
                          >
                            <PackagePlus className="w-4 h-4" />
                          </button>

                          {/* Full Edit Modal */}
                          <button
                            onClick={() => setEditingProduct(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Edit full product details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete Product */}
                          <button
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete "${p.name}"?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Full Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <ProductModal
          isOpen={isAddModalOpen || !!editingProduct}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingProduct(null);
          }}
          productToEdit={editingProduct}
        />
      )}

      {/* Barcode Label Sheet Modal */}
      {isLabelsOpen && (
        <BarcodeLabelSheet
          isOpen={isLabelsOpen}
          onClose={() => setIsLabelsOpen(false)}
        />
      )}

      {/* Quick Restock Modal */}
      {restockProduct && (
        <QuickRestockModal
          isOpen={!!restockProduct}
          onClose={() => setRestockProduct(null)}
          product={restockProduct}
        />
      )}

    </div>
  );
};
