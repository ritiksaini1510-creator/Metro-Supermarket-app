import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useStore } from '../../context/StoreContext';
import { Supplier, ProductCategory } from '../../types';
import { Users, Save, Phone, Mail, Building, FileText } from 'lucide-react';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierToEdit?: Supplier | null;
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

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  supplierToEdit,
}) => {
  const { addSupplier, updateSupplier } = useStore();

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    phone: '',
    email: '',
    gstin: '',
    address: '',
    categoriesSupplied: ['Fresh Produce'] as ProductCategory[],
    paymentTerms: 'Net 30',
  });

  useEffect(() => {
    if (supplierToEdit) {
      setFormData({
        name: supplierToEdit.name,
        companyName: supplierToEdit.companyName,
        phone: supplierToEdit.phone,
        email: supplierToEdit.email,
        gstin: supplierToEdit.gstin || '',
        address: supplierToEdit.address,
        categoriesSupplied: supplierToEdit.categoriesSupplied,
        paymentTerms: supplierToEdit.paymentTerms,
      });
    } else {
      setFormData({
        name: '',
        companyName: '',
        phone: '',
        email: '',
        gstin: '',
        address: '',
        categoriesSupplied: ['Fresh Produce'],
        paymentTerms: 'Net 30',
      });
    }
  }, [supplierToEdit, isOpen]);

  const handleCategoryToggle = (cat: ProductCategory) => {
    if (formData.categoriesSupplied.includes(cat)) {
      setFormData({
        ...formData,
        categoriesSupplied: formData.categoriesSupplied.filter((c) => c !== cat),
      });
    } else {
      setFormData({
        ...formData,
        categoriesSupplied: [...formData.categoriesSupplied, cat],
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim()) return;

    if (supplierToEdit) {
      updateSupplier(supplierToEdit.id, formData);
    } else {
      addSupplier(formData);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplierToEdit ? 'Edit Supplier Profile' : 'Add New Vendor / Supplier'}
      subtitle="Maintain supplier contacts, payment terms and categories supplied"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Company / Vendor Name *
            </label>
            <input
              type="text"
              required
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="e.g. Apex Dairy & Beverages Ltd"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Contact Representative Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Marcus Vance"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="orders@vendor.com"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Payment Terms
            </label>
            <select
              value={formData.paymentTerms}
              onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="Immediate">Immediate / COD</option>
              <option value="Net 7">Net 7 Days</option>
              <option value="Net 15">Net 15 Days</option>
              <option value="Net 30">Net 30 Days</option>
              <option value="Net 60">Net 60 Days</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              GSTIN / Tax Identification ID
            </label>
            <input
              type="text"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
              placeholder="e.g. TAX-APX-88210"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Warehouse / Factory Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="City, State, Zip"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Categories Supplied Pills */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Supplied Product Categories
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => {
              const isChecked = formData.categoriesSupplied.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategoryToggle(cat)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    isChecked
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>{supplierToEdit ? 'Save Profile' : 'Register Supplier'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
