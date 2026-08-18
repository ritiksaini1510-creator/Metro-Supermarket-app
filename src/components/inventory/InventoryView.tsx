import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Edit2,
  Trash2,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowUpDown,
  Tag,
  SlidersHorizontal
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product, ProductCategory } from '../../types';
import {
  formatCurrency,
  formatDate,
  isProductLowStock,
  isProductOutOfStock,
  isProductExpired,
  isProductNearExpiry,
  getDaysUntilExpiry,
  exportToCSV,
} from '../../utils/helpers';
import { ProductModal } from './ProductModal';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { BarcodeLabelSheet } from './BarcodeLabelSheet';

type StockStatusFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'expiring' | 'expired';

export const InventoryView: React.FC = () => {
  const { products, deleteProduct, settings, alerts } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StockStatusFilter>('all');
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLabelsOpen, setIsLabelsOpen] = useState(false);

  // Financial inventory metrics
  const totalValuationCost = products.reduce((acc, p) => acc + p.costPrice * p.stock, 0);
  const totalValuationRetail = products.reduce((acc, p) => acc + p.sellingPrice * p.stock, 0);
  const estimatedPotentialProfit = totalValuationRetail - totalValuationCost;

  // Filter products
  const filteredProducts = products.filter((p) => {
    // Search
    const cleanSearch = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !cleanSearch ||
      p.name.toLowerCase().includes(cleanSearch) ||
      p.barcode.includes(cleanSearch) ||
      p.sku.toLowerCase().includes(cleanSearch) ||
      (p.brand && p.brand.toLowerCase().includes(cleanSearch)) ||
      (p.location && p.location.toLowerCase().includes(cleanSearch));

    // Category
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;

    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'out_of_stock') matchesStatus = isProductOutOfStock(p);
    else if (statusFilter === 'low_stock') matchesStatus = isProductLowStock(p, settings.lowStockGlobalThreshold);
    else if (statusFilter === 'in_stock') matchesStatus = p.stock > (p.minStockThreshold || settings.lowStockGlobalThreshold);
    else if (statusFilter === 'expiring') matchesStatus = isProductNearExpiry(p, settings.expiryWarningDays);
    else if (statusFilter === 'expired') matchesStatus = isProductExpired(p);

    return matchesSearch && matchesCat && matchesStatus;
  });

  const handleExportCSV = () => {
    const data = filteredProducts.map((p) => ({
      SKU: p.sku,
      Barcode: p.barcode,
      ProductName: p.name,
      Category: p.category,
      Brand: p.brand || '',
      Unit: p.unit,
      CostPrice: p.costPrice,
      SellingPrice: p.sellingPrice,
      CurrentStock: p.stock,
      LowStockThreshold: p.minStockThreshold,
      TotalCostValuation: (p.costPrice * p.stock).toFixed(2),
      TotalRetailValuation: (p.sellingPrice * p.stock).toFixed(2),
      ExpiryDate: p.expiryDate || 'N/A',
      AisleLocation: p.location || '',
      BatchNumber: p.batchNo || '',
    }));
    exportToCSV(data, 'Supermarket_Inventory_Catalog');
  };

  const categoriesList = Array.from(new Set(products.map((p) => p.category)));

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Package className="w-6 h-6 text-emerald-600" />
            <span>Stock & Inventory Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock catalog, barcode lookup, threshold alerts & batch tracking
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setIsLabelsOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-2xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Shelf Labels</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            id="add-product-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Active SKUs
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{products.length}</div>
          <span className="text-[11px] text-slate-400">Products in database</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Stock Valuation (Cost)
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(totalValuationCost, settings.currencySymbol)}
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold">
            Retail: {formatCurrency(totalValuationRetail, settings.currencySymbol)}
          </span>
        </div>

        <div 
          onClick={() => setStatusFilter('low_stock')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs cursor-pointer hover:border-amber-400 transition-colors"
        >
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
            Low Stock Warnings
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">{alerts.lowStockCount}</div>
          <span className="text-[11px] text-slate-400">Below minimum threshold</span>
        </div>

        <div 
          onClick={() => setStatusFilter('expired')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs cursor-pointer hover:border-rose-400 transition-colors"
        >
          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
            Expired / Near Expiry
          </span>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {alerts.expiredCount + alerts.nearExpiryCount}
          </div>
          <span className="text-[11px] text-slate-400">Within {settings.expiryWarningDays} days</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by Product Name, Barcode, SKU, Brand or Aisle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Categories ({products.length})</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-none text-xs">
          {[
            { id: 'all', label: 'All Items', count: products.length },
            { id: 'in_stock', label: 'In Stock', count: products.filter(p => p.stock > p.minStockThreshold).length },
            { id: 'low_stock', label: 'Low Stock', count: alerts.lowStockCount, badgeColor: 'bg-amber-100 text-amber-800' },
            { id: 'out_of_stock', label: 'Out of Stock', count: alerts.outOfStockCount, badgeColor: 'bg-rose-100 text-rose-800' },
            { id: 'expiring', label: 'Near Expiry', count: alerts.nearExpiryCount, badgeColor: 'bg-purple-100 text-purple-800' },
            { id: 'expired', label: 'Expired', count: alerts.expiredCount, badgeColor: 'bg-red-100 text-red-800' },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as StockStatusFilter)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    tab.badgeColor || (isSelected ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700')
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3.5">Product & SKU</th>
                <th className="px-3 py-3.5">Category</th>
                <th className="px-3 py-3.5">Stock Level</th>
                <th className="px-3 py-3.5 text-right">Cost</th>
                <th className="px-3 py-3.5 text-right">MRP / Selling</th>
                <th className="px-3 py-3.5 text-center">Margin</th>
                <th className="px-3 py-3.5">Aisle / Batch</th>
                <th className="px-3 py-3.5">Expiry</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No products found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOut = isProductOutOfStock(p);
                  const isLow = isProductLowStock(p, settings.lowStockGlobalThreshold);
                  const isExp = isProductExpired(p);
                  const isNearExp = isProductNearExpiry(p, settings.expiryWarningDays);
                  const daysToExpiry = getDaysUntilExpiry(p.expiryDate);
                  const marginPct =
                    p.sellingPrice > 0
                      ? Number((((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100).toFixed(1))
                      : 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Name, SKU & Barcode */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono mt-0.5">
                          <span>{p.sku}</span>
                          <span>•</span>
                          <span>{p.barcode}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-3 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {p.category}
                        </span>
                      </td>

                      {/* Stock Level with Visual Color Indicator */}
                      <td className="px-3 py-3">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`font-black text-xs ${
                              isOut
                                ? 'text-rose-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-slate-900'
                            }`}
                          >
                            {p.stock} {p.unit}
                          </span>
                          {isOut ? (
                            <span className="text-[9px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                              Out
                            </span>
                          ) : isLow ? (
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                              Low (&lt;{p.minStockThreshold})
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="px-3 py-3 text-right font-mono text-slate-600">
                        {formatCurrency(p.costPrice, settings.currencySymbol)}
                      </td>

                      {/* Selling Price */}
                      <td className="px-3 py-3 text-right font-mono font-bold text-emerald-800">
                        {formatCurrency(p.sellingPrice, settings.currencySymbol)}
                      </td>

                      {/* Margin % */}
                      <td className="px-3 py-3 text-center">
                        <span
                          className={`font-bold text-[11px] ${
                            marginPct >= 30
                              ? 'text-emerald-700'
                              : marginPct >= 15
                              ? 'text-slate-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {marginPct}%
                        </span>
                      </td>

                      {/* Location & Batch */}
                      <td className="px-3 py-3 text-[11px] text-slate-600">
                        <div>{p.location || '—'}</div>
                        {p.batchNo && <span className="font-mono text-[10px] text-slate-400">{p.batchNo}</span>}
                      </td>

                      {/* Expiry Date */}
                      <td className="px-3 py-3 text-[11px]">
                        {p.expiryDate ? (
                          <div>
                            <span>{formatDate(p.expiryDate)}</span>
                            {isExp ? (
                              <span className="block text-[9px] font-bold text-rose-700 bg-rose-50 px-1 rounded mt-0.5">
                                Expired
                              </span>
                            ) : isNearExp ? (
                              <span className="block text-[9px] font-bold text-purple-700 bg-purple-50 px-1 rounded mt-0.5">
                                In {daysToExpiry}d
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setSelectedProductForAdjust(p)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors"
                            title="Adjust Stock / Physical Audit"
                          >
                            Adjust Stock
                          </button>
                          <button
                            onClick={() => setSelectedProductForEdit(p)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete product "${p.name}"?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-4 py-3 bg-slate-50/70 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Showing {filteredProducts.length} of {products.length} products</span>
          <span className="font-semibold text-slate-700">
            Total Inventory Units: {filteredProducts.reduce((a, b) => a + b.stock, 0)}
          </span>
        </div>
      </div>

      {/* Product Add / Edit Modal */}
      <ProductModal
        isOpen={isAddModalOpen || selectedProductForEdit !== null}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedProductForEdit(null);
        }}
        productToEdit={selectedProductForEdit}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={selectedProductForAdjust !== null}
        onClose={() => setSelectedProductForAdjust(null)}
        product={selectedProductForAdjust}
      />

      {/* Barcode Labels Modal */}
      <BarcodeLabelSheet
        isOpen={isLabelsOpen}
        onClose={() => setIsLabelsOpen(false)}
        productsToPrint={filteredProducts.slice(0, 18)}
      />
    </div>
  );
};
