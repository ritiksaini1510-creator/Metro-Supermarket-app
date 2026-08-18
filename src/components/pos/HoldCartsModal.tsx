import React from 'react';
import { Modal } from '../common/Modal';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { PauseCircle, PlayCircle, Trash2, Clock, ShoppingCart } from 'lucide-react';

interface HoldCartsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HoldCartsModal: React.FC<HoldCartsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { parkedCarts, restoreParkedCart, deleteParkedCart, settings } = useStore();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Parked Customer Carts"
      subtitle="Resume customer checkouts that were put on hold"
      maxWidth="lg"
    >
      <div className="space-y-4">
        {parkedCarts.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <PauseCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold">No carts currently on hold</p>
            <p className="text-xs text-slate-400 mt-1">
              Use "Park Cart" during POS billing if a customer needs to pick up another grocery item.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {parkedCarts.map((pc) => {
              const totalItems = pc.items.reduce((acc, i) => acc + i.quantity, 0);
              const grandTotal = pc.items.reduce((acc, i) => acc + i.total, 0);

              return (
                <div
                  key={pc.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-emerald-300 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-900">{pc.name}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-slate-500" />
                        {formatDateTime(pc.parkedAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500">
                      {totalItems} items ({pc.items.map((i) => i.product.name).slice(0, 2).join(', ')}
                      {pc.items.length > 2 ? '...' : ''})
                    </p>

                    {pc.customer?.phone && (
                      <p className="text-[11px] text-slate-600 font-mono">
                        Phone: {pc.customer.phone}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-auto">
                    <span className="text-sm font-black text-slate-900">
                      {formatCurrency(grandTotal, settings.currencySymbol)}
                    </span>

                    <button
                      onClick={() => {
                        restoreParkedCart(pc.id);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 transition-colors shadow-xs"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Resume</span>
                    </button>

                    <button
                      onClick={() => deleteParkedCart(pc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Discard Parked Cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
