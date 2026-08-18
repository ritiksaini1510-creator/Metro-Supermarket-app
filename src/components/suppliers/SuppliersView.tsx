import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Download,
  Phone,
  Mail,
  Building,
  Edit2,
  Trash2,
  CreditCard,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Supplier } from '../../types';
import { formatCurrency, exportToCSV } from '../../utils/helpers';
import { SupplierModal } from './SupplierModal';
import { RecordPaymentModal } from './RecordPaymentModal';

export const SuppliersView: React.FC = () => {
  const { suppliers, deleteSupplier, settings, purchases } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplierForEdit, setSelectedSupplierForEdit] = useState<Supplier | null>(null);
  const [selectedSupplierForPay, setSelectedSupplierForPay] = useState<Supplier | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const totalOutstanding = suppliers.reduce((acc, s) => acc + s.balanceDue, 0);
  const totalVolume = suppliers.reduce((acc, s) => acc + s.totalPurchased, 0);

  const filteredSuppliers = suppliers.filter((s) => {
    const clean = searchQuery.toLowerCase().trim();
    return (
      !clean ||
      s.companyName.toLowerCase().includes(clean) ||
      s.name.toLowerCase().includes(clean) ||
      s.phone.includes(clean) ||
      s.email.toLowerCase().includes(clean)
    );
  });

  const handleExportCSV = () => {
    const data = filteredSuppliers.map((s) => ({
      CompanyName: s.companyName,
      ContactPerson: s.name,
      Phone: s.phone,
      Email: s.email,
      TaxID: s.gstin || '',
      Address: s.address,
      PaymentTerms: s.paymentTerms,
      TotalPurchased: s.totalPurchased,
      TotalPaid: s.totalPaid,
      BalanceDue: s.balanceDue,
    }));
    exportToCSV(data, 'Supermarket_Suppliers_Directory');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>Supplier & Vendor Accounts</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Vendor master directory, credit terms, purchase history and ledger balances
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            id="add-supplier-btn"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Active Supplier Partners
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">{suppliers.length}</div>
          <span className="text-[11px] text-slate-400">Registered vendor accounts</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Total Sourced Volume
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(totalVolume, settings.currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400">Cumulative purchase history</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
            Total Outstanding Payable
          </span>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {formatCurrency(totalOutstanding, settings.currencySymbol)}
          </div>
          <span className="text-[11px] text-slate-400">Pending credit balance</span>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search suppliers by company, representative, phone or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Supplier Grid / Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map((s) => {
          const linkedPOs = purchases.filter((p) => p.supplierId === s.id);

          return (
            <div
              key={s.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-emerald-300 transition-colors"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 tracking-tight">{s.companyName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{s.name || 'Sales Desk'}</p>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                    {s.paymentTerms}
                  </span>
                </div>

                {/* Contact details */}
                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{s.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{s.email}</span>
                  </div>
                </div>

                {/* Categories */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {s.categoriesSupplied.map((c) => (
                    <span
                      key={c}
                      className="text-[9px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {/* Financial Box */}
              <div className="pt-3 border-t border-slate-100 bg-slate-50 -mx-5 -mb-5 p-4 rounded-b-2xl space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Total Purchases:</span>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(s.totalPurchased, settings.currencySymbol)}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Balance Pending:</span>
                  <span className={`font-black ${s.balanceDue > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                    {formatCurrency(s.balanceDue, settings.currencySymbol)}
                  </span>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setSelectedSupplierForEdit(s)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
                      title="Edit Profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete supplier ${s.companyName}?`)) {
                          deleteSupplier(s.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Supplier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {s.balanceDue > 0 && (
                    <button
                      onClick={() => setSelectedSupplierForPay(s)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                    >
                      Pay Balance
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Supplier Modal */}
      <SupplierModal
        isOpen={isAddModalOpen || selectedSupplierForEdit !== null}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedSupplierForEdit(null);
        }}
        supplierToEdit={selectedSupplierForEdit}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={selectedSupplierForPay !== null}
        onClose={() => setSelectedSupplierForPay(null)}
        supplier={selectedSupplierForPay}
      />
    </div>
  );
};
