import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { Camera, ScanLine, Search, CheckCircle, AlertCircle, RefreshCw, Smartphone } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { formatCurrency, playScannerBeep, playWarningBeep } from '../../utils/helpers';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete: (product: Product) => void;
  title?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanComplete,
  title = 'Barcode Scanner & Fast Lookup',
}) => {
  const { products, settings } = useStore();
  const [manualCode, setManualCode] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera on close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setManualCode('');
      setLastScannedProduct(null);
    }
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported in this browser environment.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: unknown) {
      const e = err as Error;
      console.warn('Camera access error:', e);
      setCameraError('Camera access denied or unavailable in iframe. Use the Quick Barcode Simulator below.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    const query = manualCode.trim().toLowerCase();
    const found = products.find(
      (p) =>
        p.barcode.toLowerCase() === query ||
        p.sku.toLowerCase() === query ||
        p.name.toLowerCase().includes(query)
    );

    if (found) {
      playScannerBeep();
      setLastScannedProduct(found);
      onScanComplete(found);
      setManualCode('');
    } else {
      playWarningBeep();
      setCameraError(`No product found matching Barcode / SKU "${manualCode}".`);
    }
  };

  const handleProductSelect = (product: Product) => {
    playScannerBeep();
    setLastScannedProduct(product);
    onScanComplete(product);
  };

  const filteredQuickProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.barcode.includes(filterQuery) ||
      p.category.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        stopCamera();
        onClose();
      }}
      title={title}
      subtitle="Scan with camera, type barcode/SKU, or tap any product tag to simulate scanning"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Camera / Visual Scanner Viewport */}
        <div className="bg-slate-950 rounded-2xl overflow-hidden p-4 border border-slate-800 text-white relative shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <ScanLine className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span className="text-sm font-bold tracking-tight">Optical Barcode Scanner Engine</span>
            </div>
            {!cameraActive ? (
              <button
                onClick={startCamera}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Start Live Camera</span>
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="px-3 py-1.5 bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Stop Camera
              </button>
            )}
          </div>

          {cameraActive ? (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black flex items-center justify-center border-2 border-emerald-500/50">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              {/* Laser Line Animation */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-3/4 h-36 border-2 border-dashed border-emerald-400/80 rounded-xl relative flex items-center justify-center">
                  <div className="w-full h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse"></div>
                  <span className="absolute bottom-2 text-[10px] text-emerald-300 bg-black/60 px-2 py-0.5 rounded">
                    Align Barcode within box
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-6 px-4 text-center rounded-xl bg-slate-900 border border-slate-800 border-dashed">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <Smartphone className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Ready for USB / Bluetooth Laser Barcode Scanner or Keyboard input
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Hardware barcode guns automatically fire directly into the input below
              </p>
            </div>
          )}

          {cameraError && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}
        </div>

        {/* Manual Barcode Input Form */}
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Type or paste Barcode (e.g. 890103000001) or SKU..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              autoFocus
            />
            <ScanLine className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-all shadow-xs shrink-0"
          >
            Scan & Add
          </button>
        </form>

        {/* Last Scanned Feedback Toast */}
        {lastScannedProduct && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between animate-in fade-in">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-emerald-950">{lastScannedProduct.name}</p>
                <p className="text-[11px] text-emerald-700">
                  Barcode: <span className="font-mono">{lastScannedProduct.barcode}</span> • Price:{' '}
                  <span className="font-bold">{formatCurrency(lastScannedProduct.sellingPrice, settings.currencySymbol)}</span> • Stock:{' '}
                  <span className="font-bold">{lastScannedProduct.stock} {lastScannedProduct.unit}</span>
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200 text-emerald-900 px-2 py-1 rounded-md">
              Scanned
            </span>
          </div>
        )}

        {/* Quick Click Barcode Simulator List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Quick Barcode Tap-to-Scan Simulator
            </h4>
            <div className="relative w-44">
              <input
                type="text"
                placeholder="Filter items..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full pl-7 pr-2 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {filteredQuickProducts.slice(0, 12).map((prod) => (
              <button
                key={prod.id}
                onClick={() => handleProductSelect(prod)}
                disabled={prod.stock <= 0}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  prod.stock <= 0
                    ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                    : 'bg-white hover:bg-emerald-50/50 hover:border-emerald-300 border-slate-200 shadow-2xs hover:scale-[1.01]'
                }`}
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-slate-900 truncate">{prod.name}</p>
                  <p className="text-[10px] font-mono text-slate-500">
                    BARCODE: <span className="text-slate-800 font-bold">{prod.barcode}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-emerald-700">
                    {formatCurrency(prod.sellingPrice, settings.currencySymbol)}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {prod.stock > 0 ? `${prod.stock} in stock` : 'Out of stock'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition-colors"
          >
            Done Scanning
          </button>
        </div>
      </div>
    </Modal>
  );
};
