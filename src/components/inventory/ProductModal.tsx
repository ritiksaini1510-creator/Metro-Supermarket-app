import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useStore } from '../../context/StoreContext';
import { Product, ProductCategory, UnitType } from '../../types';
import { Sparkles, Save, Tag, Barcode, DollarSign, PackageCheck, AlertTriangle } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

const CATEGORIES: ProductCategory[] = [
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

const UNITS: UnitType[] = ['pcs', 'kg', 'g', 'liter', 'ml', 'pack', 'box', 'dozen'];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { addProduct, updateProduct, suppliers, settings } = useStore();

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: 'Packaged Foods' as ProductCategory,
    barcode: '',
    sku: '',
    unit: 'pcs' as UnitType,
    costPrice: 0,
    sellingPrice: 0,
    stock: 0,
    minStockThreshold: 10,
    taxRate: 5,
    expiryDate: '',
    batchNo: '',
    location: '',
    supplierId: '',
  });

  useEffect(() => {
    if (productToEdit) {
      setFormData({
        name: productToEdit.name,
        brand: productToEdit.brand || '',
        category: productToEdit.category,
        barcode: productToEdit.barcode,
        sku: productToEdit.sku,
        unit: productToEdit.unit,
        costPrice: productToEdit.costPrice,
        sellingPrice: productToEdit.sellingPrice,
        stock: productToEdit.stock,
        minStockThreshold: productToEdit.minStockThreshold,
        taxRate: productToEdit.taxRate,
        expiryDate: productToEdit.expiryDate || '',
        batchNo: productToEdit.batchNo || '',
        location: productToEdit.location || '',
        supplierId: productToEdit.supplierId || '',
      });
    } else {
      // Auto generate random SKU & Barcode for convenience
      const randNum = Math.floor(100000 + Math.random() * 900000);
      setFormData({
        name: '',
        brand: '',
        category: 'Packaged Foods',
        barcode: `890103${randNum}`,
        sku: `SKU-${randNum}`,
        unit: 'pcs',
        costPrice: 0,
        sellingPrice: 0,
        stock: 20,
        minStockThreshold: 10,
        taxRate: settings.defaultTaxRate,
        expiryDate: '',
        batchNo: `BTH-${Math.floor(100 + Math.random() * 900)}`,
        location: 'Aisle 1 - Shelf A',
        supplierId: suppliers[0]?.id || '',
      });
    }
  }, [productToEdit, isOpen, suppliers, settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.barcode.trim()) return;

    if (productToEdit) {
      updateProduct(productToEdit.id, formData);
    } else {
      addProduct({
        ...formData,
        isActive: true,
      });
    }

    onClose();
  };

  const marginPercent =
    formData.sellingPrice > 0
      ? Number((((formData.sellingPrice - formData.costPrice) / formData.sellingPrice) * 100).toFixed(1))
      : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'Edit Supermarket Product' : 'Add New Inventory Product'}
      subtitle={productToEdit ? `Modifying SKU: ${productToEdit.sku}` : 'Register SKU, barcode, supplier & price details'}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Row 1: Name, Brand, Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Product Title *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Organic Almond Milk (1 Liter)"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Brand / Manufacturer
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="e.g. Nature Valley"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Row 2: Category, Unit, Supplier */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Measurement Unit *
            </label>
            <select
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value as UnitType })}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Primary Supplier
            </label>
            <select
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="">Direct / Self Sourced</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.companyName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 3: Barcode, SKU, Batch */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Barcode (EAN/UPC) *
            </label>
            <input
              type="text"
              required
              value={formData.barcode}
              onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              placeholder="e.g. 890103000100"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Internal SKU Code
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="e.g. SKU-PROD-99"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Batch No.
            </label>
            <input
              type="text"
              value={formData.batchNo}
              onChange={(e) => setFormData({ ...formData, batchNo: e.target.value })}
              placeholder="e.g. BTH-8902"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Row 4: Pricing & Margin Calculator Box */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Purchase Cost ({settings.currencySymbol})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Retail Selling MRP ({settings.currencySymbol}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-white border border-emerald-500 rounded-xl text-xs font-bold text-emerald-950 ring-1 ring-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tax Rate (GST / VAT %)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold"
              />
            </div>

            <div className="flex flex-col justify-center">
              <span className="text-[11px] font-semibold text-slate-500">Gross Margin</span>
              <span className={`text-sm font-black ${marginPercent > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                {marginPercent}% profit
              </span>
            </div>
          </div>
        </div>

        {/* Row 5: Stock Levels & Expiry */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Current Stock Qty
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseFloat(e.target.value) || 0 })}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Low Stock Alert Limit
            </label>
            <input
              type="number"
              min="1"
              value={formData.minStockThreshold}
              onChange={(e) => setFormData({ ...formData, minStockThreshold: parseInt(e.target.value) || 5 })}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Expiry Date
            </label>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Aisle / Shelf Rack
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Aisle 3 - Shelf B"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center space-x-2 shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{productToEdit ? 'Save Changes' : 'Register Product'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
