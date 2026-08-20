import React, { useState, useEffect } from 'react';
import {
  Store,
  Phone,
  MapPin,
  User,
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  CreditCard,
  KeyRound
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { StoreAuthSession } from '../../types';

interface StoreLoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const StoreLoginModal: React.FC<StoreLoginModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { authSession, loginStore } = useStore();

  const [formData, setFormData] = useState<Partial<StoreAuthSession>>({
    storeName: authSession.storeName || '',
    phone: authSession.phone || '',
    address: authSession.address || '',
    ownerName: authSession.ownerName || '',
    role: authSession.role || 'owner',
    gstin: authSession.gstin || '',
    pin: authSession.pin || '',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Synchronize when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        storeName: authSession.storeName || 'Aapka Supermarket & Kirana',
        phone: authSession.phone || '+91 98765 43210',
        address: authSession.address || 'Shop No. 12, Main Market Road, Commercial Complex, Sector 18',
        ownerName: authSession.ownerName || 'Ritik Saini',
        role: authSession.role || 'owner',
        gstin: authSession.gstin || '07AAAAA0000A1Z5',
        pin: authSession.pin || '1234',
      });
      setErrorMsg(null);
    }
  }, [isOpen, authSession]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.storeName?.trim()) {
      setErrorMsg('Please enter your Store / Business Name.');
      return;
    }
    if (!formData.phone?.trim() || formData.phone.trim().length < 6) {
      setErrorMsg('Please enter a valid Mobile Number (e.g. +91 98765 43210).');
      return;
    }
    if (!formData.address?.trim()) {
      setErrorMsg('Please enter your Store Address.');
      return;
    }
    if (!formData.ownerName?.trim()) {
      setErrorMsg('Please enter the Cashier or Store Owner Name.');
      return;
    }

    loginStore({
      storeName: formData.storeName.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      ownerName: formData.ownerName.trim(),
      role: formData.role || 'owner',
      gstin: formData.gstin?.trim() || '',
      pin: formData.pin || '1234',
    });

    setSuccessNotice('Login successful! Redirecting to POS Terminal...');
    setTimeout(() => {
      setSuccessNotice(null);
      if (onClose) onClose();
    }, 400);
  };

  const handleQuickFill = (type: 'ritik' | 'metro' | 'kirana') => {
    if (type === 'ritik') {
      setFormData({
        storeName: 'Ritik Supermarket & Retail Mart',
        phone: '+91 98765 43210',
        address: 'Shop No. 14-16, Commercial Plaza, Main Market, Sector 18',
        ownerName: 'Ritik Saini (Admin / Owner)',
        role: 'owner',
        gstin: '07AAAAA0000A1Z5',
        pin: '1234',
      });
    } else if (type === 'metro') {
      setFormData({
        storeName: 'MetroFresh Departmental Store',
        phone: '+91 98111 22334',
        address: 'B-Block Market, Ground Floor, Central Avenue',
        ownerName: 'Alex Morgan (Lane 01)',
        role: 'cashier',
        gstin: '06BBBBB1111B1Z2',
        pin: '0000',
      });
    } else {
      setFormData({
        storeName: 'Aapka Kirana & Grocery Store',
        phone: '+91 99887 76655',
        address: '42 Main Bazaar Chowk, Near Railway Station',
        ownerName: 'Priya Sharma (Manager)',
        role: 'manager',
        gstin: '08CCCCC2222C1Z8',
        pin: '1122',
      });
    }
    setErrorMsg(null);
  };

  const canDismiss = authSession.isLoggedIn;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-6 text-white relative">
          {canDismiss && onClose && (
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/30">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black tracking-tight text-white">Store Login & Terminal</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  ₹ INR Currency
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Sign in with your Store Name, Mobile No., and Address for bills & ERP.
              </p>
            </div>
          </div>

          {/* Quick preset chips */}
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Quick Fill:</span>
            <button
              type="button"
              onClick={() => handleQuickFill('ritik')}
              className="text-[11px] font-bold bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-200 px-2.5 py-1 rounded-lg border border-white/15 transition-all flex items-center space-x-1"
            >
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Ritik Supermarket</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('kirana')}
              className="text-[11px] font-bold bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-200 px-2.5 py-1 rounded-lg border border-white/15 transition-all flex items-center space-x-1"
            >
              <span>Aapka Kirana</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('metro')}
              className="text-[11px] font-bold bg-white/10 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-200 px-2.5 py-1 rounded-lg border border-white/15 transition-all flex items-center space-x-1"
            >
              <span>MetroFresh Mart</span>
            </button>
          </div>
        </div>

        {/* Error / Success Notices */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {successNotice && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{successNotice}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Store Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Store / Business Name *</span>
            </label>
            <input
              type="text"
              required
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              placeholder="e.g. Ritik Supermarket & Kirana Mart"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
            />
            <p className="text-[11px] text-slate-400 mt-1">This name will be printed at the top of receipts and invoices.</p>
          </div>

          {/* Grid: Mobile No. & Owner/Cashier Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mobile Number *</span>
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cashier / Owner Name *</span>
              </label>
              <input
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="e.g. Ritik Saini"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Store Address Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Store Address *</span>
            </label>
            <textarea
              required
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g. Shop No. 12, Main Market Road, Commercial Complex, Sector 18"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Grid: GSTIN / Tax ID & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>GSTIN / Tax ID (Optional)</span>
              </label>
              <input
                type="text"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                placeholder="07AAAAA0000A1Z5"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>Terminal Role / Lane</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'owner' | 'manager' | 'cashier' })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
              >
                <option value="owner">Store Owner / Admin (Full Access)</option>
                <option value="manager">Store Manager / Inventory Head</option>
                <option value="cashier">Cashier Counter / Billing Lane</option>
              </select>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2"
            >
              <span>Login to Store Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>INR Currency (₹) Active</span>
              </span>
              <span>Local Offline Persistence Enabled</span>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
