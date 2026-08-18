import React from 'react';
import { Modal } from '../common/Modal';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatCurrency } from '../../utils/helpers';
import { Printer, Barcode, Tag } from 'lucide-react';

interface BarcodeLabelSheetProps {
  isOpen: boolean;
  onClose: () => void;
  productsToPrint: Product[];
}

export const BarcodeLabelSheet: React.FC<BarcodeLabelSheetProps> = ({
  isOpen,
  onClose,
  productsToPrint,
}) => {
  const { settings } = useStore();

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Print Shelf Edge & Product Barcode Labels"
      subtitle="Standard retail shelf tags with price, barcode & location tags"
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="flex items-center space-x-2 text-xs text-slate-700">
            <Tag className="w-4 h-4 text-emerald-600" />
            <span>Ready to print <strong>{productsToPrint.length}</strong> barcode tags</span>
          </div>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Label Sheet</span>
          </button>
        </div>

        {/* Printable Grid of Shelf Tags */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-white border border-slate-200 rounded-2xl max-h-[60vh] overflow-y-auto print:max-h-none print:border-none">
          {productsToPrint.map((prod) => (
            <div
              key={prod.id}
              className="p-3 rounded-xl border-2 border-dashed border-slate-300 bg-amber-50/20 flex flex-col justify-between space-y-2 text-slate-900 break-inside-avoid"
            >
              <div>
                <div className="flex justify-between items-start text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  <span>{settings.storeName}</span>
                  <span className="text-emerald-700">{prod.location || 'Aisle 1'}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-950 mt-1 line-clamp-2 leading-tight">
                  {prod.name}
                </h4>
              </div>

              {/* Price Banner */}
              <div className="bg-slate-900 text-white px-2 py-1 rounded-lg flex items-baseline justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate-300">PRICE</span>
                <div className="text-sm font-black">
                  {formatCurrency(prod.sellingPrice, settings.currencySymbol)}
                  <span className="text-[10px] text-slate-300 font-normal ml-0.5">/{prod.unit}</span>
                </div>
              </div>

              {/* Barcode Strip */}
              <div className="text-center pt-1">
                <div className="flex justify-center items-center h-6 gap-0.5 max-w-[140px] mx-auto overflow-hidden">
                  {Array.from({ length: 26 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-full ${i % 3 === 0 ? 'w-1 bg-black' : i % 2 === 0 ? 'w-0.5 bg-black' : 'w-1.5 bg-black'}`}
                    />
                  ))}
                </div>
                <p className="text-[9px] font-mono font-bold tracking-wider text-slate-700 mt-0.5">
                  {prod.barcode}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
